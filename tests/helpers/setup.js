/**
 * Test setup helper
 *
 * Creates a supertest agent from the Express app WITHOUT starting the HTTP server.
 * Manages Redis + Prisma lifecycle for the test suite via globalSetup/globalTeardown.
 */
import supertest from "supertest";
import { connectRedis } from "../../src/configurations/db.redis.js";
import redisClient from "../../src/configurations/db.redis.js";
import prisma from "../../src/configurations/db.postgres.js";
import app from "../../src/app.js";

// Ensure connections are alive before tests run
let connected = false;
async function ensureConnected() {
    if (connected) return;
    try {
        if (!redisClient.isOpen) {
            await connectRedis();
        }
        await prisma.$connect();
        connected = true;
    } catch (err) {
        console.error("Test setup connection failed:", err);
        throw err;
    }
}

// Supertest agent (no HTTP server started)
export const request = supertest(app);

/**
 * Login as a user and return the access token.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} accessToken
 */
export async function getToken(email, password) {
    await ensureConnected();

    const res = await request
        .post("/api/v1/auth/login")
        .send({ identifier: email, password });

    if (res.status !== 200) {
        throw new Error(
            `Login failed for ${email}: ${res.status} – ${JSON.stringify(res.body)}`
        );
    }
    return res.body.data.accessToken;
}

// Utility to call ensureConnected from test beforeAll hooks.
export { ensureConnected };

/**
 * Clean up connections after all tests in a suite run.
 */
export async function teardown() {
    try {
        if (redisClient.isOpen) {
            await redisClient.disconnect();
        }
        await prisma.$disconnect();
    } catch (err) {
        console.error("Test teardown connection failed:", err);
    }
}

// ─── Seeded Credentials ───────────────────────────────────────────────────────
export const CREDS = {
    superAdmin: { email: "superadmin@rd-lms.com", password: "AdminPass123!" },
    admin:      { email: "admin@rd-lms.com",      password: "AdminPass123!" },
    instructor: { email: "instructor1@rd-lms.com",password: "Pass123!inst" },
    student:    { email: "student1@rd-lms.com",   password: "Pass123!std1" },
};
