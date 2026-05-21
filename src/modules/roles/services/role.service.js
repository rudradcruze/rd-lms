import { ApiError } from "../../../utils/ApiError.js";
import PermissionRepository from "../../permissions/repositories/permission.repository.js";
import PermissionResolverService from "../../permissions/services/permissionResolver.service.js";
import RoleRepository from "../repositories/role.repository.js";
import { PREDEFINED_ROLES, ROLE_MESSAGES } from "../role.constants.js";

class RoleService {
    async createRole(roleData) {
        const { key, name, description } = roleData;

        // Check if key already exists
        const existing = await RoleRepository.findByKey(key);
        if (existing) {
            throw new ApiError(409, "Role with this key already exists");
        }

        const role = await RoleRepository.create({
            key,
            name,
            description,
        });

        return role;
    }

    async updateRole(roleId, roleData) {
        const role = await RoleRepository.findById(roleId);
        if (!role) {
            throw new ApiError(404, ROLE_MESSAGES.ROLE_NOT_FOUND);
        }

        return RoleRepository.update(roleId, roleData);
    }

    async getRoleById(roleId) {
        const role = await RoleRepository.findById(roleId);
        if (!role) {
            throw new ApiError(404, ROLE_MESSAGES.ROLE_NOT_FOUND);
        }
        return role;
    }

    async getAllRoles(page = 1, limit = 10) {
        const { rows, count } = await RoleRepository.findAll({
            limit,
            offset: (page - 1) * limit,
        });

        return {
            roles: rows,
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        };
    }

    async deleteRole(roleId) {
        const role = await RoleRepository.findById(roleId);
        if (!role) {
            throw new ApiError(404, ROLE_MESSAGES.ROLE_NOT_FOUND);
        }

        // Prevent deletion of predefined roles
        const predefinedKeys = Object.values(PREDEFINED_ROLES).map(
            (r) => r.key
        );
        if (predefinedKeys.includes(role.key)) {
            throw new ApiError(400, "Cannot delete predefined roles");
        }

        await RoleRepository.delete(roleId);
    }

    async assignPermissionToRole(roleId, permissionId) {
        const role = await RoleRepository.findById(roleId);
        if (!role) {
            throw new ApiError(404, ROLE_MESSAGES.ROLE_NOT_FOUND);
        }

        const permission = await PermissionRepository.findById(permissionId);
        if (!permission) {
            throw new ApiError(404, "Permission not found");
        }

        const already = await RoleRepository.hasPermission(
            roleId,
            permissionId
        );
        if (already) {
            throw new ApiError(400, "Permission already assigned to this role");
        }

        await RoleRepository.assignPermission(roleId, permissionId);

        // Invalidate permission cache for all users with this role
        await PermissionResolverService.invalidateRoleCache(roleId);
    }

    async revokePermissionFromRole(roleId, permissionId) {
        const role = await RoleRepository.findById(roleId);
        if (!role) {
            throw new ApiError(404, ROLE_MESSAGES.ROLE_NOT_FOUND);
        }

        const permission = await PermissionRepository.findById(permissionId);
        if (!permission) {
            throw new ApiError(404, "Permission not found");
        }

        const has = await RoleRepository.hasPermission(roleId, permissionId);
        if (!has) {
            throw new ApiError(400, "Permission not assigned to this role");
        }

        await RoleRepository.revokePermission(roleId, permissionId);

        // Invalidate permission cache
        await PermissionResolverService.invalidateRoleCache(roleId);
    }
}

export default new RoleService();
