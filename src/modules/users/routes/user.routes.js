import { Router } from 'express';
import UserController from '../controllers/UserController.js';
import { authenticate } from '../../../middlewares/authenticate.middleware.js';
import { authorize } from '../../../middlewares/authorize.middleware.js';
import validate from '../../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import {
  assignRoleSchema,
  grantPermissionSchema,
} from '../schemas/user.schema.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get(
  '/',
  asyncHandler((req, res) => UserController.getAllUsers(req, res))
);

router.get(
  '/:userId',
  asyncHandler((req, res) => UserController.getUserById(req, res))
);

router.post(
  '/:userId/roles',
  authorize(['super_admin']),
  validate(assignRoleSchema),
  asyncHandler((req, res) => UserController.assignRoleToUser(req, res))
);

router.delete(
  '/:userId/roles/:roleId',
  authorize(['super_admin']),
  asyncHandler((req, res) => UserController.removeRoleFromUser(req, res))
);

router.post(
  '/:userId/permissions',
  authorize(['super_admin']),
  validate(grantPermissionSchema),
  asyncHandler((req, res) => UserController.grantPermissionToUser(req, res))
);

router.post(
  '/:userId/permissions/:permissionId/deny',
  authorize(['super_admin']),
  asyncHandler((req, res) => UserController.denyPermissionToUser(req, res))
);

router.delete(
  '/:userId/permissions/:permissionId',
  authorize(['super_admin']),
  asyncHandler((req, res) => UserController.revokePermissionFromUser(req, res))
);

router.get(
  '/:userId/permissions',
  asyncHandler((req, res) => UserController.getUserPermissions(req, res))
);

export default router;
