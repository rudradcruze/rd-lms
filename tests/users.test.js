/**
 * Users API Tests
 * Covers: list users, get user, block/unblock, activate/deactivate,
 *         role assignment (incl. super_admin guard), permission management
 */
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { request, getToken, ensureConnected, teardown, CREDS } from "./helpers/setup.js";

describe("Users API", () => {
    let superAdminToken;
    let adminToken;
    let studentToken;
    let studentUserId;

    beforeAll(async () => {
        await ensureConnected();
        superAdminToken = await getToken(
            CREDS.superAdmin.email,
            CREDS.superAdmin.password
        );
        adminToken = await getToken(CREDS.admin.email, CREDS.admin.password);
        studentToken = await getToken(
            CREDS.student.email,
            CREDS.student.password
        );

        // Get student user ID matching the credentials used for studentToken
        const usersRes = await request
            .get("/api/v1/users?role=student&limit=10")
            .set("Authorization", `Bearer ${superAdminToken}`);
        const student = usersRes.body.data.users.find(
            (u) => u.email === CREDS.student.email
        );
        if (!student) {
            throw new Error(`Student with email ${CREDS.student.email} not found in seeded users.`);
        }
        studentUserId = student.id;
    });

    afterAll(async () => {
        await teardown();
    });

    // ── List Users ────────────────────────────────────────────────────────────
    describe("GET /api/v1/users", () => {
        it("admin can list users", async () => {
            const res = await request
                .get("/api/v1/users")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty("users");
            expect(Array.isArray(res.body.data.users)).toBe(true);
        });

        it("student cannot list users (403)", async () => {
            const res = await request
                .get("/api/v1/users")
                .set("Authorization", `Bearer ${studentToken}`);
            expect(res.status).toBe(403);
        });

        it("can filter by role=student", async () => {
            const res = await request
                .get("/api/v1/users?role=student")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            const users = res.body.data.users;
            users.forEach((u) => {
                const roles = u.userRoles.map((ur) => ur.role.key);
                expect(roles).toContain("student");
            });
        });
    });

    // ── Get Single User ───────────────────────────────────────────────────────
    describe("GET /api/v1/users/:userId", () => {
        it("admin can get a user by ID", async () => {
            const res = await request
                .get(`/api/v1/users/${studentUserId}`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(studentUserId);
        });

        it("returns 404 for non-existent userId", async () => {
            const res = await request
                .get("/api/v1/users/00000000-0000-0000-0000-000000000000")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });
    });

    // ── Block / Unblock ───────────────────────────────────────────────────────
    describe("PATCH /api/v1/users/:userId/block and /unblock", () => {
        it("admin can block a student", async () => {
            const res = await request
                .patch(`/api/v1/users/${studentUserId}/block`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        it("blocked user cannot login", async () => {
            const res = await request.post("/api/v1/auth/login").send({
                identifier: CREDS.student.email,
                password: CREDS.student.password,
            });
            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/blocked/i);
        });

        it("blocking an already blocked user returns 400", async () => {
            const res = await request
                .patch(`/api/v1/users/${studentUserId}/block`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(400);
        });

        it("admin can unblock the student", async () => {
            const res = await request
                .patch(`/api/v1/users/${studentUserId}/unblock`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        it("student can login again after unblock", async () => {
            const res = await request.post("/api/v1/auth/login").send({
                identifier: CREDS.student.email,
                password: CREDS.student.password,
            });
            expect(res.status).toBe(200);
        });
    });

    // ── Activate / Deactivate ─────────────────────────────────────────────────
    describe("PATCH /api/v1/users/:userId/deactivate and /activate", () => {
        it("admin can deactivate a student", async () => {
            const res = await request
                .patch(`/api/v1/users/${studentUserId}/deactivate`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        it("deactivated user cannot login", async () => {
            const res = await request.post("/api/v1/auth/login").send({
                identifier: CREDS.student.email,
                password: CREDS.student.password,
            });
            expect(res.status).toBe(403);
        });

        it("admin can reactivate the student", async () => {
            const res = await request
                .patch(`/api/v1/users/${studentUserId}/activate`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });
    });

    // ── Role Assignment ───────────────────────────────────────────────────────
    describe("POST /api/v1/users/:userId/roles", () => {
        it("super_admin can assign instructor role to student by key", async () => {
            const res = await request
                .post(`/api/v1/users/${studentUserId}/roles`)
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({ roleId: "instructor" });
            expect(res.status).toBe(200);
        });

        it("cannot assign the same role twice", async () => {
            const res = await request
                .post(`/api/v1/users/${studentUserId}/roles`)
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({ roleId: "instructor" });
            expect(res.status).toBe(400);
        });

        it("cannot assign super_admin role via API (403)", async () => {
            const res = await request
                .post(`/api/v1/users/${studentUserId}/roles`)
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({ roleId: "super_admin" });
            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/super_admin/i);
        });

        it("returns 404 for non-existent role key", async () => {
            const res = await request
                .post(`/api/v1/users/${studentUserId}/roles`)
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({ roleId: "nonexistent_role" });
            expect(res.status).toBe(404);
        });

        it("admin (not super_admin) cannot assign roles (403)", async () => {
            const res = await request
                .post(`/api/v1/users/${studentUserId}/roles`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ roleId: "student" });
            expect(res.status).toBe(403);
        });
    });

    // ── Remove Role ───────────────────────────────────────────────────────────
    describe("DELETE /api/v1/users/:userId/roles/:roleId", () => {
        it("super_admin can remove instructor role", async () => {
            const res = await request
                .delete(`/api/v1/users/${studentUserId}/roles/instructor`)
                .set("Authorization", `Bearer ${superAdminToken}`);
            expect(res.status).toBe(200);
        });
    });

    // ── User Permissions ──────────────────────────────────────────────────────
    describe("GET /api/v1/users/:userId/permissions", () => {
        it("admin can view resolved permissions for a user", async () => {
            const res = await request
                .get(`/api/v1/users/${studentUserId}/permissions`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty("permissions");
            expect(res.body.data).toHaveProperty("permissionMap");
            expect(res.body.data).toHaveProperty("isSuperAdmin");
        });
    });

    // ── Grant / Revoke Permission Override ───────────────────────────────────
    describe("Permission override management", () => {
        it("super_admin can grant a permission override to a student", async () => {
            const res = await request
                .post(`/api/v1/users/${studentUserId}/permissions`)
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({ permissionId: "courses.create" });
            expect(res.status).toBe(200);
        });

        it("student now has courses.create in resolved permissions", async () => {
            const res = await request
                .get(`/api/v1/users/${studentUserId}/permissions`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.body.data.permissions).toContain("courses.create");
        });

        it("super_admin can deny a permission for a student", async () => {
            const res = await request
                .post(
                    `/api/v1/users/${studentUserId}/permissions/courses.read/deny`
                )
                .set("Authorization", `Bearer ${superAdminToken}`);
            expect(res.status).toBe(200);
        });

        it("super_admin can revoke the permission override", async () => {
            const res = await request
                .delete(
                    `/api/v1/users/${studentUserId}/permissions/courses.create`
                )
                .set("Authorization", `Bearer ${superAdminToken}`);
            expect(res.status).toBe(200);
        });
    });
});
