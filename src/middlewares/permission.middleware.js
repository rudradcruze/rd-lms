import PermissionResolverService from "../modules/permissions/services/permissionResolver.service.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Check if user has required permissions
 * Usage: permission(['users.create', 'users.update'])(req, res, next)
 */
export const permission = (requiredPermissions = [], requireAll = true) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.userId) {
                throw new ApiError(401, "User not authenticated");
            }

            if (requiredPermissions.length === 0) {
                return next();
            }

            const hasRequiredPermissions = requireAll
                ? await PermissionResolverService.hasAllPermissions(
                      req.user.userId,
                      requiredPermissions
                  )
                : await PermissionResolverService.hasAnyPermission(
                      req.user.userId,
                      requiredPermissions
                  );

            if (!hasRequiredPermissions) {
                throw new ApiError(
                    403,
                    `Insufficient permissions. Required: ${requiredPermissions.join(", ")}`
                );
            }

            next();
        } catch (error) {
            if (error instanceof ApiError) {
                next(error);
            } else {
                next(new ApiError(500, "Permission check failed"));
            }
        }
    };
};
