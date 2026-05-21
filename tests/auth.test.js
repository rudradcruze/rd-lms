/**
 * Auth API Tests
 * Covers: register, login, refresh token, change password, logout
 */
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { request, getToken, ensureConnected, teardown, CREDS } from "./helpers/setup.js";

describe("Auth API", () => {
    const uniqueEmail = `test_${Date.now()}@rd-lms.com`;
    const uniqueUsername = `user_${Date.now()}`.slice(0, 16);
    let accessToken;
    let refreshToken;

    beforeAll(async () => {
        await ensureConnected();
    });

    afterAll(async () => {
        await teardown();
    });

    // ── Register ─────────────────────────────────────────────────────────────
    describe("POST /api/v1/auth/register", () => {
        it("should register a new user successfully", async () => {
            const res = await request.post("/api/v1/auth/register").send({
                username: uniqueUsername,
                email: uniqueEmail,
                pass: "TestPass123!",
                firstname: "Test",
                lastname: "User",
            });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty("accessToken");
            expect(res.body.data).toHaveProperty("user");
            expect(res.body.data.user.email).toBe(uniqueEmail);
            expect(res.body.data.user.userInfo.firstName).toBe("Test");
            expect(res.body.data.user.userInfo.lastName).toBe("User");
        });

        it("should reject duplicate email", async () => {
            const res = await request.post("/api/v1/auth/register").send({
                username: `dup_${Date.now()}`.slice(0, 16),
                email: uniqueEmail,
                pass: "TestPass123!",
                firstname: "Duplicate",
                lastname: "User",
            });
            expect(res.status).toBe(409);
        });

        it("should reject missing password", async () => {
            const res = await request.post("/api/v1/auth/register").send({
                username: "missingpass",
                email: "missing@rd-lms.com",
                firstname: "Missing",
                lastname: "Pass",
            });
            expect(res.status).toBe(400);
        });
    });

    // ── Login ─────────────────────────────────────────────────────────────────
    describe("POST /api/v1/auth/login", () => {
        it("should login with valid credentials (email)", async () => {
            const res = await request.post("/api/v1/auth/login").send({
                identifier: CREDS.superAdmin.email,
                password: CREDS.superAdmin.password,
            });
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty("accessToken");
            expect(res.body.data).toHaveProperty("refreshToken");
            accessToken = res.body.data.accessToken;
            refreshToken = res.body.data.refreshToken;
        });

        it("should login with username instead of email", async () => {
            const res = await request.post("/api/v1/auth/login").send({
                identifier: "superadmin",
                password: CREDS.superAdmin.password,
            });
            expect(res.status).toBe(200);
        });

        it("should reject wrong password", async () => {
            const res = await request.post("/api/v1/auth/login").send({
                identifier: CREDS.superAdmin.email,
                password: "wrongpassword",
            });
            expect(res.status).toBe(401);
        });

        it("should reject non-existent user", async () => {
            const res = await request.post("/api/v1/auth/login").send({
                identifier: "nobody@nowhere.com",
                password: "TestPass123!",
            });
            expect(res.status).toBe(401);
        });
    });

    // ── Refresh Token ─────────────────────────────────────────────────────────
    describe("POST /api/v1/auth/refresh", () => {
        let freshRefreshToken;

        beforeAll(async () => {
            // Get a fresh pair of tokens specifically for refresh tests
            const res = await request.post("/api/v1/auth/login").send({
                identifier: CREDS.admin.email,
                password: CREDS.admin.password,
            });
            freshRefreshToken = res.body.data.refreshToken;
        });

        it("should issue new tokens with a valid refresh token", async () => {
            const res = await request.post("/api/v1/auth/refresh").send({
                refreshToken: freshRefreshToken,
            });
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty("accessToken");
        });

        it("should reject an invalid refresh token", async () => {
            const res = await request.post("/api/v1/auth/refresh").send({
                refreshToken: "this.is.invalid",
            });
            expect(res.status).toBe(401);
        });
    });


    // ── Change Password ───────────────────────────────────────────────────────
    describe("POST /api/v1/auth/change-password", () => {
        let studentToken;
        const newPassword = "NewPass456!";

        beforeAll(async () => {
            studentToken = await getToken(
                CREDS.student.email,
                CREDS.student.password
            );
        });

        it("should change password with correct old password", async () => {
            const res = await request
                .post("/api/v1/auth/change-password")
                .set("Authorization", `Bearer ${studentToken}`)
                .send({
                    oldPassword: CREDS.student.password,
                    newPassword,
                });
            expect(res.status).toBe(200);
        });

        it("should restore original password for further tests", async () => {
            const loginRes = await request.post("/api/v1/auth/login").send({
                identifier: CREDS.student.email,
                password: newPassword,
            });
            const tok = loginRes.body.data.accessToken;

            const res = await request
                .post("/api/v1/auth/change-password")
                .set("Authorization", `Bearer ${tok}`)
                .send({
                    oldPassword: newPassword,
                    newPassword: CREDS.student.password,
                });
            expect(res.status).toBe(200);
        });
    });

    // ── Logout ────────────────────────────────────────────────────────────────
    describe("POST /api/v1/auth/logout", () => {
        it("should logout successfully", async () => {
            const loginRes = await request.post("/api/v1/auth/login").send({
                identifier: CREDS.instructor.email,
                password: CREDS.instructor.password,
            });
            const tok = loginRes.body.data.accessToken;
            const rt = loginRes.body.data.refreshToken;

            const res = await request
                .post("/api/v1/auth/logout")
                .set("Authorization", `Bearer ${tok}`)
                .send({ refreshToken: rt });
            expect(res.status).toBe(200);
        });
    });
});
