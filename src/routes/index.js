import { Router } from 'express';
import authRoutes from '../modules/auth/routes/auth.routes.js';
import roleRoutes from '../modules/roles/routes/role.routes.js';
import permissionRoutes from '../modules/permissions/routes/permission.routes.js';
import userRoutes from '../modules/users/routes/user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/users', userRoutes);

export default router;
