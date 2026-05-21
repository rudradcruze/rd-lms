import prisma from "../../../configurations/db.postgres.js";
import redisClient from "../../../configurations/db.redis.js";

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
        const superAdminRole = await prisma.role.findFirst({
            where: { key: "super_admin" },
        });

        if (superAdminRole) {
            const userHasSuperAdmin = await prisma.userRole.findFirst({
                where: { userId, roleId: superAdminRole.id },
            });

            if (userHasSuperAdmin) {
                // Super admin has all permissions
                const allPermissions = await prisma.permission.findMany({
                    select: {
                        id: true,
                        key: true,
                        name: true,
                        resource: true,
                        action: true,
                    },
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
                await redisClient.set(cacheKey, JSON.stringify(result), {
                    EX: 3600,
                });
                return result;
            }
        }

        // Get all user's roles
        const userRoles = await prisma.userRole.findMany({
            where: { userId },
            select: { roleId: true },
        });

        const roleIds = userRoles.map((ur) => ur.roleId);

        // Get role permissions
        const rolePerms = roleIds.length
            ? await prisma.rolePermission.findMany({
                  where: { roleId: { in: roleIds } },
                  select: { permissionId: true },
              })
            : [];

        const rolePermissionIds = new Set(
            rolePerms.map((rp) => rp.permissionId)
        );

        // Get user-specific permissions
        const userPerms = await prisma.userPermission.findMany({
            where: { userId },
            select: {
                permissionId: true,
                allowed: true,
            },
        });

        const deniedPermissionIds = new Set(
            userPerms.filter((up) => !up.allowed).map((up) => up.permissionId)
        );

        const allowedPermissionIds = new Set(
            userPerms.filter((up) => up.allowed).map((up) => up.permissionId)
        );

        // Get all permissions
        const allPermissions = await prisma.permission.findMany({
            select: {
                id: true,
                key: true,
                name: true,
                resource: true,
                action: true,
            },
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
        await redisClient.set(cacheKey, JSON.stringify(result), { EX: 3600 });
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
        return permissionKeys.some(
            (key) => resolved.permissionMap[key] || false
        );
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
        const usersWithRole = await prisma.userRole.findMany({
            where: { roleId },
            select: { userId: true },
        });

        if (usersWithRole.length === 0) return;

        const pipeline = redisClient.multi();
        for (const { userId } of usersWithRole) {
            pipeline.del(`user:${userId}:permissions`);
        }
        await pipeline.exec();
    }
}

export default new PermissionResolverService();
