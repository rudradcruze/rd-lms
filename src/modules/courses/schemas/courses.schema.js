import { z } from "zod";
import {
    courseIdParamSchema,
    courseUserParamsSchema,
    numericIdFromBody,
    optionalNumericIdFromBody,
    optionalPositiveBigInt,
} from "../../../utils/validationSchemas.js";

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
        categoryId: optionalNumericIdFromBody,
    }),
});

export const updateCourseSchema = z.object({
    params: courseIdParamSchema.shape.params,
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
        categoryId: optionalNumericIdFromBody,
        settings: courseSettingsSchema.optional(),
    }),
});

export const listCoursesSchema = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        search: z.string().optional(),
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
        categoryId: optionalPositiveBigInt,
        instructorId: optionalPositiveBigInt,
    }),
});

export const assignInstructorSchema = z.object({
    params: courseIdParamSchema.shape.params,
    body: z.object({
        userId: numericIdFromBody,
        isPrimary: z.boolean().optional(),
    }),
});

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(1, "Category name is required"),
        description: z.string().optional(),
    }),
});

export const removeInstructorParamSchema = courseUserParamsSchema;

export { courseIdParamSchema, courseUserParamsSchema };
