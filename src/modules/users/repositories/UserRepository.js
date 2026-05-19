import User from '../../auth/models/User.js';
import UserRole from '../models/UserRole.js';
import UserPermission from '../../permissions/models/UserPermission.js';
import Role from '../../roles/models/Role.js';
import Permission from '../../permissions/models/Permission.js';

class UserRepository {
  async findById(id) {
    return User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          include: [{ model: Role, as: 'role' }],
        },
      ],
    });
  }

  async findByEmail(email) {
    return User.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findAll(options = {}) {
    const { limit = 10, offset = 0, isActive } = options;

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return User.findAndCountAll({
      where,
      limit,
      offset,
      attributes: { exclude: ['passwordHash'] },
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'key'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async assignRole(userId, roleId) {
    return UserRole.create({ userId, roleId });
  }

  async removeRole(userId, roleId) {
    await UserRole.destroy({ where: { userId, roleId } });
  }

  async grantPermission(userId, permissionId, allowed = true) {
    return UserPermission.create({ userId, permissionId, allowed });
  }

  async revokePermission(userId, permissionId) {
    await UserPermission.destroy({ where: { userId, permissionId } });
  }

  async hasRole(userId, roleId) {
    const record = await UserRole.findOne({ where: { userId, roleId } });
    return !!record;
  }
}

export default new UserRepository();
