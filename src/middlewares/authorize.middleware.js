import UserRepository from "../modules/auth/repositories/UserRepository.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Check if user has required roles
 * Usage: authorize(['admin', 'super_admin'])(req, res, next)
 */
export const authorize = (requiredRoles = []) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.userId) {
                throw new ApiError(401, "User not authenticated");
            }

            if (requiredRoles.length === 0) {
                return next();
            }

            const user = await UserRepository.findById(req.user.userId);
            const userRoles =
                user?.userRoles?.map((userRole) => userRole.role.key) || [];

            // Check if user has any of the required roles
            const hasRequiredRole = requiredRoles.some((role) =>
                userRoles.includes(role)
            );

            if (!hasRequiredRole) {
                throw new ApiError(
                    403,
                    `Insufficient permissions. Required roles: ${requiredRoles.join(", ")}`
                );
            }

            next();
        } catch (error) {
            if (error instanceof ApiError) {
                next(error);
            } else {
                next(new ApiError(500, "Authorization check failed"));
            }
        }
    };
};
