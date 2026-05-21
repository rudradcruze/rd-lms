import { Router } from "express";
import { authenticate } from "../../../middlewares/authenticate.middleware.js";
import { authorize } from "../../../middlewares/authorize.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import PermissionController from "../controllers/permission.controller.js";
import {
    createPermissionSchema,
    updatePermissionSchema,
} from "../schemas/permission.schema.js";

const router = Router();

// All permission routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /permissions:
 *   post:
 *     summary: Create a new permission (super_admin only)
 *     tags: [Permissions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key, name, resource, action]
 *             properties:
 *               key:
 *                 type: string
 *                 pattern: '^[a-z_.]+$'
 *                 example: courses.create
 *               name:
 *                 type: string
 *                 example: Create Courses
 *               resource:
 *                 type: string
 *                 example: courses
 *               action:
 *                 type: string
 *                 example: create
 *               description:
 *                 type: string
 *                 example: Allows creating new courses in the LMS
 *     responses:
 *       201:
 *         description: Permission created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - Super Admin required
 */
router.post(
    "/",
    authorize(["super_admin"]),
    validate(createPermissionSchema),
    asyncHandler((req, res) => PermissionController.createPermission(req, res))
);

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: List all permissions (authenticated users)
 *     tags: [Permissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *     responses:
 *       200:
 *         description: Permissions list retrieved
 *       401:
 *         description: Unauthorized
 */
router.get(
    "/",
    asyncHandler((req, res) => PermissionController.getAllPermissions(req, res))
);

/**
 * @swagger
 * /permissions/{permissionId}:
 *   get:
 *     summary: Get a permission by ID or key (authenticated users)
 *     tags: [Permissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema: { type: string }
 *         description: Permission UUID or key (e.g. "courses.read")
 *     responses:
 *       200:
 *         description: Permission details retrieved
 *       404:
 *         description: Permission not found
 */
router.get(
    "/:permissionId",
    asyncHandler((req, res) => PermissionController.getPermissionById(req, res))
);

/**
 * @swagger
 * /permissions/{permissionId}:
 *   put:
 *     summary: Update permission details (super_admin only)
 *     tags: [Permissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema: { type: string }
 *         description: Permission UUID or key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: View and Browse Courses
 *               description:
 *                 type: string
 *                 example: Updated description for viewing and browsing courses
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *       403:
 *         description: Forbidden - Super Admin required
 *       404:
 *         description: Permission not found
 */
router.put(
    "/:permissionId",
    authorize(["super_admin"]),
    validate(updatePermissionSchema),
    asyncHandler((req, res) => PermissionController.updatePermission(req, res))
);

/**
 * @swagger
 * /permissions/{permissionId}:
 *   delete:
 *     summary: Delete a permission (super_admin only)
 *     tags: [Permissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema: { type: string }
 *         description: Permission UUID or key
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 *       403:
 *         description: Forbidden - Super Admin required
 *       404:
 *         description: Permission not found
 */
router.delete(
    "/:permissionId",
    authorize(["super_admin"]),
    asyncHandler((req, res) => PermissionController.deletePermission(req, res))
);

export default router;
