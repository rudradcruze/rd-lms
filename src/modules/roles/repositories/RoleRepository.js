import Role from '../models/Role.js';
import RolePermission from '../../permissions/models/RolePermission.js';
import Permission from '../../permissions/models/Permission.js';

class RoleRepository {
  async create(roleData) {
    return Role.create(roleData);
  }

  async findById(id) {
    return Role.findByPk(id, {
      include: [
        {
          model: RolePermission,
          as: 'rolePermissions',
          include: [
            {
              model: Permission,
              as: 'permission',
              attributes: ['id', 'key', 'name', 'resource', 'action'],
            },
          ],
        },
      ],
    });
  }

  async findByKey(key) {
    return Role.findOne({ where: { key } });
  }

  async findAll(options = {}) {
    const { limit = 10, offset = 0 } = options;

    return Role.findAndCountAll({
      limit,
      offset,
      include: [
        {
          model: RolePermission,
          as: 'rolePermissions',
          attributes: ['id'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async update(roleId, roleData) {
    await Role.update(roleData, { where: { id: roleId } });
    return this.findById(roleId);
  }

  async delete(roleId) {
    await Role.destroy({ where: { id: roleId } });
  }

  async assignPermission(roleId, permissionId) {
    return RolePermission.create({ roleId, permissionId });
  }

  async revokePermission(roleId, permissionId) {
    await RolePermission.destroy({
      where: { roleId, permissionId },
    });
  }

  async hasPermission(roleId, permissionId) {
    const record = await RolePermission.findOne({
      where: { roleId, permissionId },
    });
    return !!record;
  }
}

export default new RoleRepository();
