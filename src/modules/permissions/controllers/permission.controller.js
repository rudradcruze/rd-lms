import { ApiResponse } from "../../../utils/ApiResponse.js";
import { PERMISSION_MESSAGES } from "../permission.constants.js";
import PermissionService from "../services/permission.service.js";

class PermissionController {
    async createPermission(req, res) {
        const permission = await PermissionService.createPermission(req.body);
        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    permission,
                    PERMISSION_MESSAGES.PERMISSION_CREATED
                )
            );
    }

    async updatePermission(req, res) {
        const { permissionId } = req.params;
        const permission = await PermissionService.updatePermission(
            permissionId,
            req.body
        );
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    permission,
                    PERMISSION_MESSAGES.PERMISSION_UPDATED
                )
            );
    }

    async getPermissionById(req, res) {
        const { permissionId } = req.params;
        const permission =
            await PermissionService.getPermissionById(permissionId);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    permission,
                    "Permission retrieved successfully"
                )
            );
    }

    async getAllPermissions(req, res) {
        const { page = 1, limit = 100 } = req.query;
        const result = await PermissionService.getAllPermissions(
            parseInt(page),
            parseInt(limit)
        );
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    result,
                    "Permissions retrieved successfully"
                )
            );
    }

    async deletePermission(req, res) {
        const { permissionId } = req.params;
        await PermissionService.deletePermission(permissionId);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    null,
                    PERMISSION_MESSAGES.PERMISSION_DELETED
                )
            );
    }
}

export default new PermissionController();
