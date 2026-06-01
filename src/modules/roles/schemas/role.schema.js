import { z } from "zod";
import {
    permissionIdBody,
    roleIdParamSchema,
    rolePermissionParamsSchema,
} from "../../../utils/validationSchemas.js";

export const createRoleSchema = z.object({
    body: z.object({
        key: z
            .string()
            .min(1, "Role key is required")
            .regex(/^[a-z_]+$/, "Role key must be lowercase with underscores"),
        name: z.string().min(1, "Role name is required"),
        description: z.string().optional(),
    }),
});

export const updateRoleSchema = z.object({
    params: roleIdParamSchema.shape.params,
    body: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
    }),
});

export const assignPermissionSchema = z.object({
    params: roleIdParamSchema.shape.params,
    body: z.object({
        permissionId: permissionIdBody,
    }),
});

export { roleIdParamSchema, rolePermissionParamsSchema };
