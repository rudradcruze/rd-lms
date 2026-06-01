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
    let instructorRoleId;
    let coursesReadPermissionId;
    let coursesCreatePermissionId;

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
            .get("/api/v1/users?role=student&limit=100")
            .set("Authorization", `Bearer ${superAdminToken}`);
        const student = usersRes.body.data.users.find(
            (u) => u.email === CREDS.student.email
        );
        if (!student) {
            throw new Error(`Student with email ${CREDS.student.email} not found in seeded users.`);
        }
        studentUserId = student.id;

        const rolesRes = await request
            .get("/api/v1/roles?limit=100")
            .set("Authorization", `Bearer ${superAdminToken}`);
        const instructorRole = rolesRes.body.data.roles.find(
            (r) => r.key === "instructor"
        );
        if (!instructorRole) {
            throw new Error("Instructor role not found in seeded roles.");
        }
        instructorRoleId = instructorRole.id;

        const permsRes = await request
            .get("/api/v1/permissions?limit=100")
            .set("Authorization", `Bearer ${superAdminToken}`);
        const coursesRead = permsRes.body.data.permissions.find(
            (p) => p.key === "courses.read"
        );
        const coursesCreate = permsRes.body.data.permissions.find(
            (p) => p.key === "courses.create"
        );
        if (!coursesRead || !coursesCreate) {
            throw new Error("Expected courses.read and courses.create permissions in seed.");
        }
        coursesReadPermissionId = coursesRead.id;
        coursesCreatePermissionId = coursesCreate.id;
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
                .get("/api/v1/users/999999999")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });

        it("rejects non-numeric userId", async () => {
            const res = await request
                .get("/api/v1/users/abc")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(400);
        });

        it("rejects decimal userId", async () => {
            const res = await request
                .get("/api/v1/users/1.5")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(400);
        });

        it("rejects negative userId", async () => {
            const res = await request
                .get("/api/v1/users/-1")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(400);
        });

        it("rejects zero userId", async () => {
            const res = await request
                .get("/api/v1/users/0")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(400);
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
                .delete(
                    `/api/v1/users/${studentUserId}/roles/${instructorRoleId}`
                )
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
                    `/api/v1/users/${studentUserId}/permissions/${coursesReadPermissionId}/deny`
                )
                .set("Authorization", `Bearer ${superAdminToken}`);
            expect(res.status).toBe(200);
        });

        it("super_admin can revoke the permission override", async () => {
            const res = await request
                .delete(
                    `/api/v1/users/${studentUserId}/permissions/${coursesCreatePermissionId}`
                )
                .set("Authorization", `Bearer ${superAdminToken}`);
            expect(res.status).toBe(200);
        });
    });

    // ── User Onboarding ───────────────────────────────────────────────────────
    describe("POST /api/v1/users (Administrative Onboarding)", () => {
        let uniqueId = 0;
        const nextUser = () => {
            uniqueId += 1;
            const rand = Math.floor(Math.random() * 100000);
            return {
                username: `onb_${uniqueId}_${rand}`.substring(0, 16),
                email: `onboard_${uniqueId}_${rand}@rd-lms.com`,
                pass: "StrongPassword123!",
                firstname: "First",
                lastname: "Last",
            };
        };


        it("super_admin can successfully onboard an instructor", async () => {
            const userData = nextUser();
            const res = await request
                .post("/api/v1/users")
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({
                    ...userData,
                    role: "instructor",
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.username).toBe(userData.username);
            expect(res.body.data.email).toBe(userData.email.toLowerCase());
            
            const roles = res.body.data.userRoles.map((ur) => ur.role.key);
            expect(roles).toContain("instructor");
            expect(res.body.data.userInfo.firstName).toBe(userData.firstname);
            expect(res.body.data.userInfo.lastName).toBe(userData.lastname);
            expect(res.body.data).not.toHaveProperty("passwordHash");
            expect(res.body.data).not.toHaveProperty("password");
        });

        it("super_admin can successfully onboard an admin", async () => {
            const userData = nextUser();
            const res = await request
                .post("/api/v1/users")
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({
                    ...userData,
                    role: "admin",
                });

            expect(res.status).toBe(201);
            expect(res.body.data.username).toBe(userData.username);
            const roles = res.body.data.userRoles.map((ur) => ur.role.key);
            expect(roles).toContain("admin");
        });

        it("admin can successfully onboard a student", async () => {
            const userData = nextUser();
            const res = await request
                .post("/api/v1/users")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    ...userData,
                    role: "student",
                });

            expect(res.status).toBe(201);
            expect(res.body.data.username).toBe(userData.username);
            const roles = res.body.data.userRoles.map((ur) => ur.role.key);
            expect(roles).toContain("student");
        });

        it("student cannot onboard a user (403)", async () => {
            const userData = nextUser();
            const res = await request
                .post("/api/v1/users")
                .set("Authorization", `Bearer ${studentToken}`)
                .send({
                    ...userData,
                    role: "student",
                });

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/insufficient permissions/i);
        });

        it("returns 400 for validation errors (missing fields)", async () => {
            const res = await request
                .post("/api/v1/users")
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({
                    username: "test",
                });

            expect(res.status).toBe(400);
        });

        it("returns 409 Conflict if email is already taken", async () => {
            const userData = nextUser();
            
            await request
                .post("/api/v1/users")
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({
                    ...userData,
                    role: "student",
                });

            const res = await request
                .post("/api/v1/users")
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({
                    ...userData,
                    username: `diff${userData.username}`.substring(0, 15),
                    role: "student",
                });

            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/email.*registered/i);
        });

        it("returns 409 Conflict if username is already taken", async () => {
            const userData = nextUser();
            
            await request
                .post("/api/v1/users")
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({
                    ...userData,
                    role: "student",
                });

            const res = await request
                .post("/api/v1/users")
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({
                    ...userData,
                    email: `diff${userData.email}`,
                    role: "student",
                });

            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/username.*taken/i);
        });

        it("prevents onboarding super_admin role (403)", async () => {
            const userData = nextUser();
            const res = await request
                .post("/api/v1/users")
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({
                    ...userData,
                    role: "super_admin",
                });

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/super_admin/i);
        });

        it("returns 404 for non-existent role", async () => {
            const userData = nextUser();
            const res = await request
                .post("/api/v1/users")
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({
                    ...userData,
                    role: "non_existent_role_key_abc",
                });

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/role not found/i);
        });
    });
});

