import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { PORT } from "../constants.js";
import logger from "./logger.js";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "RD-LMS API",
            version: "1.0.0",
            description:
                "Learning Management System backend API — authentication, RBAC, and course management. Built with Node.js, Express, Prisma, PostgreSQL, and Redis.",
            contact: {
                name: "Francis Rudra D Cruze",
                email: "francisrudra@gmail.com",
                phone: "+8801870179066",
            },
        },
        servers: [
            {
                url: `http://localhost:${PORT}/api/v1`,
                description: "Local development server",
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description:
                        "Enter your Bearer Access Token to access secure endpoints.",
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
        paths: {
            "/auth/register": {
                post: {
                    summary: "Register a new user",
                    description:
                        "Allows visitors to register a new LMS account. Registering a new user dynamically assigns the 'student' role by default. All other roles (such as instructor, admin) must be onboarded administratively by authorized users. Limits registration requests to 10 per hour per IP address.",
                    tags: ["Authentication"],
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: [
                                        "username",
                                        "email",
                                        "pass",
                                        "firstname",
                                        "lastname",
                                    ],
                                    properties: {
                                        username: {
                                            type: "string",
                                            minLength: 4,
                                            maxLength: 16,
                                            example: "student_one",
                                        },
                                        email: {
                                            type: "string",
                                            format: "email",
                                            example: "student1@rd-lms.com",
                                        },
                                        pass: {
                                            type: "string",
                                            minLength: 8,
                                            example: "Password123!",
                                        },
                                        firstname: {
                                            type: "string",
                                            example: "Student",
                                        },
                                        lastname: {
                                            type: "string",
                                            example: "One",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description:
                                "User registered successfully with default 'student' role",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/ApiResponse",
                                    },
                                },
                            },
                        },
                        400: {
                            description: "Input Validation Error",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/ApiError",
                                    },
                                },
                            },
                        },
                        409: {
                            description: "Email or Username already exists",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/ApiError",
                                    },
                                },
                            },
                        },
                        429: {
                            description:
                                "Rate limit exceeded (10 registrations/hour)",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/ApiError",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            "/auth/login": {
                post: {
                    summary: "Authenticate user and issue tokens",
                    description:
                        "Logs a user in using email/username and password. Rotates sessions using dynamic token pairs. Caches active credential lookups in Redis.",
                    tags: ["Authentication"],
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["identifier", "password"],
                                    properties: {
                                        identifier: {
                                            type: "string",
                                            example: "superadmin@rd-lms.com",
                                        },
                                        password: {
                                            type: "string",
                                            example: "AdminPass123!",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Login successful",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            success: {
                                                type: "boolean",
                                                example: true,
                                            },
                                            data: {
                                                type: "object",
                                                properties: {
                                                    user: {
                                                        $ref: "#/components/schemas/User",
                                                    },
                                                    accessToken: {
                                                        type: "string",
                                                    },
                                                    refreshToken: {
                                                        type: "string",
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: "Missing inputs" },
                        401: { description: "Invalid credentials" },
                        429: {
                            description:
                                "Rate limit exceeded (20 login attempts/15 mins)",
                        },
                    },
                },
            },
            "/auth/refresh": {
                post: {
                    summary: "Refresh access token",
                    description:
                        "Generates a fresh access/refresh token pair using a valid, non-blacklisted refresh token. Optimizes performance using a Redis cache-aside design to bypass PostgreSQL queries in O(1) time. Outages fail-soft back to database lookups.",
                    tags: ["Authentication"],
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["refreshToken"],
                                    properties: {
                                        refreshToken: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description:
                                "Token refreshed successfully with performance-optimized rotation",
                        },
                        401: {
                            description:
                                "Invalid, rotated, or blacklisted refresh token",
                        },
                    },
                },
            },
            "/auth/access": {
                post: {
                    summary: "Generate new access token",
                    description:
                        "Generates ONLY a new access token using a valid, non-blacklisted refresh token without rotating or invalidating the refresh token. This provides a low-overhead path for token refreshes, utilizing high-performance Redis cache-aside lookups in O(1) time.",
                    tags: ["Authentication"],
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["refreshToken"],
                                    properties: {
                                        refreshToken: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description:
                                "New access token retrieved successfully without rotating the refresh token",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            success: {
                                                type: "boolean",
                                                example: true,
                                            },
                                            data: {
                                                type: "object",
                                                properties: {
                                                    accessToken: {
                                                        type: "string",
                                                    },
                                                    user: {
                                                        $ref: "#/components/schemas/User",
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        401: {
                            description:
                                "Invalid, expired, or blacklisted refresh token",
                        },
                    },
                },
            },
            "/auth/logout": {
                post: {
                    summary: "Log out user",
                    description:
                        "Ends the active session. Blacklists the refresh token in PostgreSQL and purges the cached session from Redis in O(1) time.",
                    tags: ["Authentication"],
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["refreshToken"],
                                    properties: {
                                        refreshToken: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description:
                                "Logged out successfully and token cache purged",
                        },
                        401: { description: "Unauthorized" },
                    },
                },
            },
            "/auth/change-password": {
                post: {
                    summary: "Change current password",
                    description:
                        "Changes the authenticated user's password. Instantly retrieves all active refresh tokens from the Redis session tracking set and pipeline-invalidates them in O(1) time, dynamically logging out all active devices.",
                    tags: ["Authentication"],
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["oldPassword", "newPassword"],
                                    properties: {
                                        oldPassword: {
                                            type: "string",
                                            example: "AdminPass123!",
                                        },
                                        newPassword: {
                                            type: "string",
                                            example: "NewAdminSecure99!",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description:
                                "Password changed successfully and all active device sessions revoked",
                        },
                        400: {
                            description:
                                "Validation error (new password matches old password)",
                        },
                        401: {
                            description: "Invalid old password / unauthorized",
                        },
                    },
                },
            },
            "/auth/check-availability": {
                get: {
                    summary: "Quick availability check for username and email",
                    description:
                        "Checks if a username and/or email is available (not taken). Public unauthenticated endpoint utilizing Redis cache-aside caching.",
                    tags: ["Authentication"],
                    security: [],
                    parameters: [
                        {
                            name: "username",
                            in: "query",
                            description:
                                "The username to check availability for",
                            required: false,
                            schema: {
                                type: "string",
                                minLength: 4,
                                maxLength: 16,
                            },
                        },
                        {
                            name: "email",
                            in: "query",
                            description:
                                "The email address to check availability for",
                            required: false,
                            schema: {
                                type: "string",
                                format: "email",
                            },
                        },
                    ],
                    responses: {
                        200: {
                            description:
                                "Availability check status retrieved successfully",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            success: {
                                                type: "boolean",
                                                example: true,
                                            },
                                            statusCode: {
                                                type: "integer",
                                                example: 200,
                                            },
                                            message: {
                                                type: "string",
                                                example:
                                                    "Availability check completed successfully",
                                            },
                                            data: {
                                                type: "object",
                                                properties: {
                                                    username: {
                                                        type: "object",
                                                        properties: {
                                                            available: {
                                                                type: "boolean",
                                                                example: true,
                                                            },
                                                        },
                                                    },
                                                    email: {
                                                        type: "object",
                                                        properties: {
                                                            available: {
                                                                type: "boolean",
                                                                example: false,
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        400: {
                            description: "Input Validation Error",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/ApiError",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    apis: [
        "./src/configurations/swagger.schemas.js",
        "./src/modules/users/routes/user.routes.js",
        "./src/modules/roles/routes/role.routes.js",
        "./src/modules/permissions/routes/permission.routes.js",
        "./src/modules/courses/routes/courses.routes.js",
        "./src/modules/enrollments/routes/enrollments.routes.js",
        "./src/modules/content/routes/content.routes.js",
    ],
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app) => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    logger.info("📘 Swagger API Docs available at /api-docs");
};
