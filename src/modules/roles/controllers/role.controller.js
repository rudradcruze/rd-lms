import { ApiResponse } from "../../../utils/ApiResponse.js";
import { ROLE_MESSAGES } from "../role.constants.js";
import RoleService from "../services/role.service.js";

class RoleController {
    async createRole(req, res) {
        const role = await RoleService.createRole(req.body);
        return res
            .status(201)
            .json(new ApiResponse(201, role, ROLE_MESSAGES.ROLE_CREATED));
    }

    async updateRole(req, res) {
        const { roleId } = req.params;
        const role = await RoleService.updateRole(roleId, req.body);
        return res
            .status(200)
            .json(new ApiResponse(200, role, ROLE_MESSAGES.ROLE_UPDATED));
    }

    async getRoleById(req, res) {
        const { roleId } = req.params;
        const role = await RoleService.getRoleById(roleId);
        return res
            .status(200)
            .json(new ApiResponse(200, role, "Role retrieved successfully"));
    }

    async getAllRoles(req, res) {
        const { page = 1, limit = 10 } = req.query;
        const result = await RoleService.getAllRoles(
            parseInt(page),
            parseInt(limit)
        );
        return res
            .status(200)
            .json(new ApiResponse(200, result, "Roles retrieved successfully"));
    }

    async deleteRole(req, res) {
        const { roleId } = req.params;
        await RoleService.deleteRole(roleId);
        return res
            .status(200)
            .json(new ApiResponse(200, null, ROLE_MESSAGES.ROLE_DELETED));
    }

    async assignPermissionToRole(req, res) {
        const { roleId } = req.params;
        await RoleService.assignPermissionToRole(roleId, req.body.permissionId);
        return res
            .status(200)
            .json(
                new ApiResponse(200, null, ROLE_MESSAGES.PERMISSION_ASSIGNED)
            );
    }

    async revokePermissionFromRole(req, res) {
        const { roleId, permissionId } = req.params;
        await RoleService.revokePermissionFromRole(roleId, permissionId);
        return res
            .status(200)
            .json(new ApiResponse(200, null, ROLE_MESSAGES.PERMISSION_REVOKED));
    }
}

export default new RoleController();
