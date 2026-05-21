import { Router } from "express";
import { authenticate } from "../../../middlewares/authenticate.middleware.js";
import { rateLimiter } from "../../../middlewares/rateLimit.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import AuthController from "../controllers/auth.controller.js";
import {
    changePasswordSchema,
    loginSchema,
    logoutSchema,
    refreshTokenSchema,
    registerSchema,
    checkAvailabilitySchema,
} from "../schemas/auth.schema.js";

const router = Router();

// Max 10 account registrations per 1 hour per IP
const registerLimiter = rateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message:
        "Too many account registrations from this IP. Please try again after an hour.",
});

// Max 20 login attempts per 15 minutes per IP
const loginLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many login attempts. Please try again after 15 minutes.",
});

// Max 30 password change requests per 15 minutes per IP
const passwordLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: "Too many password attempts. Please try again after 15 minutes.",
});

router.post(
    "/register",
    registerLimiter,
    validate(registerSchema),
    asyncHandler((req, res) => AuthController.register(req, res))
);

router.post(
    "/login",
    loginLimiter,
    validate(loginSchema),
    asyncHandler((req, res) => AuthController.login(req, res))
);

router.post(
    "/refresh",
    validate(refreshTokenSchema),
    asyncHandler((req, res) => AuthController.refreshToken(req, res))
);

router.post(
    "/access",
    validate(refreshTokenSchema),
    asyncHandler((req, res) => AuthController.getAccessToken(req, res))
);

router.post(
    "/logout",
    authenticate,
    validate(logoutSchema),
    asyncHandler((req, res) => AuthController.logout(req, res))
);

router.post(
    "/change-password",
    authenticate,
    passwordLimiter,
    validate(changePasswordSchema),
    asyncHandler((req, res) => AuthController.changePassword(req, res))
);

router.get(
    "/check-availability",
    validate(checkAvailabilitySchema),
    asyncHandler((req, res) => AuthController.checkAvailability(req, res))
);

export default router;
