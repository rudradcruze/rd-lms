import PermissionRepository from '../repositories/PermissionRepository.js';
import { ApiError } from '../../../utils/ApiError.js';
import { PERMISSION_MESSAGES } from '../permission.constants.js';

class PermissionService {
  async createPermission(permissionData) {
    const { key, name, resource, action, description } = permissionData;

    const existing = await PermissionRepository.findByKey(key);
    if (existing) {
      throw new ApiError(409, 'Permission with this key already exists');
    }

    return PermissionRepository.create({
      key,
      name,
      resource,
      action,
      description,
    });
  }

  async updatePermission(permissionId, permissionData) {
    const permission = await PermissionRepository.findById(permissionId);
    if (!permission) {
      throw new ApiError(404, PERMISSION_MESSAGES.PERMISSION_NOT_FOUND);
    }

    return PermissionRepository.update(permissionId, permissionData);
  }

  async getPermissionById(permissionId) {
    const permission = await PermissionRepository.findById(permissionId);
    if (!permission) {
      throw new ApiError(404, PERMISSION_MESSAGES.PERMISSION_NOT_FOUND);
    }
    return permission;
  }

  async getAllPermissions(page = 1, limit = 100) {
    const { rows, count } = await PermissionRepository.findAll({
      limit,
      offset: (page - 1) * limit,
    });

    return {
      permissions: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async deletePermission(permissionId) {
    const permission = await PermissionRepository.findById(permissionId);
    if (!permission) {
      throw new ApiError(404, PERMISSION_MESSAGES.PERMISSION_NOT_FOUND);
    }

    await PermissionRepository.delete(permissionId);
  }
}

export default new PermissionService();
