import prisma from "../../../configurations/db.postgres.js";
import { ApiError } from "../../../utils/ApiError.js";
import UserRepository from "../../users/repositories/user.repository.js";
import CourseRepository from "../../courses/repositories/courses.repository.js";
import ContentRepository from "../repositories/content.repository.js";
import CloudinaryRepository from "../repositories/cloudinary.repository.js";
import { CONTENT_MESSAGES } from "../content.constants.js";

class ContentService {
    // ─── Authorization & Helper Validations ──────────────────────────────────

    async getActorRoles(actorId) {
        const user = await UserRepository.findById(actorId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        return user.userRoles.map((ur) => ur.role.key);
    }

    async validateOwnershipOrAdmin(actorId, courseId) {
        const roles = await this.getActorRoles(actorId);
        if (roles.includes("super_admin") || roles.includes("admin")) {
            return;
        }
        if (!roles.includes("instructor")) {
            throw new ApiError(403, CONTENT_MESSAGES.NOT_OWNER);
        }
        const isInstructor = await CourseRepository.hasInstructor(courseId, actorId);
        if (!isInstructor) {
            throw new ApiError(403, CONTENT_MESSAGES.NOT_OWNER);
        }
    }

    async validateStudentVisibility(actorId, courseId, sectionPublished, contentPublished = true) {
        const roles = await this.getActorRoles(actorId);
        if (roles.includes("super_admin") || roles.includes("admin")) {
            return;
        }

        // If the actor is an instructor for this course, they bypass visibility rules
        const isInstructor = await CourseRepository.hasInstructor(courseId, actorId);
        if (isInstructor && roles.includes("instructor")) {
            return;
        }

        // Fetch enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId: actorId,
                    courseId: courseId,
                },
            },
        });

        if (!enrollment || enrollment.status !== "APPROVED") {
            throw new ApiError(403, CONTENT_MESSAGES.NOT_ENROLLED);
        }

        // Fetch course status
        const course = await CourseRepository.findById(courseId);
        if (!course || course.status !== "PUBLISHED" || course.deletedAt) {
            throw new ApiError(403, "Course is not published");
        }

        if (!sectionPublished) {
            throw new ApiError(403, CONTENT_MESSAGES.UNPUBLISHED_CONTENT);
        }

        if (!contentPublished) {
            throw new ApiError(403, CONTENT_MESSAGES.UNPUBLISHED_CONTENT);
        }
    }

    // ─── Sections ────────────────────────────────────────────────────────────

    async createSection(actorId, payload) {
        const course = await CourseRepository.findById(payload.courseId);
        if (!course || course.deletedAt) {
            throw new ApiError(404, CONTENT_MESSAGES.COURSE_NOT_FOUND);
        }

        await this.validateOwnershipOrAdmin(actorId, payload.courseId);

        let position = payload.position;
        if (position === undefined) {
            position = await ContentRepository.findNextSectionPosition(payload.courseId);
        }

        return ContentRepository.createSection({
            courseId: payload.courseId,
            title: payload.title,
            description: payload.description,
            position,
            isPublished: false,
        });
    }

    async getSectionById(actorId, sectionId) {
        const section = await ContentRepository.findSectionById(sectionId);
        if (!section) {
            throw new ApiError(404, CONTENT_MESSAGES.SECTION_NOT_FOUND);
        }

        await this.validateStudentVisibility(actorId, section.courseId, section.isPublished);

        // Filter unpublished contents for students
        const roles = await this.getActorRoles(actorId);
        const isInstructor = await CourseRepository.hasInstructor(section.courseId, actorId);
        const bypassPublished = roles.includes("super_admin") || roles.includes("admin") || (isInstructor && roles.includes("instructor"));

        if (!bypassPublished) {
            section.contents = section.contents.filter((c) => c.isPublished);
        }

        return section;
    }

    async updateSection(actorId, sectionId, payload) {
        const section = await ContentRepository.findSectionById(sectionId);
        if (!section) {
            throw new ApiError(404, CONTENT_MESSAGES.SECTION_NOT_FOUND);
        }

        await this.validateOwnershipOrAdmin(actorId, section.courseId);

        const updateData = {};
        if (payload.title !== undefined) updateData.title = payload.title;
        if (payload.description !== undefined) updateData.description = payload.description;
        if (payload.position !== undefined) updateData.position = payload.position;

        return ContentRepository.updateSection(sectionId, updateData);
    }

    async deleteSection(actorId, sectionId) {
        const section = await ContentRepository.findSectionById(sectionId);
        if (!section) {
            throw new ApiError(404, CONTENT_MESSAGES.SECTION_NOT_FOUND);
        }

        await this.validateOwnershipOrAdmin(actorId, section.courseId);

        await ContentRepository.deleteSection(sectionId);
    }

    async reorderSection(actorId, sectionId, position) {
        const section = await ContentRepository.findSectionById(sectionId);
        if (!section) {
            throw new ApiError(404, CONTENT_MESSAGES.SECTION_NOT_FOUND);
        }

        await this.validateOwnershipOrAdmin(actorId, section.courseId);

        const maxPosition = await ContentRepository.countSectionsInCourse(section.courseId) - 1;
        const targetPosition = Math.min(Math.max(0, position), Math.max(0, maxPosition));

        return ContentRepository.reorderSections(section.courseId, sectionId, targetPosition);
    }

    async publishSection(actorId, sectionId, isPublished = true) {
        const section = await ContentRepository.findSectionById(sectionId);
        if (!section) {
            throw new ApiError(404, CONTENT_MESSAGES.SECTION_NOT_FOUND);
        }

        await this.validateOwnershipOrAdmin(actorId, section.courseId);

        return ContentRepository.updateSection(sectionId, { isPublished });
    }

    // ─── Contents ────────────────────────────────────────────────────────────

    async createContent(actorId, payload) {
        const section = await ContentRepository.findSectionById(payload.sectionId);
        if (!section) {
            throw new ApiError(404, CONTENT_MESSAGES.SECTION_NOT_FOUND);
        }

        await this.validateOwnershipOrAdmin(actorId, section.courseId);

        let position = payload.position;
        if (position === undefined) {
            position = await ContentRepository.findNextContentPosition(payload.sectionId);
        }

        // Validate content asset constraints
        if (["VIDEO", "PDF", "IMAGE", "AUDIO"].includes(payload.contentType)) {
            if (!payload.asset) {
                throw new ApiError(400, "Asset details are required for media content type");
            }
        }

        return ContentRepository.createContent({
            sectionId: payload.sectionId,
            title: payload.title,
            description: payload.description,
            contentType: payload.contentType,
            position,
            createdById: actorId,
            asset: payload.asset,
        });
    }

    async getContentById(actorId, contentId) {
        const content = await ContentRepository.findContentById(contentId);
        if (!content) {
            throw new ApiError(404, CONTENT_MESSAGES.CONTENT_NOT_FOUND);
        }

        await this.validateStudentVisibility(
            actorId,
            content.section.courseId,
            content.section.isPublished,
            content.isPublished
        );

        return content;
    }

    async updateContent(actorId, contentId, payload) {
        const content = await ContentRepository.findContentById(contentId);
        if (!content) {
            throw new ApiError(404, CONTENT_MESSAGES.CONTENT_NOT_FOUND);
        }

        await this.validateOwnershipOrAdmin(actorId, content.section.courseId);

        const updateData = {};
        if (payload.title !== undefined) updateData.title = payload.title;
        if (payload.description !== undefined) updateData.description = payload.description;
        if (payload.contentType !== undefined) updateData.contentType = payload.contentType;
        if (payload.position !== undefined) updateData.position = payload.position;
        if (payload.asset !== undefined) updateData.asset = payload.asset;

        return ContentRepository.updateContent(contentId, updateData);
    }

    async deleteContent(actorId, contentId) {
        const content = await ContentRepository.findContentById(contentId);
        if (!content) {
            throw new ApiError(404, CONTENT_MESSAGES.CONTENT_NOT_FOUND);
        }

        await this.validateOwnershipOrAdmin(actorId, content.section.courseId);

        await ContentRepository.deleteContent(contentId);
    }

    async publishContent(actorId, contentId, isPublished = true) {
        const content = await ContentRepository.findContentById(contentId);
        if (!content) {
            throw new ApiError(404, CONTENT_MESSAGES.CONTENT_NOT_FOUND);
        }

        await this.validateOwnershipOrAdmin(actorId, content.section.courseId);

        return ContentRepository.updateContent(contentId, { isPublished });
    }

    async reorderContents(actorId, payload) {
        const section = await ContentRepository.findSectionById(payload.sectionId);
        if (!section) {
            throw new ApiError(404, CONTENT_MESSAGES.SECTION_NOT_FOUND);
        }

        await this.validateOwnershipOrAdmin(actorId, section.courseId);

        await ContentRepository.reorderContents(payload.sectionId, payload.contentIds);
    }

    // ─── Uploads ─────────────────────────────────────────────────────────────

    async createContentWithUpload(actorId, payload, file) {
        if (!file) {
            throw new ApiError(400, "No file uploaded");
        }

        const section = await ContentRepository.findSectionById(payload.sectionId);
        if (!section) {
            throw new ApiError(404, CONTENT_MESSAGES.SECTION_NOT_FOUND);
        }

        await this.validateOwnershipOrAdmin(actorId, section.courseId);

        const allowedTypes = {
            VIDEO: ["video/mp4", "video/mpeg", "video/quicktime", "video/webm"],
            PDF: ["application/pdf"],
            IMAGE: ["image/jpeg", "image/png", "image/gif", "image/webp"],
            AUDIO: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3", "audio/x-m4a"],
        };

        const typesList = allowedTypes[payload.contentType];
        if (!typesList || !typesList.includes(file.mimetype)) {
            throw new ApiError(400, `Invalid file type. Only ${payload.contentType.toLowerCase()} formats are allowed.`);
        }

        const folder = `lms_${payload.contentType.toLowerCase()}s`;
        const uploadResult = await CloudinaryRepository.uploadFromBuffer(file.buffer, file.mimetype, folder);

        const position = await ContentRepository.findNextContentPosition(payload.sectionId);

        const asset = {
            provider: "cloudinary",
            publicId: uploadResult.public_id,
            secureUrl: uploadResult.secure_url,
            originalFileName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: BigInt(file.size),
            durationSeconds: uploadResult.duration ? Math.round(uploadResult.duration) : null,
        };

        return ContentRepository.createContent({
            sectionId: payload.sectionId,
            title: payload.title,
            description: payload.description,
            contentType: payload.contentType,
            position,
            createdById: actorId,
            asset,
        });
    }
}

export default new ContentService();
