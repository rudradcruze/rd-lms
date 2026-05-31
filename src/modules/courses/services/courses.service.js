import { ApiError } from "../../../utils/ApiError.js";
import {
    getPaginationMeta,
    getPaginationParams,
} from "../../../utils/pagination.js";
import UserRepository from "../../users/repositories/user.repository.js";
import { COURSE_MESSAGES, COURSE_STATUS } from "../courses.constants.js";
import CourseRepository from "../repositories/courses.repository.js";

function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(title, providedSlug) {
    let base = providedSlug ? slugify(providedSlug) : slugify(title);
    if (!base) {
        base = "course";
    }

    let slug = base;
    let counter = 2;

    while (await CourseRepository.findBySlug(slug)) {
        slug = `${base}-${counter}`;
        counter++;
    }

    return slug;
}

function getUserRoles(user) {
    return user?.userRoles?.map((ur) => ur.role.key) || [];
}

function isAdminOrSuperAdmin(roles) {
    return roles.includes("super_admin") || roles.includes("admin");
}

class CourseService {
    async getActorRoles(actorId) {
        const user = await UserRepository.findById(actorId);
        if (!user) {
            throw new ApiError(404, COURSE_MESSAGES.USER_NOT_FOUND);
        }
        return getUserRoles(user);
    }

    assertAdminOrSuperAdmin(roles) {
        if (!isAdminOrSuperAdmin(roles)) {
            throw new ApiError(403, COURSE_MESSAGES.ADMIN_ONLY);
        }
    }

    async assertOwnerOrAdmin(actorId, courseId) {
        const roles = await this.getActorRoles(actorId);
        if (isAdminOrSuperAdmin(roles)) {
            return roles;
        }

        const isOwner = await CourseRepository.isPrimaryInstructor(
            courseId,
            actorId,
        );
        if (!isOwner) {
            throw new ApiError(403, COURSE_MESSAGES.NOT_OWNER);
        }

        return roles;
    }

    async validateCategory(categoryId) {
        if (!categoryId) return null;
        const category = await CourseRepository.findCategoryById(categoryId);
        if (!category) {
            throw new ApiError(404, COURSE_MESSAGES.CATEGORY_NOT_FOUND);
        }
        return category;
    }

    async validateInstructorUser(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, COURSE_MESSAGES.USER_NOT_FOUND);
        }

        const roles = getUserRoles(user);
        if (!roles.includes("instructor")) {
            throw new ApiError(400, COURSE_MESSAGES.INVALID_INSTRUCTOR);
        }

        return user;
    }

    async getCourseOrThrow(courseId, options = {}) {
        const course = await CourseRepository.findById(courseId, options);
        if (!course) {
            throw new ApiError(404, COURSE_MESSAGES.COURSE_NOT_FOUND);
        }
        return course;
    }

    async createCourse(actorId, payload) {
        if (payload.categoryId) {
            await this.validateCategory(payload.categoryId);
        }

        let slug;
        if (payload.slug) {
            slug = slugify(payload.slug);
            const existing = await CourseRepository.findBySlug(slug);
            if (existing) {
                throw new ApiError(409, COURSE_MESSAGES.SLUG_TAKEN);
            }
        } else {
            slug = await generateUniqueSlug(payload.title);
        }

        return CourseRepository.create(
            {
                title: payload.title,
                slug,
                shortDescription: payload.shortDescription,
                description: payload.description,
                thumbnailUrl: payload.thumbnailUrl,
                categoryId: payload.categoryId,
            },
            actorId,
        );
    }

    async updateCourse(actorId, courseId, payload) {
        await this.getCourseOrThrow(courseId);
        await this.assertOwnerOrAdmin(actorId, courseId);

        if (payload.categoryId) {
            await this.validateCategory(payload.categoryId);
        }

        if (payload.slug) {
            const slug = slugify(payload.slug);
            const existing = await CourseRepository.findBySlug(slug, {
                excludeId: courseId,
            });
            if (existing) {
                throw new ApiError(409, COURSE_MESSAGES.SLUG_TAKEN);
            }
            payload.slug = slug;
        }

        const updateData = {};
        if (payload.title !== undefined) updateData.title = payload.title;
        if (payload.slug !== undefined) updateData.slug = payload.slug;
        if (payload.shortDescription !== undefined) {
            updateData.shortDescription = payload.shortDescription;
        }
        if (payload.description !== undefined) {
            updateData.description = payload.description;
        }
        if (payload.thumbnailUrl !== undefined) {
            updateData.thumbnailUrl = payload.thumbnailUrl;
        }
        if (payload.categoryId !== undefined) {
            updateData.categoryId = payload.categoryId;
        }
        if (payload.settings !== undefined) {
            updateData.settings = payload.settings;
        }

        return CourseRepository.update(courseId, updateData);
    }

    async publishCourse(actorId, courseId) {
        const course = await this.getCourseOrThrow(courseId);
        await this.assertOwnerOrAdmin(actorId, courseId);

        if (course.status === COURSE_STATUS.ARCHIVED) {
            throw new ApiError(
                400,
                "Archived courses cannot be published. Create a new course instead.",
            );
        }

        const hasDescription = course.description || course.shortDescription;
        const instructorCount =
            await CourseRepository.countInstructors(courseId);

        if (
            !course.title ||
            !hasDescription ||
            !course.categoryId ||
            instructorCount === 0
        ) {
            throw new ApiError(400, COURSE_MESSAGES.PUBLISH_REQUIREMENTS);
        }

        return CourseRepository.publish(courseId);
    }

    async archiveCourse(actorId, courseId) {
        const course = await this.getCourseOrThrow(courseId);
        const roles = await this.getActorRoles(actorId);
        this.assertAdminOrSuperAdmin(roles);

        if (course.status === COURSE_STATUS.ARCHIVED) {
            return course;
        }

        return CourseRepository.archive(courseId);
    }

    async deleteCourse(actorId, courseId) {
        await this.getCourseOrThrow(courseId);
        const roles = await this.getActorRoles(actorId);
        this.assertAdminOrSuperAdmin(roles);

        await CourseRepository.softDelete(courseId);
    }

    async listCourses(actorId, query) {
        const roles = actorId ? await this.getActorRoles(actorId) : [];
        const { page, limit, offset } = getPaginationParams(
            query.page,
            query.limit,
        );

        const filters = {
            limit,
            offset,
            search: query.search,
            categoryId: query.categoryId,
            instructorId: query.instructorId,
        };

        if (!isAdminOrSuperAdmin(roles)) {
            filters.status = COURSE_STATUS.PUBLISHED;
        } else if (query.status) {
            filters.status = query.status;
        }

        const { rows, count } = await CourseRepository.findAll(filters);

        return {
            courses: rows,
            ...getPaginationMeta(page, limit, count),
        };
    }

    async getCourseById(actorId, courseId) {
        const course = await this.getCourseOrThrow(courseId);
        const roles = actorId ? await this.getActorRoles(actorId) : [];

        if (
            !isAdminOrSuperAdmin(roles) &&
            course.status !== COURSE_STATUS.PUBLISHED
        ) {
            throw new ApiError(404, COURSE_MESSAGES.COURSE_NOT_FOUND);
        }

        return course;
    }

    async assignInstructor(actorId, courseId, userId, isPrimary = false) {
        await this.getCourseOrThrow(courseId);
        const roles = await this.getActorRoles(actorId);
        this.assertAdminOrSuperAdmin(roles);

        await this.validateInstructorUser(userId);

        const alreadyAssigned = await CourseRepository.hasInstructor(
            courseId,
            userId,
        );
        if (alreadyAssigned) {
            throw new ApiError(
                409,
                COURSE_MESSAGES.INSTRUCTOR_ALREADY_ASSIGNED,
            );
        }

        try {
            return await CourseRepository.assignInstructor(
                courseId,
                userId,
                isPrimary,
            );
        } catch (err) {
            if (err.code === "P2002") {
                throw new ApiError(
                    409,
                    COURSE_MESSAGES.INSTRUCTOR_ALREADY_ASSIGNED,
                );
            }
            throw err;
        }
    }

    async removeInstructor(actorId, courseId, userId) {
        await this.getCourseOrThrow(courseId);
        const roles = await this.getActorRoles(actorId);
        this.assertAdminOrSuperAdmin(roles);

        const isPrimary = await CourseRepository.isPrimaryInstructor(
            courseId,
            userId,
        );
        if (isPrimary) {
            throw new ApiError(400, COURSE_MESSAGES.CANNOT_REMOVE_PRIMARY);
        }

        const hasAssignment = await CourseRepository.hasInstructor(
            courseId,
            userId,
        );
        if (!hasAssignment) {
            throw new ApiError(404, COURSE_MESSAGES.INSTRUCTOR_NOT_FOUND);
        }

        await CourseRepository.removeInstructor(courseId, userId);
    }

    async getCourseInstructors(actorId, courseId) {
        const course = await this.getCourseOrThrow(courseId);
        const roles = actorId ? await this.getActorRoles(actorId) : [];

        if (
            !isAdminOrSuperAdmin(roles) &&
            course.status !== COURSE_STATUS.PUBLISHED
        ) {
            throw new ApiError(404, COURSE_MESSAGES.COURSE_NOT_FOUND);
        }

        const instructors =
            await CourseRepository.findCourseInstructors(courseId);
        return { instructors };
    }

    async listCategories() {
        const categories = await CourseRepository.findAllCategories();
        return { categories };
    }

    async createCategory(actorId, payload) {
        const roles = await this.getActorRoles(actorId);
        this.assertAdminOrSuperAdmin(roles);

        const existing = await CourseRepository.findCategoryByName(
            payload.name,
        );
        if (existing) {
            throw new ApiError(409, COURSE_MESSAGES.CATEGORY_NAME_TAKEN);
        }

        try {
            return await CourseRepository.createCategory(payload);
        } catch (err) {
            if (err.code === "P2002") {
                throw new ApiError(409, COURSE_MESSAGES.CATEGORY_NAME_TAKEN);
            }
            throw err;
        }
    }
}

export default new CourseService();
