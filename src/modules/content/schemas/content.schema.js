import { z } from "zod";
import {
    positiveBigIntParam,
    numericIdFromBody,
} from "../../../utils/validationSchemas.js";

// Params schemas
export const sectionIdParamSchema = z.object({
    params: z.object({
        sectionId: positiveBigIntParam,
    }),
});

export const contentIdParamSchema = z.object({
    params: z.object({
        contentId: positiveBigIntParam,
    }),
});

// Section validations
export const createSectionSchema = z.object({
    body: z.object({
        courseId: numericIdFromBody,
        title: z.string().min(1, "Title is required").max(200),
        description: z.string().max(1000).optional(),
        position: z.number().int().nonnegative().optional(),
    }),
});

export const updateSectionSchema = z.object({
    params: z.object({
        sectionId: positiveBigIntParam,
    }),
    body: z.object({
        title: z.string().min(1, "Title must not be empty").max(200).optional(),
        description: z.string().max(1000).optional(),
        position: z.number().int().nonnegative().optional(),
    }),
});

export const reorderSectionSchema = z.object({
    params: z.object({
        sectionId: positiveBigIntParam,
    }),
    body: z.object({
        position: z.number().int().nonnegative(),
    }),
});

// Content validations
export const createContentSchema = z.object({
    body: z.object({
        sectionId: numericIdFromBody,
        title: z.string().min(1, "Title is required").max(200),
        description: z.string().max(10000).optional(),
        contentType: z.enum(["VIDEO", "PDF", "NOTE", "IMAGE", "AUDIO", "EXTERNAL_LINK"]),
        position: z.number().int().nonnegative().optional(),
        asset: z.object({
            provider: z.string(),
            publicId: z.string().optional().nullable(),
            secureUrl: z.string(),
            originalFileName: z.string().optional().nullable(),
            mimeType: z.string().optional().nullable(),
            sizeBytes: z.union([
                z.number().int().nonnegative(),
                z.string().regex(/^\d+$/).transform((v) => BigInt(v)),
                z.bigint()
            ]).optional().nullable(),
            durationSeconds: z.number().int().nonnegative().optional().nullable(),
        }).optional().nullable(),
    }),
});

export const updateContentSchema = z.object({
    params: z.object({
        contentId: positiveBigIntParam,
    }),
    body: z.object({
        title: z.string().min(1, "Title must not be empty").max(200).optional(),
        description: z.string().max(10000).optional(),
        contentType: z.enum(["VIDEO", "PDF", "NOTE", "IMAGE", "AUDIO", "EXTERNAL_LINK"]).optional(),
        position: z.number().int().nonnegative().optional(),
        asset: z.object({
            provider: z.string(),
            publicId: z.string().optional().nullable(),
            secureUrl: z.string(),
            originalFileName: z.string().optional().nullable(),
            mimeType: z.string().optional().nullable(),
            sizeBytes: z.union([
                z.number().int().nonnegative(),
                z.string().regex(/^\d+$/).transform((v) => BigInt(v)),
                z.bigint()
            ]).optional().nullable(),
            durationSeconds: z.number().int().nonnegative().optional().nullable(),
        }).optional().nullable(),
    }),
});

export const reorderContentsSchema = z.object({
    body: z.object({
        sectionId: numericIdFromBody,
        contentIds: z.array(numericIdFromBody).min(1, "At least one content ID is required"),
    }),
});

export const uploadContentSchema = z.object({
    body: z.object({
        sectionId: numericIdFromBody,
        title: z.string().min(1, "Title is required").max(200),
        contentType: z.enum(["VIDEO", "PDF", "IMAGE", "AUDIO"]),
        description: z.string().max(10000).optional(),
    }),
});

