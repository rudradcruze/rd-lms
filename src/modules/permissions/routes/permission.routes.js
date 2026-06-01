import { Router } from "express";
import { authenticate } from "../../../middlewares/authenticate.middleware.js";
import { authorize } from "../../../middlewares/authorize.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import PermissionController from "../controllers/permission.controller.js";
import {
    createPermissionSchema,
    permissionIdParamSchema,
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
 *             $ref: '#/components/schemas/CreatePermissionRequest'
 *     responses:
 *       201:
 *         description: Permission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Permission'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Super Admin required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
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
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PermissionListData'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
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
 *         schema: { type: integer, format: int64, example: 1 }
 *         description: Numeric permission ID
 *     responses:
 *       200:
 *         description: Permission details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Permission'
 *       404:
 *         description: Permission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
    "/:permissionId",
    validate(permissionIdParamSchema),
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
 *         schema: { type: integer, format: int64, example: 1 }
 *         description: Numeric permission ID
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
 *         schema: { type: integer, format: int64, example: 1 }
 *         description: Numeric permission ID
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
    validate(permissionIdParamSchema),
    asyncHandler((req, res) => PermissionController.deletePermission(req, res))
);

export default router;
