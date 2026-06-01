import { z } from "zod";
import {
    enrollmentIdParamSchema,
    numericIdFromBody,
    optionalPositiveBigInt,
} from "../../../utils/validationSchemas.js";
import { ENROLLMENT_STATUS } from "../enrollments.constants.js";

const enrollmentStatusEnum = z.enum([
    ENROLLMENT_STATUS.PENDING,
    ENROLLMENT_STATUS.APPROVED,
    ENROLLMENT_STATUS.REJECTED,
    ENROLLMENT_STATUS.WITHDRAWN,
]);

export const createEnrollmentSchema = z.object({
    body: z.object({
        courseId: numericIdFromBody,
    }),
});

export const listEnrollmentsSchema = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        status: enrollmentStatusEnum.optional(),
        courseId: optionalPositiveBigInt,
        studentId: optionalPositiveBigInt,
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
    }),
});

export { enrollmentIdParamSchema };
