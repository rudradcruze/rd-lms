/**
 * Content Management API Tests (BR-04)
 */
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import CloudinaryRepository from "../src/modules/content/repositories/cloudinary.repository.js";
import redisClient from "../src/configurations/db.redis.js";
import {
    CREDS,
    ensureConnected,
    getToken,
    request,
    teardown,
} from "./helpers/setup.js";

describe("Content Management API", () => {
    let superAdminToken;
    let adminToken;
    let instructorToken;
    let secondInstructorToken;
    let secondInstructorUserId;
    let studentToken;
    let student2Token;

    let categoryId;
    let courseId;
    let secondCourseId; // Owned by second instructor
    let sectionId;
    let contentId;

    const uniqueSuffix = () =>
        `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    async function createPublishedCourse(token, overrides = {}) {
        const suffix = uniqueSuffix();
        const createRes = await request
            .post("/api/v1/courses")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: `Content Course ${suffix}`,
                description: "Published course for content tests.",
                categoryId,
                ...overrides,
            });
        expect(createRes.status).toBe(201);
        const cid = createRes.body.data.id;

        const publishRes = await request
            .patch(`/api/v1/courses/${cid}/publish`)
            .set("Authorization", `Bearer ${token}`);
        expect(publishRes.status).toBe(200);
        return cid;
    }

    async function enrollAsStudent(cid, token = studentToken) {
        const res = await request
            .post("/api/v1/enrollments")
            .set("Authorization", `Bearer ${token}`)
            .send({ courseId: String(cid) });
        expect(res.status).toBe(201);
    }

    beforeAll(async () => {
        await ensureConnected();

        if (redisClient.isOpen) {
            await redisClient.flushAll();
        }

        // Spy on Cloudinary upload to mock the cloud service completely
        jest.spyOn(CloudinaryRepository, "uploadFromBuffer").mockImplementation(() => {
            return Promise.resolve({
                public_id: "mocked_public_id",
                secure_url: "https://res.cloudinary.com/demo/image/upload/mocked.png",
                duration: 120,
            });
        });

        superAdminToken = await getToken(
            CREDS.superAdmin.email,
            CREDS.superAdmin.password
        );
        adminToken = await getToken(CREDS.admin.email, CREDS.admin.password);
        instructorToken = await getToken(
            CREDS.instructor.email,
            CREDS.instructor.password
        );
        studentToken = await getToken(
            CREDS.student.email,
            CREDS.student.password
        );
        student2Token = await getToken("student2@rd-lms.com", "Pass123!std2");

        // Onboard a second instructor
        const suffix = uniqueSuffix();
        const onboardRes = await request
            .post("/api/v1/users")
            .set("Authorization", `Bearer ${superAdminToken}`)
            .send({
                username: `instc_${suffix}`.slice(0, 16),
                email: `instc_${suffix}@rd-lms.com`,
                pass: "StrongPassword123!",
                firstname: "Second",
                lastname: "Instructor",
                role: "instructor",
            });
        secondInstructorUserId = onboardRes.body.data.id;
        secondInstructorToken = await getToken(
            onboardRes.body.data.email,
            "StrongPassword123!"
        );

        const categoriesRes = await request.get("/api/v1/courses/categories");
        categoryId = categoriesRes.body.data.categories[0].id;

        // Create course owned by primary instructor
        courseId = await createPublishedCourse(instructorToken);
        // Enroll student1
        await enrollAsStudent(courseId, studentToken);

        // Create course owned by second instructor
        secondCourseId = await createPublishedCourse(secondInstructorToken);
        // Enroll student2
        await enrollAsStudent(secondCourseId, student2Token);
    });

    afterAll(async () => {
        await teardown();
    });

    // ─── Section Tests ───────────────────────────────────────────────────────

    describe("Section Management", () => {
        it("Create section", async () => {
            const res = await request
                .post("/api/v1/content/sections")
                .set("Authorization", `Bearer ${instructorToken}`)
                .send({
                    courseId: String(courseId),
                    title: "Module 1: Getting Started",
                    description: "Introductory module.",
                });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe("Module 1: Getting Started");
            expect(res.body.data.isPublished).toBe(false);
            sectionId = res.body.data.id;
        });

        it("Update section", async () => {
            const res = await request
                .patch(`/api/v1/content/sections/${sectionId}`)
                .set("Authorization", `Bearer ${instructorToken}`)
                .send({
                    title: "Module 1: Revised Intro",
                });
            expect(res.status).toBe(200);
            expect(res.body.data.title).toBe("Module 1: Revised Intro");
        });

        it("Publish section", async () => {
            const res = await request
                .patch(`/api/v1/content/sections/${sectionId}/publish`)
                .set("Authorization", `Bearer ${instructorToken}`)
                .send({ isPublished: true });
            expect(res.status).toBe(200);
            expect(res.body.data.isPublished).toBe(true);
        });

        it("Reorder sections", async () => {
            // Create a second section
            const createRes = await request
                .post("/api/v1/content/sections")
                .set("Authorization", `Bearer ${instructorToken}`)
                .send({
                    courseId: String(courseId),
                    title: "Module 2: Advanced",
                });
            expect(createRes.status).toBe(201);
            const sec2Id = createRes.body.data.id;

            // Reorder Module 2 to position 0
            const reorderRes = await request
                .patch(`/api/v1/content/sections/${sec2Id}/reorder`)
                .set("Authorization", `Bearer ${instructorToken}`)
                .send({ position: 0 });
            expect(reorderRes.status).toBe(200);
            expect(reorderRes.body.data.position).toBe(0);
        });

        it("Delete section", async () => {
            const createRes = await request
                .post("/api/v1/content/sections")
                .set("Authorization", `Bearer ${instructorToken}`)
                .send({
                    courseId: String(courseId),
                    title: "Section to delete",
                });
            const toDeleteId = createRes.body.data.id;

            const deleteRes = await request
                .delete(`/api/v1/content/sections/${toDeleteId}`)
                .set("Authorization", `Bearer ${instructorToken}`);
            expect(deleteRes.status).toBe(200);

            // Fetch to verify 404
            const getRes = await request
                .get(`/api/v1/content/sections/${toDeleteId}`)
                .set("Authorization", `Bearer ${instructorToken}`);
            expect(getRes.status).toBe(404);
        });
    });

    // ─── Unified Content Upload Tests ────────────────────────────────────────

    describe("Unified Content Upload", () => {
        it("Video content upload works", async () => {
            const res = await request
                .post("/api/v1/content/contents/upload")
                .set("Authorization", `Bearer ${instructorToken}`)
                .field("sectionId", String(sectionId))
                .field("title", "Lecture 1 Video")
                .field("contentType", "VIDEO")
                .field("description", "A video introduction")
                .attach("file", Buffer.from("dummy video content"), "lecture1.mp4");
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe("Lecture 1 Video");
            expect(res.body.data.contentType).toBe("VIDEO");
            expect(res.body.data.assets.length).toBe(1);
            expect(res.body.data.assets[0].publicId).toBe("mocked_public_id");
            expect(res.body.data.assets[0].secureUrl).toBe("https://res.cloudinary.com/demo/image/upload/mocked.png");
            expect(res.body.data.assets[0].originalFileName).toBe("lecture1.mp4");
        });

        it("PDF content upload works", async () => {
            const res = await request
                .post("/api/v1/content/contents/upload")
                .set("Authorization", `Bearer ${instructorToken}`)
                .field("sectionId", String(sectionId))
                .field("title", "Lecture 1 Syllabus")
                .field("contentType", "PDF")
                .attach("file", Buffer.from("dummy pdf content"), "syllabus.pdf");
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.contentType).toBe("PDF");
            expect(res.body.data.assets[0].originalFileName).toBe("syllabus.pdf");
        });

        it("Image content upload works", async () => {
            const res = await request
                .post("/api/v1/content/contents/upload")
                .set("Authorization", `Bearer ${instructorToken}`)
                .field("sectionId", String(sectionId))
                .field("title", "Lecture 1 Slide Preview")
                .field("contentType", "IMAGE")
                .attach("file", Buffer.from("dummy image content"), "slide.png");
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.contentType).toBe("IMAGE");
        });

        it("Audio content upload works", async () => {
            const res = await request
                .post("/api/v1/content/contents/upload")
                .set("Authorization", `Bearer ${instructorToken}`)
                .field("sectionId", String(sectionId))
                .field("title", "Lecture 1 Podcast")
                .field("contentType", "AUDIO")
                .attach("file", Buffer.from("dummy audio content"), "podcast.mp3");
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.contentType).toBe("AUDIO");
        });

        it("Rejects upload with invalid mimetype for video type", async () => {
            const res = await request
                .post("/api/v1/content/contents/upload")
                .set("Authorization", `Bearer ${instructorToken}`)
                .field("sectionId", String(sectionId))
                .field("title", "Lecture 1 Video")
                .field("contentType", "VIDEO")
                .attach("file", Buffer.from("dummy content"), "lecture1.txt");
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("Rejects upload if file is missing", async () => {
            const res = await request
                .post("/api/v1/content/contents/upload")
                .set("Authorization", `Bearer ${instructorToken}`)
                .field("sectionId", String(sectionId))
                .field("title", "Lecture 1 Video")
                .field("contentType", "VIDEO");
            expect(res.status).toBe(400);
        });
    });

    // ─── Content Tests ───────────────────────────────────────────────────────


    describe("Content Management", () => {
        it("Create content", async () => {
            const res = await request
                .post("/api/v1/content/contents")
                .set("Authorization", `Bearer ${instructorToken}`)
                .send({
                    sectionId: String(sectionId),
                    title: "Welcome Video Lesson",
                    contentType: "VIDEO",
                    description: "Learn how JavaScript works.",
                    asset: {
                        provider: "cloudinary",
                        publicId: "lms_videos/welcome",
                        secureUrl: "https://res.cloudinary.com/demo/video/upload/welcome.mp4",
                        originalFileName: "welcome.mp4",
                        mimeType: "video/mp4",
                        sizeBytes: "1250329",
                        durationSeconds: 120,
                    },
                });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe("Welcome Video Lesson");
            expect(res.body.data.isPublished).toBe(false);
            expect(res.body.data.assets.length).toBe(1);
            expect(res.body.data.assets[0].publicId).toBe("lms_videos/welcome");
            contentId = res.body.data.id;
        });

        it("Publish content", async () => {
            const res = await request
                .patch(`/api/v1/content/contents/${contentId}/publish`)
                .set("Authorization", `Bearer ${instructorToken}`)
                .send({ isPublished: true });
            expect(res.status).toBe(200);
            expect(res.body.data.isPublished).toBe(true);
        });

        it("Reorder content", async () => {
            // Create a second content
            const createRes = await request
                .post("/api/v1/content/contents")
                .set("Authorization", `Bearer ${instructorToken}`)
                .send({
                    sectionId: String(sectionId),
                    title: "Read notes",
                    contentType: "NOTE",
                    description: "Rich text content.",
                });
            expect(createRes.status).toBe(201);
            const content2Id = createRes.body.data.id;

            // Reorder: put content2 first
            const reorderRes = await request
                .patch("/api/v1/content/contents/reorder")
                .set("Authorization", `Bearer ${instructorToken}`)
                .send({
                    sectionId: String(sectionId),
                    contentIds: [String(content2Id), String(contentId)],
                });
            expect(reorderRes.status).toBe(200);
        });

        it("Delete content", async () => {
            const createRes = await request
                .post("/api/v1/content/contents")
                .set("Authorization", `Bearer ${instructorToken}`)
                .send({
                    sectionId: String(sectionId),
                    title: "Delete me",
                    contentType: "NOTE",
                });
            const toDeleteId = createRes.body.data.id;

            const deleteRes = await request
                .delete(`/api/v1/content/contents/${toDeleteId}`)
                .set("Authorization", `Bearer ${instructorToken}`);
            expect(deleteRes.status).toBe(200);

            // Fetch to verify 404
            const getRes = await request
                .get(`/api/v1/content/contents/${toDeleteId}`)
                .set("Authorization", `Bearer ${instructorToken}`);
            expect(getRes.status).toBe(404);
        });
    });

    // ─── Visibility Tests ────────────────────────────────────────────────────

    describe("Student Visibility", () => {
        it("Student sees published content", async () => {
            // Set both section and content to published
            await request
                .patch(`/api/v1/content/sections/${sectionId}/publish`)
                .set("Authorization", `Bearer ${instructorToken}`)
                .send({ isPublished: true });

            await request
                .patch(`/api/v1/content/contents/${contentId}/publish`)
                .set("Authorization", `Bearer ${instructorToken}`)
                .send({ isPublished: true });

            const res = await request
                .get(`/api/v1/content/contents/${contentId}`)
                .set("Authorization", `Bearer ${studentToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(contentId);
        });

        it("Student cannot see unpublished content", async () => {
            // Set content to unpublished
            await request
                .patch(`/api/v1/content/contents/${contentId}/publish`)
                .set("Authorization", `Bearer ${instructorToken}`)
                .send({ isPublished: false });

            const res = await request
                .get(`/api/v1/content/contents/${contentId}`)
                .set("Authorization", `Bearer ${studentToken}`);
            expect(res.status).toBe(403);
        });

        it("Non-enrolled student denied", async () => {
            // Student2 is enrolled in secondCourseId, not courseId
            const res = await request
                .get(`/api/v1/content/contents/${contentId}`)
                .set("Authorization", `Bearer ${student2Token}`);
            expect(res.status).toBe(403);
        });
    });

    // ─── Ownership Tests ─────────────────────────────────────────────────────

    describe("Ownership & Authentication Rules", () => {
        it("Owner instructor allowed", async () => {
            const res = await request
                .patch(`/api/v1/content/sections/${sectionId}`)
                .set("Authorization", `Bearer ${instructorToken}`)
                .send({ title: "Updated by Owner" });
            expect(res.status).toBe(200);
        });

        it("Non-owner instructor denied", async () => {
            const res = await request
                .patch(`/api/v1/content/sections/${sectionId}`)
                .set("Authorization", `Bearer ${secondInstructorToken}`)
                .send({ title: "Hack Attempt" });
            expect(res.status).toBe(403);
        });

        it("Admin can override and manage", async () => {
            const res = await request
                .patch(`/api/v1/content/sections/${sectionId}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ title: "Admin Update Override" });
            expect(res.status).toBe(200);
        });
    });
});
