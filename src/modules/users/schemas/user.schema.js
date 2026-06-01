import { z } from "zod";
import {
    permissionIdBody,
    positiveBigIntParam,
    roleIdBody,
    userIdParamSchema,
    userPermissionParamsSchema,
    userRoleParamsSchema,
} from "../../../utils/validationSchemas.js";

export const assignRoleSchema = z.object({
    params: userIdParamSchema.shape.params,
    body: z.object({
        roleId: roleIdBody,
    }),
});

export const grantPermissionSchema = z.object({
    params: userIdParamSchema.shape.params,
    body: z.object({
        permissionId: permissionIdBody,
    }),
});

export const onboardUserSchema = z.object({
    body: z.object({
        username: z
            .string()
            .min(4, "Username must be at least 4 characters")
            .max(16, "Username must be at most 16 characters")
            .regex(
                /^[a-zA-Z0-9_.]+$/,
                "Username can only contain letters, numbers, dots, and underscores"
            ),
        email: z.string().email("Please provide a valid email address"),
        pass: z.string().min(8, "Password must be at least 8 characters"),
        firstname: z.string().min(1, "First name is required"),
        lastname: z.string().min(1, "Last name is required"),
        role: z.string().min(1, "Role is required"),
    }),
});

export {
    userIdParamSchema,
    userRoleParamsSchema,
    userPermissionParamsSchema,
    positiveBigIntParam,
};
