import { z } from "zod";

const digitsOnlyMessage = "ID must be a positive integer";

export const positiveBigIntParam = z
    .string()
    .regex(/^\d+$/, digitsOnlyMessage)
    .transform((v) => BigInt(v))
    .refine((v) => v > 0n, "ID must be greater than zero");

export const optionalPositiveBigInt = z
    .string()
    .regex(/^\d+$/, digitsOnlyMessage)
    .transform((v) => BigInt(v))
    .refine((v) => v > 0n, "ID must be greater than zero")
    .optional();

export const roleKeySchema = z
    .string()
    .min(1)
    .regex(/^[a-z_]+$/, "Role key must be lowercase with underscores");

export const permissionKeySchema = z
    .string()
    .min(1)
    .regex(
        /^[a-z_.]+$/,
        "Permission key must be lowercase with underscores and dots"
    );

export const numericIdFromBody = z
    .union([
        z.string().regex(/^\d+$/, digitsOnlyMessage),
        z.number().int().positive(),
        z.bigint().refine((v) => v > 0n, "ID must be greater than zero"),
    ])
    .transform((v) => (typeof v === "bigint" ? v : BigInt(String(v))));

export const optionalNumericIdFromBody = numericIdFromBody.optional();

export const roleIdBody = z.union([numericIdFromBody, roleKeySchema]);

export const permissionIdBody = z.union([
    numericIdFromBody,
    permissionKeySchema,
]);

export const userIdParamSchema = z.object({
    params: z.object({
        userId: positiveBigIntParam,
    }),
});

export const roleIdParamSchema = z.object({
    params: z.object({
        roleId: positiveBigIntParam,
    }),
});

export const permissionIdParamSchema = z.object({
    params: z.object({
        permissionId: positiveBigIntParam,
    }),
});

export const courseIdParamSchema = z.object({
    params: z.object({
        courseId: positiveBigIntParam,
    }),
});

export const userRoleParamsSchema = z.object({
    params: z.object({
        userId: positiveBigIntParam,
        roleId: positiveBigIntParam,
    }),
});

export const userPermissionParamsSchema = z.object({
    params: z.object({
        userId: positiveBigIntParam,
        permissionId: positiveBigIntParam,
    }),
});

export const rolePermissionParamsSchema = z.object({
    params: z.object({
        roleId: positiveBigIntParam,
        permissionId: positiveBigIntParam,
    }),
});

export const courseUserParamsSchema = z.object({
    params: z.object({
        courseId: positiveBigIntParam,
        userId: positiveBigIntParam,
    }),
});

export const enrollmentIdParamSchema = z.object({
    params: z.object({
        enrollmentId: positiveBigIntParam,
    }),
});
