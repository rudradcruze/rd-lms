/**
 * Courses API Tests
 * Covers: creation, publishing, listing, instructor assignment,
 *         soft delete, and validation
 */
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import {
    CREDS,
    ensureConnected,
    getToken,
    request,
    teardown,
} from "./helpers/setup.js";

describe("Courses API", () => {
    let superAdminToken;
    let adminToken;
    let instructorToken;
    let studentToken;
    let instructorUserId;
    let secondInstructorToken;
    let secondInstructorUserId;
    let categoryId;

    const uniqueSuffix = () =>
        `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    beforeAll(async () => {
        await ensureConnected();
        superAdminToken = await getToken(
            CREDS.superAdmin.email,
            CREDS.superAdmin.password,
        );
        adminToken = await getToken(CREDS.admin.email, CREDS.admin.password);
        instructorToken = await getToken(
            CREDS.instructor.email,
            CREDS.instructor.password,
        );
        studentToken = await getToken("student2@rd-lms.com", "Pass123!std2");

        const usersRes = await request
            .get("/api/v1/users?role=instructor&limit=100")
            .set("Authorization", `Bearer ${superAdminToken}`);
        const instructor = usersRes.body.data.users.find(
            (u) => u.email === CREDS.instructor.email,
        );
        if (!instructor) {
            throw new Error("Seeded instructor not found");
        }
        instructorUserId = instructor.id;

        const categoriesRes = await request.get("/api/v1/courses/categories");
        categoryId = categoriesRes.body.data.categories[0].id;

        const suffix = uniqueSuffix();
        const onboardRes = await request
            .post("/api/v1/users")
            .set("Authorization", `Bearer ${superAdminToken}`)
            .send({
                username: `inst2_${suffix}`.slice(0, 16),
                email: `inst2_${suffix}@rd-lms.com`,
                pass: "StrongPassword123!",
                firstname: "Second",
                lastname: "Instructor",
                role: "instructor",
            });
        secondInstructorUserId = onboardRes.body.data.id;
        secondInstructorToken = await getToken(
            onboardRes.body.data.email,
            "StrongPassword123!",
        );
    });

    afterAll(async () => {
        await teardown();
    });

    async function createDraftCourse(token, overrides = {}) {
        const suffix = uniqueSuffix();
        const res = await request
            .post("/api/v1/courses")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: `Test Course ${suffix}`,
                description: "A comprehensive test course description.",
                categoryId,
                ...overrides,
            });
        return res;
    }

    // ── Course Creation ───────────────────────────────────────────────────────
    describe("Course Creation", () => {
        it("instructor can create", async () => {
            const res = await createDraftCourse(instructorToken);
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe("DRAFT");
            expect(res.body.data.settings).toMatchObject({
                allowSelfEnrollment: true,
                requiresApproval: false,
                showInCatalog: true,
                enableDiscussions: true,
            });
            const primary = res.body.data.instructors.find((i) => i.isPrimary);
            expect(primary).toBeDefined();
            expect(primary.user.id).toBe(instructorUserId);
        });

        it("student cannot create", async () => {
            const res = await request
                .post("/api/v1/courses")
                .set("Authorization", `Bearer ${studentToken}`)
                .send({
                    title: "Student Course Attempt",
                    description: "Should fail",
                });
            expect(res.status).toBe(403);
        });
    });

    // ── Publishing ────────────────────────────────────────────────────────────
    describe("Publishing", () => {
        it("owner instructor can publish", async () => {
            const createRes = await createDraftCourse(instructorToken);
            expect(createRes.status).toBe(201);
            const courseId = createRes.body.data.id;

            const publishRes = await request
                .patch(`/api/v1/courses/${courseId}/publish`)
                .set("Authorization", `Bearer ${instructorToken}`);
            expect(publishRes.status).toBe(200);
            expect(publishRes.body.data.status).toBe("PUBLISHED");
        });

        it("non-owner instructor denied", async () => {
            const createRes = await createDraftCourse(instructorToken);
            const courseId = createRes.body.data.id;

            await request
                .post(`/api/v1/courses/${courseId}/instructors`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ userId: secondInstructorUserId, isPrimary: false });

            const publishRes = await request
                .patch(`/api/v1/courses/${courseId}/publish`)
                .set("Authorization", `Bearer ${secondInstructorToken}`);
            expect(publishRes.status).toBe(403);
        });
    });

    // ── Public Read Access ────────────────────────────────────────────────────
    describe("Public read access", () => {
        it("anyone can list categories without auth", async () => {
            const res = await request.get("/api/v1/courses/categories");
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data.categories)).toBe(true);
            expect(res.body.data.categories.length).toBeGreaterThan(0);
        });

        it("anyone can list published courses without auth", async () => {
            const suffix = uniqueSuffix();
            const draftRes = await createDraftCourse(adminToken, {
                title: `Public Draft ${suffix}`,
            });
            const draftId = draftRes.body.data.id;

            const publishedRes = await createDraftCourse(adminToken, {
                title: `Public Published ${suffix}`,
            });
            const publishedId = publishedRes.body.data.id;
            await request
                .patch(`/api/v1/courses/${publishedId}/publish`)
                .set("Authorization", `Bearer ${adminToken}`);

            const publicList = await request.get("/api/v1/courses?limit=100");
            expect(publicList.status).toBe(200);
            const publicCourseIds = publicList.body.data.courses.map(
                (c) => c.id,
            );
            expect(publicCourseIds).toContain(publishedId);
            expect(publicCourseIds).not.toContain(draftId);
            publicList.body.data.courses.forEach((c) => {
                expect(c.status).toBe("PUBLISHED");
            });
        });

        it("anyone can get a published course by id without auth", async () => {
            const createRes = await createDraftCourse(adminToken);
            const courseId = createRes.body.data.id;
            await request
                .patch(`/api/v1/courses/${courseId}/publish`)
                .set("Authorization", `Bearer ${adminToken}`);

            const res = await request.get(`/api/v1/courses/${courseId}`);
            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(courseId);
            expect(res.body.data.status).toBe("PUBLISHED");
        });

        it("public cannot get a draft course by id", async () => {
            const createRes = await createDraftCourse(adminToken);
            const courseId = createRes.body.data.id;

            const res = await request.get(`/api/v1/courses/${courseId}`);
            expect(res.status).toBe(404);
        });

        it("anyone can list instructors for a published course without auth", async () => {
            const createRes = await createDraftCourse(adminToken);
            const courseId = createRes.body.data.id;
            await request
                .patch(`/api/v1/courses/${courseId}/publish`)
                .set("Authorization", `Bearer ${adminToken}`);

            const res = await request.get(
                `/api/v1/courses/${courseId}/instructors`,
            );
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data.instructors)).toBe(true);
            expect(res.body.data.instructors.length).toBeGreaterThan(0);
        });
    });

    // ── Listing ───────────────────────────────────────────────────────────────
    describe("Listing", () => {
        it("student sees only published", async () => {
            const suffix = uniqueSuffix();
            const draftRes = await request
                .post("/api/v1/courses")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    title: `Draft Only ${suffix}`,
                    description: "Draft course for listing test",
                    categoryId,
                });
            expect(draftRes.status).toBe(201);
            const draftId = draftRes.body.data.id;

            const publishedRes = await createDraftCourse(adminToken, {
                title: `Published Course ${suffix}`,
            });
            const publishedId = publishedRes.body.data.id;
            await request
                .patch(`/api/v1/courses/${publishedId}/publish`)
                .set("Authorization", `Bearer ${adminToken}`);

            const studentList = await request.get("/api/v1/courses?limit=100");
            expect(studentList.status).toBe(200);
            const studentCourseIds = studentList.body.data.courses.map(
                (c) => c.id,
            );
            expect(studentCourseIds).toContain(publishedId);
            expect(studentCourseIds).not.toContain(draftId);
            studentList.body.data.courses.forEach((c) => {
                expect(c.status).toBe("PUBLISHED");
            });

            const adminList = await request
                .get("/api/v1/courses?limit=100")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(adminList.status).toBe(200);
            const adminCourseIds = adminList.body.data.courses.map((c) => c.id);
            expect(adminCourseIds).toContain(draftId);
        });
    });

    // ── Instructor Assignment ─────────────────────────────────────────────────
    describe("Instructor Assignment", () => {
        it("admin assigns instructor", async () => {
            const createRes = await createDraftCourse(adminToken);
            const courseId = createRes.body.data.id;

            const res = await request
                .post(`/api/v1/courses/${courseId}/instructors`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ userId: secondInstructorUserId, isPrimary: false });
            expect(res.status).toBe(201);
            expect(res.body.data.user.id).toBe(secondInstructorUserId);
        });

        it("duplicate assignment prevented", async () => {
            const createRes = await createDraftCourse(adminToken);
            const courseId = createRes.body.data.id;

            await request
                .post(`/api/v1/courses/${courseId}/instructors`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ userId: secondInstructorUserId, isPrimary: false });

            const res = await request
                .post(`/api/v1/courses/${courseId}/instructors`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ userId: secondInstructorUserId, isPrimary: false });
            expect(res.status).toBe(409);
        });
    });

    // ── Soft Delete ───────────────────────────────────────────────────────────
    describe("Soft Delete", () => {
        it("deleted course hidden from list", async () => {
            const createRes = await createDraftCourse(adminToken);
            const courseId = createRes.body.data.id;

            const deleteRes = await request
                .delete(`/api/v1/courses/${courseId}`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(deleteRes.status).toBe(200);

            const listRes = await request.get("/api/v1/courses?limit=100");
            const ids = listRes.body.data.courses.map((c) => c.id);
            expect(ids).not.toContain(courseId);

            const getRes = await request.get(`/api/v1/courses/${courseId}`);
            expect(getRes.status).toBe(404);
        });
    });

    // ── Validation ────────────────────────────────────────────────────────────
    describe("Validation", () => {
        it("rejects non-numeric courseId", async () => {
            const res = await request.get("/api/v1/courses/abc");
            expect(res.status).toBe(400);
        });

        it("rejects decimal courseId", async () => {
            const res = await request.get("/api/v1/courses/1.5");
            expect(res.status).toBe(400);
        });

        it("rejects negative courseId", async () => {
            const res = await request.get("/api/v1/courses/-1");
            expect(res.status).toBe(400);
        });

        it("rejects zero courseId", async () => {
            const res = await request.get("/api/v1/courses/0");
            expect(res.status).toBe(400);
        });

        it("invalid category rejected", async () => {
            const res = await request
                .post("/api/v1/courses")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    title: "Invalid Category Course",
                    description: "Test",
                    categoryId: "999999999",
                });
            expect(res.status).toBe(404);
        });

        it("invalid URL rejected", async () => {
            const res = await request
                .post("/api/v1/courses")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    title: "Invalid URL Course",
                    description: "Test",
                    thumbnailUrl: "not-a-valid-url",
                });
            expect(res.status).toBe(400);
        });

        it("duplicate slug rejected", async () => {
            const slug = `dup-slug-${uniqueSuffix()}`;
            const first = await request
                .post("/api/v1/courses")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    title: "First Slug Course",
                    slug,
                    description: "First course",
                    categoryId,
                });
            expect(first.status).toBe(201);

            const second = await request
                .post("/api/v1/courses")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    title: "Second Slug Course",
                    slug,
                    description: "Second course",
                    categoryId,
                });
            expect(second.status).toBe(409);
        });
    });
});
