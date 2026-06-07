import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../../middlewares/authenticate.middleware.js";
import { permission } from "../../../middlewares/permission.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import ContentController from "../controllers/content.controller.js";
import {
    contentIdParamSchema,
    createContentSchema,
    createSectionSchema,
    reorderContentsSchema,
    reorderSectionSchema,
    sectionIdParamSchema,
    updateContentSchema,
    updateSectionSchema,
    uploadContentSchema,
} from "../schemas/content.schema.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Authenticate all routes
router.use(authenticate);

// ─── Sections ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /content/sections:
 *   post:
 *     summary: Create a new section in a course
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSectionRequest'
 *     responses:
 *       201:
 *         description: Section created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CourseSection'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course not found
 */
router.post(
    "/sections",
    permission(["content.create"]),
    validate(createSectionSchema),
    asyncHandler((req, res) => ContentController.createSection(req, res))
);

/**
 * @swagger
 * /content/sections/{sectionId}:
 *   get:
 *     summary: Get section by ID
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Section retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CourseSection'
 *       403:
 *         description: Forbidden - Not enrolled or course/section draft
 *       404:
 *         description: Section not found
 */
router.get(
    "/sections/:sectionId",
    permission(["content.read"]),
    validate(sectionIdParamSchema),
    asyncHandler((req, res) => ContentController.getSectionById(req, res))
);

/**
 * @swagger
 * /content/sections/{sectionId}:
 *   patch:
 *     summary: Update section details
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSectionRequest'
 *     responses:
 *       200:
 *         description: Section updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CourseSection'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Section not found
 */
router.patch(
    "/sections/:sectionId",
    permission(["content.update"]),
    validate(updateSectionSchema),
    asyncHandler((req, res) => ContentController.updateSection(req, res))
);

/**
 * @swagger
 * /content/sections/{sectionId}:
 *   delete:
 *     summary: Delete a section
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Section deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Section not found
 */
router.delete(
    "/sections/:sectionId",
    permission(["content.delete"]),
    validate(sectionIdParamSchema),
    asyncHandler((req, res) => ContentController.deleteSection(req, res))
);

/**
 * @swagger
 * /content/sections/{sectionId}/reorder:
 *   patch:
 *     summary: Reorder section position within a course
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [position]
 *             properties:
 *               position:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Section reordered successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Section not found
 */
router.patch(
    "/sections/:sectionId/reorder",
    permission(["content.update"]),
    validate(reorderSectionSchema),
    asyncHandler((req, res) => ContentController.reorderSection(req, res))
);

/**
 * @swagger
 * /content/sections/{sectionId}/publish:
 *   patch:
 *     summary: Publish or unpublish a section
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPublished:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Section published status updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Section not found
 */
router.patch(
    "/sections/:sectionId/publish",
    permission(["content.publish"]),
    validate(sectionIdParamSchema),
    asyncHandler((req, res) => ContentController.publishSection(req, res))
);

// ─── Contents ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /content/contents:
 *   post:
 *     summary: Create new content inside a section
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContentRequest'
 *     responses:
 *       201:
 *         description: Content created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CourseContent'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Section not found
 */
router.post(
    "/contents",
    permission(["content.create"]),
    validate(createContentSchema),
    asyncHandler((req, res) => ContentController.createContent(req, res))
);

/**
 * @swagger
 * /content/contents/upload:
 *   post:
 *     summary: Upload media file and create content item automatically
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, sectionId, title, contentType]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               sectionId:
 *                 type: string
 *                 description: The section ID to add content to
 *               title:
 *                 type: string
 *                 description: Title of the content
 *               contentType:
 *                 type: string
 *                 enum: [VIDEO, PDF, IMAGE, AUDIO]
 *                 description: Type of content and file upload
 *               description:
 *                 type: string
 *                 description: Optional description of the content
 *     responses:
 *       201:
 *         description: Content item created and file uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CourseContent'
 *       400:
 *         description: Bad Request (missing file or invalid type)
 *       403:
 *         description: Forbidden (not enrolled or course draft)
 *       404:
 *         description: Section not found
 */
router.post(
    "/contents/upload",
    permission(["content.create"]),
    upload.single("file"),
    validate(uploadContentSchema),
    asyncHandler((req, res) => ContentController.uploadContent(req, res))
);

/**
 * @swagger
 * /content/contents/reorder:
 *   patch:
 *     summary: Reorder multiple contents within a section
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReorderContentsRequest'
 *     responses:
 *       200:
 *         description: Contents reordered successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Section not found
 */
router.patch(
    "/contents/reorder",
    permission(["content.update"]),
    validate(reorderContentsSchema),
    asyncHandler((req, res) => ContentController.reorderContents(req, res))
);

/**
 * @swagger
 * /content/contents/{contentId}:
 *   get:
 *     summary: Get content details by ID
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Content retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CourseContent'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Content not found
 */
router.get(
    "/contents/:contentId",
    permission(["content.read"]),
    validate(contentIdParamSchema),
    asyncHandler((req, res) => ContentController.getContentById(req, res))
);

/**
 * @swagger
 * /content/contents/{contentId}:
 *   patch:
 *     summary: Update content details
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateContentRequest'
 *     responses:
 *       200:
 *         description: Content updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CourseContent'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Content not found
 */
router.patch(
    "/contents/:contentId",
    permission(["content.update"]),
    validate(updateContentSchema),
    asyncHandler((req, res) => ContentController.updateContent(req, res))
);

/**
 * @swagger
 * /content/contents/{contentId}:
 *   delete:
 *     summary: Delete content
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Content deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Content not found
 */
router.delete(
    "/contents/:contentId",
    permission(["content.delete"]),
    validate(contentIdParamSchema),
    asyncHandler((req, res) => ContentController.deleteContent(req, res))
);

/**
 * @swagger
 * /content/contents/{contentId}/publish:
 *   patch:
 *     summary: Publish or unpublish content
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPublished:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Content published status updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Content not found
 */
router.patch(
    "/contents/:contentId/publish",
    permission(["content.publish"]),
    validate(contentIdParamSchema),
    asyncHandler((req, res) => ContentController.publishContent(req, res))
);

// ─── Uploads ─────────────────────────────────────────────────────────────

export default router;

