/**
 * Enrollments API Tests (BR-03)
 */
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import PermissionResolverService from "../src/modules/permissions/services/permissionResolver.service.js";
import {
    CREDS,
    ensureConnected,
    getToken,
    request,
    teardown,
} from "./helpers/setup.js";

describe("Enrollments API", () => {
    let superAdminToken;
    let adminToken;
    let instructorToken;
    let studentToken;
    let student2Token;
    let secondInstructorToken;
    let secondInstructorUserId;
    let enrollmentsReadPermissionId;

    let draftCourseId;
    let businessCourseId;
    let categoryId;

    const uniqueSuffix = () =>
        `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    async function enrollAsStudent(courseId, token = studentToken) {
        return request
            .post("/api/v1/enrollments")
            .set("Authorization", `Bearer ${token}`)
            .send({ courseId: String(courseId) });
    }

    async function createPublishedCourse(token, overrides = {}) {
        const { settings, ...coursePayload } = overrides;
        const suffix = uniqueSuffix();
        const createRes = await request
            .post("/api/v1/courses")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: `Enroll Course ${suffix}`,
                description: "Published course for enrollment tests.",
                categoryId,
                ...coursePayload,
            });
        expect(createRes.status).toBe(201);
        const courseId = createRes.body.data.id;

        if (settings) {
            const settingsRes = await request
                .patch(`/api/v1/courses/${courseId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ settings });
            expect(settingsRes.status).toBe(200);
        }

        const publishRes = await request
            .patch(`/api/v1/courses/${courseId}/publish`)
            .set("Authorization", `Bearer ${token}`);
        expect(publishRes.status).toBe(200);
        return courseId;
    }

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
        const instructorUsersRes = await request
            .get("/api/v1/users?role=instructor&limit=100")
            .set("Authorization", `Bearer ${superAdminToken}`);
        const instructorUser = instructorUsersRes.body.data.users.find(
            (u) => u.email === CREDS.instructor.email,
        );
        if (instructorUser) {
            await PermissionResolverService.invalidateUserCache(
                BigInt(instructorUser.id),
            );
        }
        studentToken = await getToken(
            CREDS.student.email,
            CREDS.student.password,
        );
        student2Token = await getToken("student2@rd-lms.com", "Pass123!std2");

        const permsRes = await request
            .get("/api/v1/permissions?limit=100")
            .set("Authorization", `Bearer ${superAdminToken}`);
        const enrollmentsRead = permsRes.body.data.permissions.find(
            (p) => p.key === "enrollments.read",
        );
        if (!enrollmentsRead) {
            throw new Error("enrollments.read permission not found in seed");
        }
        enrollmentsReadPermissionId = enrollmentsRead.id;

        const usersRes = await request
            .get("/api/v1/users?role=student&limit=100")
            .set("Authorization", `Bearer ${superAdminToken}`);
        const student2 = usersRes.body.data.users.find(
            (u) => u.email === "student2@rd-lms.com",
        );
        if (student2) {
            await request
                .delete(
                    `/api/v1/users/${student2.id}/permissions/${enrollmentsReadPermissionId}`,
                )
                .set("Authorization", `Bearer ${superAdminToken}`);
        }

        const suffix = uniqueSuffix();
        const onboardRes = await request
            .post("/api/v1/users")
            .set("Authorization", `Bearer ${superAdminToken}`)
            .send({
                username: `inst2e_${suffix}`.slice(0, 16),
                email: `inst2e_${suffix}@rd-lms.com`,
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

        const categoriesRes = await request.get("/api/v1/courses/categories");
        categoryId = categoriesRes.body.data.categories[0].id;

        businessCourseId = await createPublishedCourse(instructorToken, {
            title: `Instructor Owned ${uniqueSuffix()}`,
        });
        await enrollAsStudent(businessCourseId);

        const draftList = await request
            .get("/api/v1/courses?status=DRAFT&search=calculus-essentials")
            .set("Authorization", `Bearer ${adminToken}`);
        const draftCourse = draftList.body.data.courses.find(
            (c) => c.slug === "calculus-essentials",
        );
        if (!draftCourse) {
            throw new Error("Seeded draft course not found");
        }
        draftCourseId = draftCourse.id;
    });

    afterAll(async () => {
        await teardown();
    });

    // ── Enrollment Creation ───────────────────────────────────────────────────
    describe("Enrollment Creation", () => {
        it("student can enroll", async () => {
            const courseId = await createPublishedCourse(instructorToken);
            const res = await enrollAsStudent(courseId);
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe("APPROVED");
        });

        it("student cannot enroll twice", async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `Duplicate Enroll ${uniqueSuffix()}`,
            });
            const first = await enrollAsStudent(courseId);
            expect(first.status).toBe(201);
            const second = await enrollAsStudent(courseId);
            expect(second.status).toBe(409);
            expect(second.body.message).toBe("Student already enrolled");
        });

        it("student cannot enroll in draft course", async () => {
            const res = await enrollAsStudent(draftCourseId);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(
                "Course is not available for enrollment",
            );
        });

        it("student cannot enroll in archived course", async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `Archived Enroll ${uniqueSuffix()}`,
            });
            await request
                .patch(`/api/v1/courses/${courseId}/archive`)
                .set("Authorization", `Bearer ${adminToken}`);

            const res = await enrollAsStudent(courseId, student2Token);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(
                "Course is not available for enrollment",
            );
        });

        it("student cannot enroll in soft-deleted course", async () => {
            const courseId = await createPublishedCourse(adminToken, {
                title: `Deleted Enroll ${uniqueSuffix()}`,
            });
            await request
                .delete(`/api/v1/courses/${courseId}`)
                .set("Authorization", `Bearer ${adminToken}`);

            const res = await enrollAsStudent(courseId, student2Token);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(
                "Course is not available for enrollment",
            );
        });

        it("auto-approved course creates APPROVED enrollment", async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `Auto Approve ${uniqueSuffix()}`,
                settings: { requiresApproval: false },
            });
            const res = await enrollAsStudent(courseId, student2Token);
            expect(res.status).toBe(201);
            expect(res.body.data.status).toBe("APPROVED");
        });

        it("approval-required course creates PENDING enrollment", async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `Pending Enroll ${uniqueSuffix()}`,
                settings: { requiresApproval: true },
            });
            const res = await enrollAsStudent(courseId, student2Token);
            expect(res.status).toBe(201);
            expect(res.body.data.status).toBe("PENDING");
        });
    });

    // ── Approval Workflow ─────────────────────────────────────────────────────
    describe("Approval Workflow", () => {
        let pendingEnrollmentId;

        beforeAll(async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `Approval Flow ${uniqueSuffix()}`,
                settings: { requiresApproval: true },
            });
            const res = await enrollAsStudent(courseId);
            pendingEnrollmentId = res.body.data.id;
        });

        it("pending enrollment approved", async () => {
            expect(pendingEnrollmentId).toBeDefined();
            const res = await request
                .patch(
                    `/api/v1/enrollments/${pendingEnrollmentId}/approve`,
                )
                .set("Authorization", `Bearer ${instructorToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe("APPROVED");
            expect(res.body.data.approvedById).toBeDefined();
        });

        it("invalid transition blocked on double approve", async () => {
            const res = await request
                .patch(
                    `/api/v1/enrollments/${pendingEnrollmentId}/approve`,
                )
                .set("Authorization", `Bearer ${instructorToken}`);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(
                "Invalid enrollment status transition",
            );
        });

        it("pending enrollment rejected on fresh enrollment", async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `Reject Flow ${uniqueSuffix()}`,
                settings: { requiresApproval: true },
            });
            const enrollRes = await enrollAsStudent(courseId, student2Token);
            expect(enrollRes.status).toBe(201);
            const enrollmentId = enrollRes.body.data.id;

            const rejectRes = await request
                .patch(`/api/v1/enrollments/${enrollmentId}/reject`)
                .set("Authorization", `Bearer ${instructorToken}`);
            expect(rejectRes.status).toBe(200);
            expect(rejectRes.body.data.status).toBe("REJECTED");
        });
    });

    // ── Ownership ─────────────────────────────────────────────────────────────
    describe("Ownership", () => {
        it("owner instructor can approve", async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `Owner Approve ${uniqueSuffix()}`,
                settings: { requiresApproval: true },
            });
            const enrollRes = await enrollAsStudent(courseId, student2Token);
            const enrollmentId = enrollRes.body.data.id;

            const res = await request
                .patch(`/api/v1/enrollments/${enrollmentId}/approve`)
                .set("Authorization", `Bearer ${instructorToken}`);
            expect(res.status).toBe(200);
        });

        it("non-owner instructor denied", async () => {
            const courseId = await createPublishedCourse(adminToken, {
                title: `Non Owner ${uniqueSuffix()}`,
                settings: { requiresApproval: true },
            });
            await request
                .post(`/api/v1/courses/${courseId}/instructors`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ userId: secondInstructorUserId, isPrimary: false });

            const enrollRes = await enrollAsStudent(courseId, student2Token);
            const enrollmentId = enrollRes.body.data.id;

            const res = await request
                .patch(`/api/v1/enrollments/${enrollmentId}/approve`)
                .set("Authorization", `Bearer ${instructorToken}`);
            expect(res.status).toBe(403);
            expect(res.body.message).toBe("Access denied");
        });
    });

    // ── Withdrawal ────────────────────────────────────────────────────────────
    describe("Withdrawal", () => {
        it("student withdraws own enrollment", async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `Withdraw Own ${uniqueSuffix()}`,
            });
            const enrollRes = await enrollAsStudent(courseId, student2Token);
            const enrollmentId = enrollRes.body.data.id;

            const res = await request
                .patch(`/api/v1/enrollments/${enrollmentId}/withdraw`)
                .set("Authorization", `Bearer ${student2Token}`);
            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe("WITHDRAWN");
        });

        it("student cannot withdraw another student's enrollment", async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `Withdraw Other ${uniqueSuffix()}`,
            });
            const enrollRes = await enrollAsStudent(courseId);
            const enrollmentId = enrollRes.body.data.id;

            const res = await request
                .patch(`/api/v1/enrollments/${enrollmentId}/withdraw`)
                .set("Authorization", `Bearer ${student2Token}`);
            expect(res.status).toBe(403);
            expect(res.body.message).toBe("Access denied");
        });

        it("admin can withdraw any enrollment", async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `Admin Withdraw ${uniqueSuffix()}`,
            });
            const enrollRes = await enrollAsStudent(courseId, student2Token);
            const enrollmentId = enrollRes.body.data.id;

            const res = await request
                .patch(`/api/v1/enrollments/${enrollmentId}/withdraw`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe("WITHDRAWN");
        });
    });

    // ── Listing ───────────────────────────────────────────────────────────────
    describe("Listing", () => {
        it("student sees own enrollments only", async () => {
            const usersRes = await request
                .get("/api/v1/users?role=student&limit=100")
                .set("Authorization", `Bearer ${superAdminToken}`);
            const student1 = usersRes.body.data.users.find(
                (u) => u.email === CREDS.student.email,
            );

            const res = await request
                .get("/api/v1/enrollments?limit=100")
                .set("Authorization", `Bearer ${studentToken}`);
            expect(res.status).toBe(200);
            res.body.data.enrollments.forEach((e) => {
                expect(e.studentId).toBe(student1.id);
            });
        });

        it("instructor sees owned-course enrollments", async () => {
            const res = await request
                .get(`/api/v1/enrollments?courseId=${businessCourseId}&limit=100`)
                .set("Authorization", `Bearer ${instructorToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data.enrollments)).toBe(true);
        });

        it("admin sees all enrollments", async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `Admin List ${uniqueSuffix()}`,
            });
            await enrollAsStudent(courseId);
            const res = await request
                .get("/api/v1/enrollments?limit=100")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.total).toBeGreaterThan(0);
        });
    });

    // ── History ───────────────────────────────────────────────────────────────
    describe("History", () => {
        it("rejected enrollment preserved in history", async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `History Reject ${uniqueSuffix()}`,
                settings: { requiresApproval: true },
            });
            await enrollAsStudent(courseId, student2Token);
            const listRes = await request
                .get(`/api/v1/enrollments?courseId=${courseId}&status=PENDING`)
                .set("Authorization", `Bearer ${adminToken}`);
            const enrollmentId = listRes.body.data.enrollments[0].id;
            await request
                .patch(`/api/v1/enrollments/${enrollmentId}/reject`)
                .set("Authorization", `Bearer ${instructorToken}`);

            const historyRes = await request
                .get("/api/v1/enrollments/history?limit=100")
                .set("Authorization", `Bearer ${student2Token}`);
            const rejected = historyRes.body.data.enrollments.find(
                (e) => e.id === enrollmentId,
            );
            expect(rejected).toBeDefined();
            expect(rejected.status).toBe("REJECTED");
        });

        it("withdrawn enrollment preserved in history", async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `History Withdraw ${uniqueSuffix()}`,
            });
            const enrollRes = await enrollAsStudent(courseId, student2Token);
            const enrollmentId = enrollRes.body.data.id;
            await request
                .patch(`/api/v1/enrollments/${enrollmentId}/withdraw`)
                .set("Authorization", `Bearer ${student2Token}`);

            const historyRes = await request
                .get("/api/v1/enrollments/history?limit=100")
                .set("Authorization", `Bearer ${student2Token}`);
            const withdrawn = historyRes.body.data.enrollments.find(
                (e) => e.id === enrollmentId,
            );
            expect(withdrawn).toBeDefined();
            expect(withdrawn.status).toBe("WITHDRAWN");
        });

        it("approved enrollment preserved in history", async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `History Approved ${uniqueSuffix()}`,
            });
            const enrollRes = await enrollAsStudent(courseId);
            expect(enrollRes.body.data.status).toBe("APPROVED");

            const historyRes = await request
                .get("/api/v1/enrollments/history?limit=100")
                .set("Authorization", `Bearer ${studentToken}`);
            const approved = historyRes.body.data.enrollments.find(
                (e) => e.id === enrollRes.body.data.id,
            );
            expect(approved).toBeDefined();
            expect(approved.status).toBe("APPROVED");
        });
    });

    // ── Validation ────────────────────────────────────────────────────────────
    describe("Validation", () => {
        it("invalid enrollment ID rejected", async () => {
            const res = await request
                .get("/api/v1/enrollments/abc")
                .set("Authorization", `Bearer ${studentToken}`);
            expect(res.status).toBe(400);
        });

        it("missing courseId rejected", async () => {
            const res = await request
                .post("/api/v1/enrollments")
                .set("Authorization", `Bearer ${studentToken}`)
                .send({});
            expect(res.status).toBe(400);
        });

        it("invalid status filter rejected", async () => {
            const res = await request
                .get("/api/v1/enrollments?status=INVALID")
                .set("Authorization", `Bearer ${studentToken}`);
            expect(res.status).toBe(400);
        });
    });

    // ── Permissions ───────────────────────────────────────────────────────────
    describe("Permissions", () => {
        it("enrollments.read required", async () => {
            const usersRes = await request
                .get("/api/v1/users?role=student&limit=100")
                .set("Authorization", `Bearer ${superAdminToken}`);
            const student2 = usersRes.body.data.users.find(
                (u) => u.email === "student2@rd-lms.com",
            );

            await request
                .post(
                    `/api/v1/users/${student2.id}/permissions/${enrollmentsReadPermissionId}/deny`,
                )
                .set("Authorization", `Bearer ${superAdminToken}`);

            const deniedToken = await getToken(
                "student2@rd-lms.com",
                "Pass123!std2",
            );
            const res = await request
                .get("/api/v1/enrollments")
                .set("Authorization", `Bearer ${deniedToken}`);
            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/insufficient permissions/i);

            await request
                .delete(
                    `/api/v1/users/${student2.id}/permissions/${enrollmentsReadPermissionId}`,
                )
                .set("Authorization", `Bearer ${superAdminToken}`);
        });

        it("enrollments.manage required for approve", async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `Student Approve ${uniqueSuffix()}`,
                settings: { requiresApproval: true },
            });
            const enrollRes = await enrollAsStudent(courseId, student2Token);
            const enrollmentId = enrollRes.body.data.id;

            const res = await request
                .patch(`/api/v1/enrollments/${enrollmentId}/approve`)
                .set("Authorization", `Bearer ${studentToken}`);
            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/insufficient permissions/i);
        });
    });

    // ── Database Constraints ──────────────────────────────────────────────────
    describe("Database Constraints", () => {
        it("duplicate enrollment prevented", async () => {
            const courseId = await createPublishedCourse(instructorToken, {
                title: `DB Constraint ${uniqueSuffix()}`,
            });
            await enrollAsStudent(courseId);
            const res = await enrollAsStudent(courseId);
            expect(res.status).toBe(409);
            expect(res.body.message).toBe("Student already enrolled");
        });
    });

    // ── My dashboard ────────────────────────────────────────────────────────────
    describe("GET /enrollments/my", () => {
        it("returns active enrollments for student", async () => {
            const res = await request
                .get("/api/v1/enrollments/my?limit=100")
                .set("Authorization", `Bearer ${studentToken}`);
            expect(res.status).toBe(200);
            res.body.data.enrollments.forEach((e) => {
                expect(["PENDING", "APPROVED"]).toContain(e.status);
            });
        });
    });

    // ── Get by ID ───────────────────────────────────────────────────────────────
    describe("GET /enrollments/:enrollmentId", () => {
        it("student can view own enrollment", async () => {
            const listRes = await request
                .get("/api/v1/enrollments/my?limit=1")
                .set("Authorization", `Bearer ${studentToken}`);
            const enrollmentId = listRes.body.data.enrollments[0]?.id;
            if (!enrollmentId) return;

            const res = await request
                .get(`/api/v1/enrollments/${enrollmentId}`)
                .set("Authorization", `Bearer ${studentToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(enrollmentId);
        });
    });
});
