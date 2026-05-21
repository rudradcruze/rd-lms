import { z } from "zod";

export const assignRoleSchema = z.object({
    body: z.object({
        roleId: z.string().min(1, "Role ID is required"),
    }),
});

export const grantPermissionSchema = z.object({
    body: z.object({
        permissionId: z.string().min(1, "Permission ID is required"),
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
