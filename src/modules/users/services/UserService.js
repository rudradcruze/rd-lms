import { ApiError } from "../../../utils/ApiError.js";
import PermissionRepository from "../../permissions/repositories/PermissionRepository.js";
import PermissionResolverService from "../../permissions/services/PermissionResolverService.js";
import RoleRepository from "../../roles/repositories/RoleRepository.js";
import UserRepository from "../repositories/UserRepository.js";
import { USER_MESSAGES } from "../user.constants.js";

class UserService {
    async getUserById(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }
        return user;
    }

    async getAllUsers(page = 1, limit = 10) {
        const { rows, count } = await UserRepository.findAll({
            limit,
            offset: (page - 1) * limit,
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

        const role = await RoleRepository.findById(roleId);
        if (!role) {
            throw new ApiError(404, "Role not found");
        }

        const already = await UserRepository.hasRole(userId, roleId);
        if (already) {
            throw new ApiError(400, "User already has this role");
        }

        await UserRepository.assignRole(userId, roleId);

        // Invalidate permission cache
        await PermissionResolverService.invalidateUserCache(userId);
    }

    async removeRoleFromUser(userId, roleId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }

        const role = await RoleRepository.findById(roleId);
        if (!role) {
            throw new ApiError(404, "Role not found");
        }

        const has = await UserRepository.hasRole(userId, roleId);
        if (!has) {
            throw new ApiError(400, "User does not have this role");
        }

        await UserRepository.removeRole(userId, roleId);

        // Invalidate permission cache
        await PermissionResolverService.invalidateUserCache(userId);
    }

    async grantPermissionToUser(userId, permissionId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }

        const permission = await PermissionRepository.findById(permissionId);
        if (!permission) {
            throw new ApiError(404, "Permission not found");
        }

        await UserRepository.grantPermission(userId, permissionId, true);

        // Invalidate permission cache
        await PermissionResolverService.invalidateUserCache(userId);
    }

    async revokePermissionFromUser(userId, permissionId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }

        const permission = await PermissionRepository.findById(permissionId);
        if (!permission) {
            throw new ApiError(404, "Permission not found");
        }

        await UserRepository.revokePermission(userId, permissionId);

        // Invalidate permission cache
        await PermissionResolverService.invalidateUserCache(userId);
    }

    async denyPermissionToUser(userId, permissionId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }

        const permission = await PermissionRepository.findById(permissionId);
        if (!permission) {
            throw new ApiError(404, "Permission not found");
        }

        await UserRepository.grantPermission(userId, permissionId, false);

        // Invalidate permission cache
        await PermissionResolverService.invalidateUserCache(userId);
    }

    async getUserPermissions(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, USER_MESSAGES.USER_NOT_FOUND);
        }

        const resolved =
            await PermissionResolverService.resolveUserPermissions(userId);
        return resolved;
    }
}

export default new UserService();
