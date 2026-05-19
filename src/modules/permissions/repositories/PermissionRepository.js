import Permission from '../models/Permission.js';

class PermissionRepository {
  async create(permissionData) {
    return Permission.create(permissionData);
  }

  async findById(id) {
    return Permission.findByPk(id);
  }

  async findByKey(key) {
    return Permission.findOne({ where: { key } });
  }

  async findAll(options = {}) {
    const { limit = 100, offset = 0 } = options;

    return Permission.findAndCountAll({
      limit,
      offset,
      order: [['resource', 'ASC'], ['action', 'ASC']],
    });
  }

  async update(permissionId, permissionData) {
    await Permission.update(permissionData, { where: { id: permissionId } });
    return this.findById(permissionId);
  }

  async delete(permissionId) {
    await Permission.destroy({ where: { id: permissionId } });
  }
}

export default new PermissionRepository();
