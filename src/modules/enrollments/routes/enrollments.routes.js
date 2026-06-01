import { Router } from "express";
import { authenticate } from "../../../middlewares/authenticate.middleware.js";
import { permission } from "../../../middlewares/permission.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import EnrollmentController from "../controllers/enrollments.controller.js";
import {
    createEnrollmentSchema,
    enrollmentIdParamSchema,
    listEnrollmentsSchema,
} from "../schemas/enrollments.schema.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /enrollments:
 *   post:
 *     summary: Create a course enrollment (student self-enroll)
 *     tags: [Enrollments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEnrollmentRequest'
 *     responses:
 *       201:
 *         description: Enrollment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Course not available for enrollment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Student already enrolled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
    "/",
    permission(["enrollments.read"]),
    validate(createEnrollmentSchema),
    asyncHandler((req, res) => EnrollmentController.createEnrollment(req, res)),
);

/**
 * @swagger
 * /enrollments:
 *   get:
 *     summary: List enrollments (scoped by role)
 *     description: Students see own enrollments; instructors see enrollments for owned courses; admins see all.
 *     tags: [Enrollments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/EnrollmentStatus'
 *       - in: query
 *         name: courseId
 *         schema: { type: integer, format: int64, example: 1 }
 *       - in: query
 *         name: studentId
 *         schema: { type: integer, format: int64, example: 1 }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Enrollments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EnrollmentListData'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
    "/",
    permission(["enrollments.read"]),
    validate(listEnrollmentsSchema),
    asyncHandler((req, res) => EnrollmentController.listEnrollments(req, res)),
);

/**
 * @swagger
 * /enrollments/my:
 *   get:
 *     summary: Student enrollment dashboard (active enrollments)
 *     description: Returns PENDING and APPROVED enrollments for the authenticated student.
 *     tags: [Enrollments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Enrollments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EnrollmentListData'
 */
router.get(
    "/my",
    permission(["enrollments.read"]),
    validate(listEnrollmentsSchema),
    asyncHandler((req, res) => EnrollmentController.getMyEnrollments(req, res)),
);

/**
 * @swagger
 * /enrollments/history:
 *   get:
 *     summary: Student enrollment history
 *     description: Returns APPROVED, REJECTED, and WITHDRAWN enrollments for the authenticated student.
 *     tags: [Enrollments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Enrollments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EnrollmentListData'
 */
router.get(
    "/history",
    permission(["enrollments.read"]),
    validate(listEnrollmentsSchema),
    asyncHandler((req, res) =>
        EnrollmentController.getEnrollmentHistory(req, res),
    ),
);

/**
 * @swagger
 * /enrollments/{enrollmentId}:
 *   get:
 *     summary: Get enrollment details
 *     tags: [Enrollments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema: { type: integer, format: int64, example: 1 }
 *     responses:
 *       200:
 *         description: Enrollment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Enrollment'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Enrollment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
    "/:enrollmentId",
    permission(["enrollments.read"]),
    validate(enrollmentIdParamSchema),
    asyncHandler((req, res) =>
        EnrollmentController.getEnrollmentById(req, res),
    ),
);

/**
 * @swagger
 * /enrollments/{enrollmentId}/approve:
 *   patch:
 *     summary: Approve a pending enrollment
 *     description: Instructor (course owner) or admin may approve. Transitions PENDING to APPROVED.
 *     tags: [Enrollments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema: { type: integer, format: int64, example: 1 }
 *     responses:
 *       200:
 *         description: Enrollment approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Invalid status transition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Enrollment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.patch(
    "/:enrollmentId/approve",
    permission(["enrollments.manage"]),
    validate(enrollmentIdParamSchema),
    asyncHandler((req, res) =>
        EnrollmentController.approveEnrollment(req, res),
    ),
);

/**
 * @swagger
 * /enrollments/{enrollmentId}/reject:
 *   patch:
 *     summary: Reject a pending enrollment
 *     description: Instructor (course owner) or admin may reject. Transitions PENDING to REJECTED.
 *     tags: [Enrollments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema: { type: integer, format: int64, example: 1 }
 *     responses:
 *       200:
 *         description: Enrollment rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Invalid status transition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Enrollment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.patch(
    "/:enrollmentId/reject",
    permission(["enrollments.manage"]),
    validate(enrollmentIdParamSchema),
    asyncHandler((req, res) =>
        EnrollmentController.rejectEnrollment(req, res),
    ),
);

/**
 * @swagger
 * /enrollments/{enrollmentId}/withdraw:
 *   patch:
 *     summary: Withdraw from a course enrollment
 *     description: Student may withdraw own enrollment; admin may withdraw any. Transitions PENDING or APPROVED to WITHDRAWN.
 *     tags: [Enrollments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema: { type: integer, format: int64, example: 1 }
 *     responses:
 *       200:
 *         description: Enrollment withdrawn successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Invalid status transition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Enrollment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.patch(
    "/:enrollmentId/withdraw",
    permission(["enrollments.read"]),
    validate(enrollmentIdParamSchema),
    asyncHandler((req, res) =>
        EnrollmentController.withdrawEnrollment(req, res),
    ),
);

export default router;
