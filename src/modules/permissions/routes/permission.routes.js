import { Router } from 'express';
import PermissionController from '../controllers/PermissionController.js';
import { authenticate } from '../../../middlewares/authenticate.middleware.js';
import { authorize } from '../../../middlewares/authorize.middleware.js';
import validate from '../../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import {
  createPermissionSchema,
  updatePermissionSchema,
} from '../schemas/permission.schema.js';

const router = Router();

// All permission routes require authentication
router.use(authenticate);

router.post(
  '/',
  authorize(['super_admin']),
  validate(createPermissionSchema),
  asyncHandler((req, res) => PermissionController.createPermission(req, res))
);

router.get(
  '/',
  asyncHandler((req, res) => PermissionController.getAllPermissions(req, res))
);

router.get(
  '/:permissionId',
  asyncHandler((req, res) => PermissionController.getPermissionById(req, res))
);

router.put(
  '/:permissionId',
  authorize(['super_admin']),
  validate(updatePermissionSchema),
  asyncHandler((req, res) => PermissionController.updatePermission(req, res))
);

router.delete(
  '/:permissionId',
  authorize(['super_admin']),
  asyncHandler((req, res) => PermissionController.deletePermission(req, res))
);

export default router;
