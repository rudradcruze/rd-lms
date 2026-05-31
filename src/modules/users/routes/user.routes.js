import { Router } from "express";
import { authenticate } from "../../../middlewares/authenticate.middleware.js";
import { authorize } from "../../../middlewares/authorize.middleware.js";
import { permission } from "../../../middlewares/permission.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import UserController from "../controllers/user.controller.js";
import {
    assignRoleSchema,
    grantPermissionSchema,
    onboardUserSchema,
} from "../schemas/user.schema.js";


const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users (admin/super_admin only)
 *     tags: [Users]
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
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: isBlocked
 *         schema: { type: boolean }
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *         description: Filter by role key (e.g. "student", "instructor")
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserListData'
 */
router.get(
    "/",
    authorize(["admin", "super_admin"]),
    asyncHandler((req, res) => UserController.getAllUsers(req, res))
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Onboard a user (requires users.create permission)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OnboardUserRequest'
 *     responses:
 *       201:
 *         description: User onboarded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden (insufficient permissions, or attempting to onboard super_admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Conflict (username or email already registered)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
    "/",
    permission(["users.create"]),
    validate(onboardUserSchema),
    asyncHandler((req, res) => UserController.onboardUser(req, res))
);


/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get a user by ID (admin/super_admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
    "/:userId",
    authorize(["admin", "super_admin"]),
    asyncHandler((req, res) => UserController.getUserById(req, res))
);

/**
 * @swagger
 * /users/{userId}/block:
 *   patch:
 *     summary: Block a user (admin/super_admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: User UUID
 */
router.patch(
    "/:userId/block",
    authorize(["admin", "super_admin"]),
    asyncHandler((req, res) => UserController.blockUser(req, res))
);

/**
 * @swagger
 * /users/{userId}/unblock:
 *   patch:
 *     summary: Unblock a user (admin/super_admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: User UUID
 */
router.patch(
    "/:userId/unblock",
    authorize(["admin", "super_admin"]),
    asyncHandler((req, res) => UserController.unblockUser(req, res))
);

/**
 * @swagger
 * /users/{userId}/activate:
 *   patch:
 *     summary: Activate a user account (admin/super_admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: User UUID
 */
router.patch(
    "/:userId/activate",
    authorize(["admin", "super_admin"]),
    asyncHandler((req, res) => UserController.activateUser(req, res))
);

/**
 * @swagger
 * /users/{userId}/deactivate:
 *   patch:
 *     summary: Deactivate a user account (admin/super_admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: User UUID
 */
router.patch(
    "/:userId/deactivate",
    authorize(["admin", "super_admin"]),
    asyncHandler((req, res) => UserController.deactivateUser(req, res))
);

/**
 * @swagger
 * /users/{userId}/roles:
 *   post:
 *     summary: Assign a role to a user (super_admin only; cannot assign super_admin role)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: User UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleId]
 *             properties:
 *               roleId:
 *                 type: string
 *                 description: Role UUID or key (e.g. "admin", "instructor", "student")
 */
router.post(
    "/:userId/roles",
    authorize(["super_admin"]),
    validate(assignRoleSchema),
    asyncHandler((req, res) => UserController.assignRoleToUser(req, res))
);

/**
 * @swagger
 * /users/{userId}/roles/{roleId}:
 *   delete:
 *     summary: Remove a role from a user (super_admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: User UUID
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string }
 *         description: Role UUID or key
 */
router.delete(
    "/:userId/roles/:roleId",
    authorize(["super_admin"]),
    asyncHandler((req, res) => UserController.removeRoleFromUser(req, res))
);

/**
 * @swagger
 * /users/{userId}/permissions:
 *   post:
 *     summary: Grant a permission override to a user (super_admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: User UUID
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
 *                 description: Permission UUID or key
 */
router.post(
    "/:userId/permissions",
    authorize(["super_admin"]),
    validate(grantPermissionSchema),
    asyncHandler((req, res) => UserController.grantPermissionToUser(req, res))
);

/**
 * @swagger
 * /users/{userId}/permissions/{permissionId}/deny:
 *   post:
 *     summary: Explicitly deny a permission for a user (super_admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: User UUID
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema: { type: string }
 *         description: Permission UUID or key
 */
router.post(
    "/:userId/permissions/:permissionId/deny",
    authorize(["super_admin"]),
    asyncHandler((req, res) => UserController.denyPermissionToUser(req, res))
);

/**
 * @swagger
 * /users/{userId}/permissions/{permissionId}:
 *   delete:
 *     summary: Remove a permission override from a user (super_admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: User UUID
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema: { type: string }
 *         description: Permission UUID or key
 */
router.delete(
    "/:userId/permissions/:permissionId",
    authorize(["super_admin"]),
    asyncHandler((req, res) =>
        UserController.revokePermissionFromUser(req, res)
    )
);

/**
 * @swagger
 * /users/{userId}/permissions:
 *   get:
 *     summary: Get resolved permissions for a user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: User UUID
 *     responses:
 *       200:
 *         description: Resolved permissions retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ResolvedPermissions'
 */
router.get(
    "/:userId/permissions",
    authorize(["admin", "super_admin"]),
    asyncHandler((req, res) => UserController.getUserPermissions(req, res))
);

export default router;
