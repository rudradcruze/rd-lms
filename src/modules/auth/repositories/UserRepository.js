import User from '../models/User.js';

class UserRepository {
  async findById(id) {
    return User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] },
    });
  }

  async findByEmail(email) {
    return User.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findByUsername(username) {
    return User.findOne({
      where: { username },
    });
  }

  async findByEmailOrUsername(identifier) {
    return User.findOne({
      where: {
        [User.sequelize.Op.or]: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      },
    });
  }

  async create(userData) {
    const user = await User.create({
      username: userData.username,
      email: userData.email.toLowerCase(),
      passwordHash: userData.password,
    });

    return this.findById(user.id);
  }

  async update(userId, userData) {
    await User.update(userData, {
      where: { id: userId },
    });

    return this.findById(userId);
  }

  async findAll(options = {}) {
    const { limit = 10, offset = 0, isActive } = options;

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      limit,
      offset,
      attributes: { exclude: ['passwordHash'] },
      order: [['createdAt', 'DESC']],
    });

    return { rows, count };
  }

  async changePassword(userId, newPassword) {
    await User.update(
      { passwordHash: newPassword },
      { where: { id: userId } }
    );
  }

  async delete(userId) {
    await User.destroy({ where: { id: userId } });
  }
}

export default new UserRepository();
