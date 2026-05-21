import { ApiError } from "../../../utils/ApiError.js";
import redisClient from "../../../configurations/db.redis.js";
import logger from "../../../configurations/logger.js";
import PermissionRepository from "../../permissions/repositories/permission.repository.js";
import PermissionResolverService from "../../permissions/services/permissionResolver.service.js";
import RoleRepository from "../../roles/repositories/role.repository.js";
import UserRepository from "../repositories/user.repository.js";
import { USER_MESSAGES } from "../user.constants.js";
import { hashPassword } from "../../../utils/password.js";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve a role by UUID or key string
 */
async function resolveRole(roleId) {
    let role = null;
    if (UUID_REGEX.test(roleId)) {
        role = await RoleRepository.findById(roleId);
    }
    if (!role) {
        role = await RoleRepository.findByKey(roleId);
    }
    return role;
}

/**
 * Resolve a permission by UUID or key string
 */
async function resolvePermission(permissionId) {
    let permission = null;
    if (UUID_REGEX.test(permissionId)) {
        permission = await PermissionRepository.findById(permissionId);
    }
    if (!permission) {
        permission = await PermissionRepository.findByKey(permissionId);
    }
    return permission;
}

class UserService {
    async getUserById(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }
        return user;
    }

    async getAllUsers(page = 1, limit = 10, filters = {}) {
        const { rows, count } = await UserRepository.findAll({
            limit,
            offset: (page - 1) * limit,
            ...filters,
        });

        return {
            users: rows,
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        };
    }

    async assignRoleToUser(userId, roleId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }

        const role = await resolveRole(roleId);
        if (!role) {
            throw new ApiError(
                404,
                `Role not found. Provide a valid role UUID or key (e.g. "admin", "instructor", "student").`
            );
        }

        // super_admin cannot be assigned via the API — only seeded at system level
        if (role.key === "super_admin") {
            throw new ApiError(
                403,
                "The super_admin role cannot be assigned via the API. It is reserved for the system owner."
            );
        }

        const already = await UserRepository.hasRole(userId, role.id);
        if (already) {
            throw new ApiError(400, "User already has this role");
        }

        await UserRepository.assignRole(userId, role.id);

        // Invalidate permission cache
        await PermissionResolverService.invalidateUserCache(userId);
    }

    async removeRoleFromUser(userId, roleId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }

        const role = await resolveRole(roleId);
        if (!role) {
            throw new ApiError(404, USER_MESSAGES.ROLE_NOT_FOUND);
        }

        const has = await UserRepository.hasRole(userId, role.id);
        if (!has) {
            throw new ApiError(400, "User does not have this role");
        }

        await UserRepository.removeRole(userId, role.id);

        // Invalidate permission cache
        await PermissionResolverService.invalidateUserCache(userId);
    }

    async grantPermissionToUser(userId, permissionId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }

        const permission = await resolvePermission(permissionId);
        if (!permission) {
            throw new ApiError(404, USER_MESSAGES.PERMISSION_NOT_FOUND);
        }

        await UserRepository.grantPermission(userId, permission.id, true);

        // Invalidate permission cache
        await PermissionResolverService.invalidateUserCache(userId);
    }

    async revokePermissionFromUser(userId, permissionId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }

        const permission = await resolvePermission(permissionId);
        if (!permission) {
            throw new ApiError(404, USER_MESSAGES.PERMISSION_NOT_FOUND);
        }

        await UserRepository.revokePermission(userId, permission.id);

        // Invalidate permission cache
        await PermissionResolverService.invalidateUserCache(userId);
    }

    async denyPermissionToUser(userId, permissionId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }

        const permission = await resolvePermission(permissionId);
        if (!permission) {
            throw new ApiError(404, USER_MESSAGES.PERMISSION_NOT_FOUND);
        }

        await UserRepository.grantPermission(userId, permission.id, false);

        // Invalidate permission cache
        await PermissionResolverService.invalidateUserCache(userId);
    }

    async getUserPermissions(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }

        return PermissionResolverService.resolveUserPermissions(userId);
    }

    async blockUser(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }
        if (user.isBlocked) {
            throw new ApiError(400, "User is already blocked");
        }
        await UserRepository.blockUser(userId);
        // Invalidate cache so the blocked status takes effect immediately
        await PermissionResolverService.invalidateUserCache(userId);
    }

    async unblockUser(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }
        if (!user.isBlocked) {
            throw new ApiError(400, "User is not blocked");
        }
        await UserRepository.unblockUser(userId);
        await PermissionResolverService.invalidateUserCache(userId);
    }

    async activateUser(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }
        if (user.isActive) {
            throw new ApiError(400, "User account is already active");
        }
        await UserRepository.activateUser(userId);
        await PermissionResolverService.invalidateUserCache(userId);
    }

    async deactivateUser(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }
        if (!user.isActive) {
            throw new ApiError(400, "User account is already inactive");
        }
        await UserRepository.deactivateUser(userId);
        await PermissionResolverService.invalidateUserCache(userId);
    }

    async onboardUser(onboardData) {
        const { username, email, pass, firstname, lastname, role: roleIdOrKey } = onboardData;

        const existingUserByEmail = await UserRepository.findByEmail(email);
        if (existingUserByEmail) {
            throw new ApiError(409, "Email is already registered");
        }

        const existingUserByUsername = await UserRepository.findByUsername(username);
        if (existingUserByUsername) {
            throw new ApiError(409, "Username is already taken");
        }

        const role = await resolveRole(roleIdOrKey);
        if (!role) {
            throw new ApiError(
                404,
                `Role not found. Provide a valid role UUID or key (e.g. "admin", "instructor", "student").`
            );
        }

        if (role.key === "super_admin") {
            throw new ApiError(
                403,
                "The super_admin role cannot be assigned via the API. It is reserved for the system owner."
            );
        }

        const passwordHash = await hashPassword(pass);

        const user = await UserRepository.createWithRole({
            username,
            email,
            passwordHash,
            firstName: firstname,
            lastName: lastname,
        }, role.id);

        try {
            await redisClient.set(`username:${username}`, "1");
            await redisClient.set(`email:${email.toLowerCase()}`, "1");
        } catch (error) {
            logger.warn(`Redis caching of onboarded user credentials failed: ${error.message}`);
        }

        return user;
    }
}

export default new UserService();
