import { Router } from "express";
import {
    authenticate,
    optionalAuthenticate,
} from "../../../middlewares/authenticate.middleware.js";
import { authorize } from "../../../middlewares/authorize.middleware.js";
import { permission } from "../../../middlewares/permission.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import CourseController from "../controllers/courses.controller.js";
import {
    assignInstructorSchema,
    courseIdParamSchema,
    createCategorySchema,
    createCourseSchema,
    listCoursesSchema,
    removeInstructorParamSchema,
    updateCourseSchema,
} from "../schemas/courses.schema.js";

const router = Router();

/**
 * @swagger
 * /courses/categories:
 *   get:
 *     summary: List all course categories
 *     tags: [Courses]
 *     security: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CategoryListData'
 */
router.get(
    "/categories",
    asyncHandler((req, res) => CourseController.listCategories(req, res)),
);

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: List courses with pagination and filters
 *     tags: [Courses]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, PUBLISHED, ARCHIVED] }
 *         description: Admins only when authenticated; public requests always receive published courses
 *       - in: query
 *         name: categoryId
 *         schema: { type: integer, format: int64, example: 1 }
 *       - in: query
 *         name: instructorId
 *         schema: { type: integer, format: int64, example: 1 }
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CourseListData'
 */
router.get(
    "/",
    optionalAuthenticate,
    validate(listCoursesSchema),
    asyncHandler((req, res) => CourseController.listCourses(req, res)),
);

/**
 * @swagger
 * /courses/{courseId}/instructors:
 *   get:
 *     summary: List instructors for a course
 *     tags: [Courses]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: integer, format: int64, example: 1 }
 *     responses:
 *       200:
 *         description: Instructors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/InstructorListData'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
    "/:courseId/instructors",
    optionalAuthenticate,
    validate(courseIdParamSchema),
    asyncHandler((req, res) => CourseController.getCourseInstructors(req, res)),
);

/**
 * @swagger
 * /courses/{courseId}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: integer, format: int64, example: 1 }
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
    "/:courseId",
    optionalAuthenticate,
    validate(courseIdParamSchema),
    asyncHandler((req, res) => CourseController.getCourseById(req, res)),
);

router.use(authenticate);

/**
 * @swagger
 * /courses/categories:
 *   post:
 *     summary: Create a course category (admin only)
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CourseCategory'
 *       403:
 *         description: Forbidden - Admin required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Category name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
    "/categories",
    authorize(["admin", "super_admin"]),
    validate(createCategorySchema),
    asyncHandler((req, res) => CourseController.createCategory(req, res)),
);

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new draft course
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCourseRequest'
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Slug already taken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
    "/",
    permission(["courses.create"]),
    validate(createCourseSchema),
    asyncHandler((req, res) => CourseController.createCourse(req, res)),
);

/**
 * @swagger
 * /courses/{courseId}:
 *   patch:
 *     summary: Update course details
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: integer, format: int64, example: 1 }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCourseRequest'
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
 *       403:
 *         description: Forbidden - not course owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Slug already taken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.patch(
    "/:courseId",
    permission(["courses.update"]),
    validate(updateCourseSchema),
    asyncHandler((req, res) => CourseController.updateCourse(req, res)),
);

/**
 * @swagger
 * /courses/{courseId}/publish:
 *   patch:
 *     summary: Publish a draft course
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: integer, format: int64, example: 1 }
 *     responses:
 *       200:
 *         description: Course published successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
 *       400:
 *         description: Missing publish requirements
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - not course owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.patch(
    "/:courseId/publish",
    permission(["courses.publish"]),
    validate(courseIdParamSchema),
    asyncHandler((req, res) => CourseController.publishCourse(req, res)),
);

/**
 * @swagger
 * /courses/{courseId}/archive:
 *   patch:
 *     summary: Archive a course (admin only)
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: integer, format: int64, example: 1 }
 *     responses:
 *       200:
 *         description: Course archived successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
 *       403:
 *         description: Forbidden - Admin required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.patch(
    "/:courseId/archive",
    permission(["courses.publish"]),
    validate(courseIdParamSchema),
    asyncHandler((req, res) => CourseController.archiveCourse(req, res)),
);

/**
 * @swagger
 * /courses/{courseId}:
 *   delete:
 *     summary: Soft delete a course (admin only)
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: integer, format: int64, example: 1 }
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Forbidden - Admin required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.delete(
    "/:courseId",
    permission(["courses.delete"]),
    validate(courseIdParamSchema),
    asyncHandler((req, res) => CourseController.deleteCourse(req, res)),
);

/**
 * @swagger
 * /courses/{courseId}/instructors:
 *   post:
 *     summary: Assign an instructor to a course (admin only)
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: integer, format: int64, example: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignInstructorRequest'
 *     responses:
 *       201:
 *         description: Instructor assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CourseInstructor'
 *       403:
 *         description: Forbidden - Admin required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Instructor already assigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
    "/:courseId/instructors",
    permission(["courses.update"]),
    validate(assignInstructorSchema),
    asyncHandler((req, res) => CourseController.assignInstructor(req, res)),
);

/**
 * @swagger
 * /courses/{courseId}/instructors/{userId}:
 *   delete:
 *     summary: Remove an instructor from a course (admin only)
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: integer, format: int64, example: 1 }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer, format: int64, example: 1 }
 *     responses:
 *       200:
 *         description: Instructor removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Forbidden - Admin required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Instructor assignment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.delete(
    "/:courseId/instructors/:userId",
    permission(["courses.update"]),
    validate(removeInstructorParamSchema),
    asyncHandler((req, res) => CourseController.removeInstructor(req, res)),
);

export default router;
