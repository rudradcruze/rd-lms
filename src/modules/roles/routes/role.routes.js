import { Router } from 'express';
import RoleController from '../controllers/RoleController.js';
import { authenticate } from '../../../middlewares/authenticate.middleware.js';
import { authorize } from '../../../middlewares/authorize.middleware.js';
import validate from '../../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionSchema,
} from '../schemas/role.schema.js';

const router = Router();

// All role routes require authentication
router.use(authenticate);

router.post(
  '/',
  authorize(['super_admin']),
  validate(createRoleSchema),
  asyncHandler((req, res) => RoleController.createRole(req, res))
);

router.get(
  '/',
  asyncHandler((req, res) => RoleController.getAllRoles(req, res))
);

router.get(
  '/:roleId',
  asyncHandler((req, res) => RoleController.getRoleById(req, res))
);

router.put(
  '/:roleId',
  authorize(['super_admin']),
  validate(updateRoleSchema),
  asyncHandler((req, res) => RoleController.updateRole(req, res))
);

router.delete(
  '/:roleId',
  authorize(['super_admin']),
  asyncHandler((req, res) => RoleController.deleteRole(req, res))
);

router.post(
  '/:roleId/permissions',
  authorize(['super_admin']),
  validate(assignPermissionSchema),
  asyncHandler((req, res) => RoleController.assignPermissionToRole(req, res))
);

router.delete(
  '/:roleId/permissions/:permissionId',
  authorize(['super_admin']),
  asyncHandler((req, res) => RoleController.revokePermissionFromRole(req, res))
);

export default router;
