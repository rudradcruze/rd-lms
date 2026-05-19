import redisClient from '../../../configurations/db.redis.js';
import Role from '../../roles/models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import UserPermission from '../models/UserPermission.js';
import UserRole from '../../users/models/UserRole.js';

class PermissionResolverService {
  /**
   * Resolve user permissions with priority:
   * 1. Super Admin -> all permissions allowed
   * 2. Direct Deny -> block access
   * 3. Direct Allow -> grant access
   * 4. Role Permissions -> check role permissions
   * Result cached in Redis
   */
  async resolveUserPermissions(userId) {
    // Check Redis cache first
    const cacheKey = `user:${userId}:permissions`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Step 1: Check if user is super_admin
    const superAdminRole = await Role.findOne({
      where: { key: 'super_admin' },
    });

    if (superAdminRole) {
      const userHasSuperAdmin = await UserRole.findOne({
        where: { userId, roleId: superAdminRole.id },
      });

      if (userHasSuperAdmin) {
        // Super admin has all permissions
        const allPermissions = await Permission.findAll({
          attributes: ['id', 'key', 'name', 'resource', 'action'],
          raw: true,
        });

        const result = {
          isSuperAdmin: true,
          permissions: allPermissions.map((p) => p.key),
          permissionMap: allPermissions.reduce((acc, p) => {
            acc[p.key] = true;
            return acc;
          }, {}),
        };

        // Cache for 1 hour
        await redisClient.setex(cacheKey, 3600, JSON.stringify(result));
        return result;
      }
    }

    // Get all user's roles
    const userRoles = await UserRole.findAll({
      where: { userId },
      attributes: ['roleId'],
      raw: true,
    });

    const roleIds = userRoles.map((ur) => ur.roleId);

    // Get role permissions
    const rolePerms = await RolePermission.findAll({
      where: { roleId: roleIds },
      attributes: ['permissionId'],
      raw: true,
    });

    const rolePermissionIds = new Set(rolePerms.map((rp) => rp.permissionId));

    // Get user-specific permissions
    const userPerms = await UserPermission.findAll({
      where: { userId },
      attributes: ['permissionId', 'allowed'],
      raw: true,
    });

    const deniedPermissionIds = new Set(
      userPerms.filter((up) => !up.allowed).map((up) => up.permissionId)
    );

    const allowedPermissionIds = new Set(
      userPerms.filter((up) => up.allowed).map((up) => up.permissionId)
    );

    // Get all permissions
    const allPermissions = await Permission.findAll({
      attributes: ['id', 'key', 'name', 'resource', 'action'],
      raw: true,
    });

    const permissionMap = {};
    const permissions = [];

    for (const perm of allPermissions) {
      let hasPermission = false;

      // Priority: Direct Deny > Direct Allow > Role Permissions
      if (deniedPermissionIds.has(perm.id)) {
        hasPermission = false;
      } else if (allowedPermissionIds.has(perm.id)) {
        hasPermission = true;
      } else if (rolePermissionIds.has(perm.id)) {
        hasPermission = true;
      }

      permissionMap[perm.key] = hasPermission;
      if (hasPermission) {
        permissions.push(perm.key);
      }
    }

    const result = {
      isSuperAdmin: false,
      permissions,
      permissionMap,
    };

    // Cache for 1 hour
    await redisClient.setex(cacheKey, 3600, JSON.stringify(result));
    return result;
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId, permissionKey) {
    const resolved = await this.resolveUserPermissions(userId);
    return resolved.permissionMap[permissionKey] || false;
  }

  /**
   * Check if user has all permissions in list
   */
  async hasAllPermissions(userId, permissionKeys) {
    const resolved = await this.resolveUserPermissions(userId);
    return permissionKeys.every(
      (key) => resolved.permissionMap[key] || false
    );
  }

  /**
   * Check if user has any permission in list
   */
  async hasAnyPermission(userId, permissionKeys) {
    const resolved = await this.resolveUserPermissions(userId);
    return permissionKeys.some((key) => resolved.permissionMap[key] || false);
  }

  /**
   * Invalidate permission cache (called on permission/role changes)
   */
  async invalidateUserCache(userId) {
    const cacheKey = `user:${userId}:permissions`;
    await redisClient.del(cacheKey);
  }

  /**
   * Invalidate cache for all users with a role
   */
  async invalidateRoleCache(roleId) {
    const usersWithRole = await UserRole.findAll({
      where: { roleId },
      attributes: ['userId'],
      raw: true,
    });

    for (const { userId } of usersWithRole) {
      await this.invalidateUserCache(userId);
    }
  }
}

export default new PermissionResolverService();
