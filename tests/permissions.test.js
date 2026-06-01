/**
 * Permissions API Tests
 * Covers: CRUD for permissions, param validation
 */
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import {
    request,
    getToken,
    ensureConnected,
    teardown,
    CREDS,
} from "./helpers/setup.js";

describe("Permissions API", () => {
    let superAdminToken;
    let studentToken;
    let createdPermissionId;

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

    describe("GET /api/v1/permissions", () => {
        it("authenticated user can list permissions", async () => {
            const res = await request
                .get("/api/v1/permissions")
                .set("Authorization", `Bearer ${studentToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data.permissions)).toBe(true);
        });
    });

    describe("POST /api/v1/permissions", () => {
        it("super_admin can create a new permission", async () => {
            const suffix = Array.from({ length: 8 }, () =>
                String.fromCharCode(97 + Math.floor(Math.random() * 26))
            ).join("");
            const key = `test_perm_${suffix}`;
            const res = await request
                .post("/api/v1/permissions")
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({
                    key,
                    name: "Test Permission",
                    resource: "test",
                    action: "read",
                    description: "Temporary permission for testing",
                });
            expect(res.status).toBe(201);
            expect(res.body.data.key).toBe(key);
            expect(typeof res.body.data.id).toBe("string");
            createdPermissionId = res.body.data.id;
        });

        it("student cannot create a permission (403)", async () => {
            const res = await request
                .post("/api/v1/permissions")
                .set("Authorization", `Bearer ${studentToken}`)
                .send({
                    key: "test.hack",
                    name: "Hack",
                    resource: "test",
                    action: "read",
                });
            expect(res.status).toBe(403);
        });
    });

    describe("GET /api/v1/permissions/:permissionId", () => {
        it("can get permission by ID", async () => {
            const res = await request
                .get(`/api/v1/permissions/${createdPermissionId}`)
                .set("Authorization", `Bearer ${studentToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(createdPermissionId);
        });

        it("returns 404 for non-existent permission", async () => {
            const res = await request
                .get("/api/v1/permissions/999999999")
                .set("Authorization", `Bearer ${superAdminToken}`);
            expect(res.status).toBe(404);
        });

        it("rejects non-numeric permissionId", async () => {
            const res = await request
                .get("/api/v1/permissions/abc")
                .set("Authorization", `Bearer ${superAdminToken}`);
            expect(res.status).toBe(400);
        });

        it("rejects decimal permissionId", async () => {
            const res = await request
                .get("/api/v1/permissions/1.5")
                .set("Authorization", `Bearer ${superAdminToken}`);
            expect(res.status).toBe(400);
        });

        it("rejects negative permissionId", async () => {
            const res = await request
                .get("/api/v1/permissions/-1")
                .set("Authorization", `Bearer ${superAdminToken}`);
            expect(res.status).toBe(400);
        });

        it("rejects zero permissionId", async () => {
            const res = await request
                .get("/api/v1/permissions/0")
                .set("Authorization", `Bearer ${superAdminToken}`);
            expect(res.status).toBe(400);
        });
    });

    describe("PUT /api/v1/permissions/:permissionId", () => {
        it("super_admin can update a permission", async () => {
            const res = await request
                .put(`/api/v1/permissions/${createdPermissionId}`)
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({ description: "Updated test permission" });
            expect(res.status).toBe(200);
        });
    });

    describe("DELETE /api/v1/permissions/:permissionId", () => {
        it("super_admin can delete the test permission", async () => {
            const res = await request
                .delete(`/api/v1/permissions/${createdPermissionId}`)
                .set("Authorization", `Bearer ${superAdminToken}`);
            expect(res.status).toBe(200);
        });
    });
});
