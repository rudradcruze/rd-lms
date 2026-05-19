import UserService from '../services/UserService.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { USER_MESSAGES } from '../user.constants.js';

class UserController {
  async getUserById(req, res) {
    const { userId } = req.params;
    const user = await UserService.getUserById(userId);
    return res.status(200).json(
      new ApiResponse(200, user, 'User retrieved successfully')
    );
  }

  async getAllUsers(req, res) {
    const { page = 1, limit = 10 } = req.query;
    const result = await UserService.getAllUsers(parseInt(page), parseInt(limit));
    return res.status(200).json(
      new ApiResponse(200, result, 'Users retrieved successfully')
    );
  }

  async assignRoleToUser(req, res) {
    const { userId } = req.params;
    const { roleId } = req.body;
    await UserService.assignRoleToUser(userId, roleId);
    return res.status(200).json(
      new ApiResponse(200, null, USER_MESSAGES.ROLE_ASSIGNED)
    );
  }

  async removeRoleFromUser(req, res) {
    const { userId, roleId } = req.params;
    await UserService.removeRoleFromUser(userId, roleId);
    return res.status(200).json(
      new ApiResponse(200, null, USER_MESSAGES.ROLE_REMOVED)
    );
  }

  async grantPermissionToUser(req, res) {
    const { userId } = req.params;
    const { permissionId } = req.body;
    await UserService.grantPermissionToUser(userId, permissionId);
    return res.status(200).json(
      new ApiResponse(200, null, USER_MESSAGES.PERMISSION_GRANTED)
    );
  }

  async denyPermissionToUser(req, res) {
    const { userId } = req.params;
    const { permissionId } = req.body;
    await UserService.denyPermissionToUser(userId, permissionId);
    return res.status(200).json(
      new ApiResponse(200, null, 'Permission denied successfully')
    );
  }

  async revokePermissionFromUser(req, res) {
    const { userId, permissionId } = req.params;
    await UserService.revokePermissionFromUser(userId, permissionId);
    return res.status(200).json(
      new ApiResponse(200, null, USER_MESSAGES.PERMISSION_REVOKED)
    );
  }

  async getUserPermissions(req, res) {
    const { userId } = req.params;
    const permissions = await UserService.getUserPermissions(userId);
    return res.status(200).json(
      new ApiResponse(200, permissions, 'User permissions retrieved successfully')
    );
  }
}

export default new UserController();
