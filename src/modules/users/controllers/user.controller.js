import { ApiResponse } from "../../../utils/ApiResponse.js";
import UserService from "../services/user.service.js";
import { USER_MESSAGES } from "../user.constants.js";

class UserController {
    async getUserById(req, res) {
        const { userId } = req.params;
        const user = await UserService.getUserById(userId);
        return res
            .status(200)
            .json(new ApiResponse(200, user, "User retrieved successfully"));
    }

    async getAllUsers(req, res) {
        const { page = 1, limit = 10, isActive, isBlocked, role } = req.query;

        const filters = {};
        if (isActive !== undefined) filters.isActive = isActive === "true";
        if (isBlocked !== undefined) filters.isBlocked = isBlocked === "true";
        if (role) filters.roleKey = role;

        const result = await UserService.getAllUsers(
            parseInt(page),
            parseInt(limit),
            filters
        );
        return res
            .status(200)
            .json(new ApiResponse(200, result, "Users retrieved successfully"));
    }

    async assignRoleToUser(req, res) {
        const { userId } = req.params;
        const { roleId } = req.body;
        await UserService.assignRoleToUser(userId, roleId);
        return res
            .status(200)
            .json(new ApiResponse(200, null, USER_MESSAGES.ROLE_ASSIGNED));
    }

    async removeRoleFromUser(req, res) {
        const { userId, roleId } = req.params;
        await UserService.removeRoleFromUser(userId, roleId);
        return res
            .status(200)
            .json(new ApiResponse(200, null, USER_MESSAGES.ROLE_REMOVED));
    }

    async grantPermissionToUser(req, res) {
        const { userId } = req.params;
        const { permissionId } = req.body;
        await UserService.grantPermissionToUser(userId, permissionId);
        return res
            .status(200)
            .json(
                new ApiResponse(200, null, USER_MESSAGES.PERMISSION_GRANTED)
            );
    }

    async denyPermissionToUser(req, res) {
        const { userId, permissionId } = req.params;
        await UserService.denyPermissionToUser(userId, permissionId);
        return res
            .status(200)
            .json(new ApiResponse(200, null, USER_MESSAGES.PERMISSION_DENIED));
    }

    async revokePermissionFromUser(req, res) {
        const { userId, permissionId } = req.params;
        await UserService.revokePermissionFromUser(userId, permissionId);
        return res
            .status(200)
            .json(
                new ApiResponse(200, null, USER_MESSAGES.PERMISSION_REVOKED)
            );
    }

    async getUserPermissions(req, res) {
        const { userId } = req.params;
        const permissions = await UserService.getUserPermissions(userId);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    permissions,
                    "User permissions retrieved successfully"
                )
            );
    }

    async blockUser(req, res) {
        const { userId } = req.params;
        await UserService.blockUser(userId);
        return res
            .status(200)
            .json(new ApiResponse(200, null, USER_MESSAGES.USER_BLOCKED));
    }

    async unblockUser(req, res) {
        const { userId } = req.params;
        await UserService.unblockUser(userId);
        return res
            .status(200)
            .json(new ApiResponse(200, null, USER_MESSAGES.USER_UNBLOCKED));
    }

    async activateUser(req, res) {
        const { userId } = req.params;
        await UserService.activateUser(userId);
        return res
            .status(200)
            .json(new ApiResponse(200, null, USER_MESSAGES.USER_ACTIVATED));
    }

    async deactivateUser(req, res) {
        const { userId } = req.params;
        await UserService.deactivateUser(userId);
        return res
            .status(200)
            .json(new ApiResponse(200, null, USER_MESSAGES.USER_DEACTIVATED));
    }

    async onboardUser(req, res) {
        const user = await UserService.onboardUser(req.body);
        return res
            .status(201)
            .json(new ApiResponse(201, user, "User onboarded successfully"));
    }
}

export default new UserController();

