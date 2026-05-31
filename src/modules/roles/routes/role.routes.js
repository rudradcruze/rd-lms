import { Router } from "express";
import { authenticate } from "../../../middlewares/authenticate.middleware.js";
import { authorize } from "../../../middlewares/authorize.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import RoleController from "../controllers/role.controller.js";
import {
    assignPermissionSchema,
    createRoleSchema,
    updateRoleSchema,
} from "../schemas/role.schema.js";

const router = Router();

// All role routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a new role (super_admin only)
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleRequest'
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Role'
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
 *       409:
 *         description: Role key already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
    "/",
    authorize(["super_admin"]),
    validate(createRoleSchema),
    asyncHandler((req, res) => RoleController.createRole(req, res))
);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: List all roles (authenticated users)
 *     tags: [Roles]
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
 *         description: Roles list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RoleListData'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
    "/",
    asyncHandler((req, res) => RoleController.getAllRoles(req, res))
);

/**
 * @swagger
 * /roles/{roleId}:
 *   get:
 *     summary: Get a role by ID or key (authenticated users)
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string }
 *         description: Role UUID or key (e.g. "student")
 *     responses:
 *       200:
 *         description: Role details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Role'
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
    "/:roleId",
    asyncHandler((req, res) => RoleController.getRoleById(req, res))
);

/**
 * @swagger
 * /roles/{roleId}:
 *   put:
 *     summary: Update role details (super_admin only)
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string }
 *         description: Role UUID or key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Senior Content Manager
 *               description:
 *                 type: string
 *                 example: Oversees content management and approvals
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       403:
 *         description: Forbidden - Super Admin required
 *       404:
 *         description: Role not found
 */
router.put(
    "/:roleId",
    authorize(["super_admin"]),
    validate(updateRoleSchema),
    asyncHandler((req, res) => RoleController.updateRole(req, res))
);

/**
 * @swagger
 * /roles/{roleId}:
 *   delete:
 *     summary: Delete a role (super_admin only)
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string }
 *         description: Role UUID or key
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       403:
 *         description: Forbidden - Super Admin required
 *       404:
 *         description: Role not found
 */
router.delete(
    "/:roleId",
    authorize(["super_admin"]),
    asyncHandler((req, res) => RoleController.deleteRole(req, res))
);

/**
 * @swagger
 * /roles/{roleId}/permissions:
 *   post:
 *     summary: Assign a permission to a role (super_admin only)
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string }
 *         description: Role UUID or key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissionId]
 *             properties:
 *               permissionId:
 *                 type: string
 *                 description: Permission UUID or key (e.g. "courses.read")
 *                 example: courses.read
 *     responses:
 *       200:
 *         description: Permission assigned to role successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - Super Admin required
 *       404:
 *         description: Role or Permission not found
 */
router.post(
    "/:roleId/permissions",
    authorize(["super_admin"]),
    validate(assignPermissionSchema),
    asyncHandler((req, res) => RoleController.assignPermissionToRole(req, res))
);

/**
 * @swagger
 * /roles/{roleId}/permissions/{permissionId}:
 *   delete:
 *     summary: Revoke a permission from a role (super_admin only)
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string }
 *         description: Role UUID or key
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema: { type: string }
 *         description: Permission UUID or key
 *     responses:
 *       200:
 *         description: Permission revoked from role successfully
 *       403:
 *         description: Forbidden - Super Admin required
 *       404:
 *         description: Role or association not found
 */
router.delete(
    "/:roleId/permissions/:permissionId",
    authorize(["super_admin"]),
    asyncHandler((req, res) =>
        RoleController.revokePermissionFromRole(req, res)
    )
);

export default router;
