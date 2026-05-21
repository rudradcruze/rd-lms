import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { PORT } from "../constants.js";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "RD-LMS Authorization Core API",
            version: "1.0.0",
            description: "Interactive Learning Management System (LMS) Authorization and Authentication backend API. Built with Node.js, Express, Prisma, PostgreSQL, and Redis.",
            contact: {
                name: "Francis Rudra D Cruze",
                email: "francisrudra@gmail.com",
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
                    description: "Enter your Bearer Access Token to access secure endpoints.",
                },
            },
            schemas: {
                ApiResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: true },
                        statusCode: { type: "integer", example: 200 },
                        message: { type: "string", example: "Operation completed successfully." },
                        data: { type: "object", nullable: true },
                    },
                },
                ApiError: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        message: { type: "string", example: "Error occurred" },
                        errors: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    field: { type: "string", example: "email" },
                                    message: { type: "string", example: "Invalid email" },
                                },
                            },
                        },
                    },
                },
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        username: { type: "string", example: "johndoe" },
                        email: { type: "string", format: "email", example: "john@example.com" },
                        isActive: { type: "boolean", example: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                        userInfo: {
                            type: "object",
                            properties: {
                                firstName: { type: "string", example: "John" },
                                lastName: { type: "string", example: "Doe" },
                            },
                        },
                    },
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
                    description: "Allows visitors to register a new LMS account. Limits registration requests to 10 per hour per IP address.",
                    tags: ["Authentication"],
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["username", "email", "pass", "firstname", "lastname"],
                                    properties: {
                                        username: { type: "string", minLength: 4, maxLength: 16, example: "student_one" },
                                        email: { type: "string", format: "email", example: "student1@rd-lms.com" },
                                        pass: { type: "string", minLength: 8, example: "Password123!" },
                                        firstname: { type: "string", example: "Student" },
                                        lastname: { type: "string", example: "One" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: "User registered successfully",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/ApiResponse",
                                    },
                                },
                            },
                        },
                        400: { description: "Input Validation Error", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
                        409: { description: "Email or Username already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
                        429: { description: "Rate limit exceeded (10 registrations/hour)", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
                    },
                },
            },
            "/auth/login": {
                post: {
                    summary: "Authenticate user and issue tokens",
                    description: "Logs a user in using email/username and password. Rotates sessions using dynamic token pairs.",
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
                                        identifier: { type: "string", example: "superadmin@rd-lms.com" },
                                        password: { type: "string", example: "AdminPass123!" },
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
                                            success: { type: "boolean", example: true },
                                            data: {
                                                type: "object",
                                                properties: {
                                                    user: { $ref: "#/components/schemas/User" },
                                                    accessToken: { type: "string" },
                                                    refreshToken: { type: "string" },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: "Missing inputs" },
                        401: { description: "Invalid credentials" },
                        429: { description: "Rate limit exceeded (20 login attempts/15 mins)" },
                    },
                },
            },
            "/auth/refresh": {
                post: {
                    summary: "Refresh access token",
                    description: "Generates a fresh access/refresh token pair using a valid, non-blacklisted refresh token.",
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
                        200: { description: "Token refreshed successfully" },
                        401: { description: "Invalid or blacklisted refresh token" },
                    },
                },
            },
            "/auth/logout": {
                post: {
                    summary: "Log out user",
                    description: "Blacklists the user's active refresh token in both PostgreSQL and Redis to end the session.",
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
                        200: { description: "Logged out successfully" },
                        401: { description: "Unauthorized" },
                    },
                },
            },
            "/auth/change-password": {
                post: {
                    summary: "Change current password",
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
                                        oldPassword: { type: "string", example: "AdminPass123!" },
                                        newPassword: { type: "string", example: "NewAdminSecure99!" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Password changed successfully" },
                        400: { description: "Validation error (new password matches old password)" },
                        401: { description: "Invalid old password / unauthorized" },
                    },
                },
            },
        },
    },
    apis: [
        "./src/modules/users/routes/user.routes.js",
        "./src/modules/roles/routes/role.routes.js",
        "./src/modules/permissions/routes/permission.routes.js"
    ],
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app) => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log("📘 Swagger API Docs available at /api-docs");
};
