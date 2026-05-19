import { Router } from 'express';
import AuthController from '../controllers/AuthController.js';
import validate from '../../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  changePasswordSchema,
} from '../schemas/auth.schema.js';
import { authenticate } from '../../../middlewares/authenticate.middleware.js';

const router = Router();

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler((req, res) => AuthController.register(req, res))
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler((req, res) => AuthController.login(req, res))
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler((req, res) => AuthController.refreshToken(req, res))
);

router.post(
  '/logout',
  authenticate,
  validate(logoutSchema),
  asyncHandler((req, res) => AuthController.logout(req, res))
);

router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler((req, res) => AuthController.changePassword(req, res))
);

export default router;
