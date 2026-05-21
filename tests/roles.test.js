/**
 * Roles API Tests
 * Covers: CRUD for roles, permission assignment to roles
 */
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { request, getToken, ensureConnected, teardown, CREDS } from "./helpers/setup.js";

describe("Roles API", () => {
    let superAdminToken;
    let studentToken;
    let createdRoleId;

    beforeAll(async () => {
        await ensureConnected();
        superAdminToken = await getToken(
            CREDS.superAdmin.email,
            CREDS.superAdmin.password
        );
        studentToken = await getToken(
            CREDS.student.email,
            CREDS.student.password
        );
    });

    afterAll(async () => {
        await teardown();
    });

    // ── List Roles ────────────────────────────────────────────────────────────
    describe("GET /api/v1/roles", () => {
        it("authenticated user can list roles", async () => {
            const res = await request
                .get("/api/v1/roles")
                .set("Authorization", `Bearer ${studentToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data.roles)).toBe(true);
        });

        it("returns all 4 seeded roles", async () => {
            const res = await request
                .get("/api/v1/roles?limit=100")
                .set("Authorization", `Bearer ${superAdminToken}`);
            const keys = res.body.data.roles.map((r) => r.key);
            expect(keys).toContain("super_admin");
            expect(keys).toContain("admin");
            expect(keys).toContain("instructor");
            expect(keys).toContain("student");
        });
    });

    // ── Create Role ───────────────────────────────────────────────────────────
    describe("POST /api/v1/roles", () => {
        it("super_admin can create a new role", async () => {
            const res = await request
                .post("/api/v1/roles")
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({
                    name: "Test Role",
                    key: "test_role",
                    description: "A temporary role for testing",
                });
            expect(res.status).toBe(201);
            expect(res.body.data.key).toBe("test_role");
            createdRoleId = res.body.data.id;
        });

        it("student cannot create a role (403)", async () => {
            const res = await request
                .post("/api/v1/roles")
                .set("Authorization", `Bearer ${studentToken}`)
                .send({ name: "Hack Role", key: "hack_role" });
            expect(res.status).toBe(403);
        });

        it("returns 400 for duplicate role key", async () => {
            const res = await request
                .post("/api/v1/roles")
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({ name: "Another Admin", key: "admin" });
            expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });

    // ── Get Role By ID ────────────────────────────────────────────────────────
    describe("GET /api/v1/roles/:roleId", () => {
        it("can get role by ID", async () => {
            const res = await request
                .get(`/api/v1/roles/${createdRoleId}`)
                .set("Authorization", `Bearer ${studentToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.key).toBe("test_role");
        });

        it("returns 404 for non-existent role", async () => {
            const res = await request
                .get("/api/v1/roles/00000000-0000-0000-0000-000000000000")
                .set("Authorization", `Bearer ${superAdminToken}`);
            expect(res.status).toBe(404);
        });
    });

    // ── Update Role ───────────────────────────────────────────────────────────
    describe("PUT /api/v1/roles/:roleId", () => {
        it("super_admin can update a role's description", async () => {
            const res = await request
                .put(`/api/v1/roles/${createdRoleId}`)
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({ description: "Updated description" });
            expect(res.status).toBe(200);
        });
    });

    // ── Assign Permission to Role ─────────────────────────────────────────────
    describe("POST /api/v1/roles/:roleId/permissions", () => {
        it("super_admin can assign a permission to the test role", async () => {
            // Get permission ID for courses.read
            const permsRes = await request
                .get("/api/v1/permissions")
                .set("Authorization", `Bearer ${superAdminToken}`);
            const courseReadPerm = permsRes.body.data.permissions.find(
                (p) => p.key === "courses.read"
            );
            expect(courseReadPerm).toBeDefined();

            const res = await request
                .post(`/api/v1/roles/${createdRoleId}/permissions`)
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({ permissionId: courseReadPerm.id });
            expect(res.status).toBe(200);
        });
    });

    // ── Delete Role ───────────────────────────────────────────────────────────
    describe("DELETE /api/v1/roles/:roleId", () => {
        it("super_admin can delete the test role", async () => {
            const res = await request
                .delete(`/api/v1/roles/${createdRoleId}`)
                .set("Authorization", `Bearer ${superAdminToken}`);
            expect(res.status).toBe(200);
        });
    });
});
