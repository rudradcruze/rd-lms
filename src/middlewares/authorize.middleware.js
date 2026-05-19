import { ApiError } from '../utils/ApiError.js';
import Role from '../modules/roles/models/Role.js';
import UserRole from '../modules/users/models/UserRole.js';

/**
 * Check if user has required roles
 * Usage: authorize(['admin', 'super_admin'])(req, res, next)
 */
export const authorize = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        throw new ApiError(401, 'User not authenticated');
      }

      if (requiredRoles.length === 0) {
        return next();
      }

      // Get user's roles
      const roleRecords = await Role.findAll({
        attributes: ['key'],
        include: {
          model: UserRole,
          attributes: [],
          where: { userId: req.user.userId },
          required: true,
        },
        raw: true,
      });

      const userRoles = roleRecords.map((r) => r.key);

      // Check if user has any of the required roles
      const hasRequiredRole = requiredRoles.some((role) =>
        userRoles.includes(role)
      );

      if (!hasRequiredRole) {
        throw new ApiError(
          403,
          `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError(500, 'Authorization check failed'));
      }
    }
  };
};
