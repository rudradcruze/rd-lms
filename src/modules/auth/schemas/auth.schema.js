import { z } from "zod";

export const registerSchema = z.object({
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
    }),
});

export const loginSchema = z.object({
    body: z.object({
        identifier: z.string().min(1, "Email or username is required"),
        password: z.string().min(1, "Password is required"),
    }),
});

export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, "Refresh token is required"),
    }),
});

export const logoutSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, "Refresh token is required"),
    }),
});

export const changePasswordSchema = z.object({
    body: z
        .object({
            oldPassword: z.string().min(1, "Old password is required"),
            newPassword: z
                .string()
                .min(8, "New password must be at least 8 characters"),
        })
        .refine((data) => data.newPassword !== data.oldPassword, {
            message: "New password must be different from old password",
            path: ["newPassword"],
        }),
});

export const passwordResetSchema = z.object({
    body: z.object({
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters"),
    }),
});

export const checkAvailabilitySchema = z.object({
    query: z
        .object({
            username: z
                .string()
                .min(4, "Username must be at least 4 characters")
                .max(16, "Username must be at most 16 characters")
                .regex(
                    /^[a-zA-Z0-9_.]+$/,
                    "Username can only contain letters, numbers, dots, and underscores"
                )
                .optional(),
            email: z.string().email("Please provide a valid email address").optional(),
        })
        .refine((data) => data.username !== undefined || data.email !== undefined, {
            message: "Either username or email must be provided for availability checking",
            path: ["username"],
        }),
});
