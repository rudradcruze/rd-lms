import { z } from "zod";

const uuidSchema = z.string().uuid("Invalid UUID format");

const courseSettingsSchema = z.object({
    allowSelfEnrollment: z.boolean().optional(),
    requiresApproval: z.boolean().optional(),
    showInCatalog: z.boolean().optional(),
    enableDiscussions: z.boolean().optional(),
});

export const createCourseSchema = z.object({
    body: z.object({
        title: z
            .string()
            .min(3, "Title must be at least 3 characters")
            .max(200, "Title must be at most 200 characters"),
        slug: z.string().optional(),
        shortDescription: z.string().optional(),
        description: z
            .string()
            .max(10000, "Description must be at most 10000 characters")
            .optional(),
        thumbnailUrl: z
            .string()
            .url("Thumbnail URL must be a valid URL")
            .optional(),
        categoryId: uuidSchema.optional(),
    }),
});

export const updateCourseSchema = z.object({
    params: z.object({
        courseId: uuidSchema,
    }),
    body: z.object({
        title: z
            .string()
            .min(3, "Title must be at least 3 characters")
            .max(200, "Title must be at most 200 characters")
            .optional(),
        slug: z.string().optional(),
        shortDescription: z.string().optional(),
        description: z
            .string()
            .max(10000, "Description must be at most 10000 characters")
            .optional(),
        thumbnailUrl: z
            .string()
            .url("Thumbnail URL must be a valid URL")
            .optional(),
        categoryId: uuidSchema.optional(),
        settings: courseSettingsSchema.optional(),
    }),
});

export const listCoursesSchema = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        search: z.string().optional(),
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
        categoryId: uuidSchema.optional(),
        instructorId: uuidSchema.optional(),
    }),
});

export const courseIdParamSchema = z.object({
    params: z.object({
        courseId: uuidSchema,
    }),
});

export const assignInstructorSchema = z.object({
    params: z.object({
        courseId: uuidSchema,
    }),
    body: z.object({
        userId: uuidSchema,
        isPrimary: z.boolean().optional(),
    }),
});

export const removeInstructorParamSchema = z.object({
    params: z.object({
        courseId: uuidSchema,
        userId: uuidSchema,
    }),
});

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(1, "Category name is required"),
        description: z.string().optional(),
    }),
});
