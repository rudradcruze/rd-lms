import RefreshToken from '../models/RefreshToken.js';

class RefreshTokenRepository {
  async create(userId, tokenHash, expiresAt) {
    return RefreshToken.create({
      userId,
      tokenHash,
      expiresAt,
    });
  }

  async findByTokenHash(tokenHash) {
    return RefreshToken.findOne({
      where: { tokenHash },
    });
  }

  async findValidByUser(userId) {
    return RefreshToken.findAll({
      where: {
        userId,
        blacklistedAt: null,
        expiresAt: {
          [RefreshToken.sequelize.Op.gt]: new Date(),
        },
      },
      order: [['createdAt', 'DESC']],
    });
  }

  async invalidateToken(tokenId) {
    await RefreshToken.update(
      { blacklistedAt: new Date() },
      { where: { id: tokenId } }
    );
  }

  async invalidateAllUserTokens(userId) {
    await RefreshToken.update(
      { blacklistedAt: new Date() },
      {
        where: {
          userId,
          blacklistedAt: null,
        },
      }
    );
  }

  async deleteExpiredTokens() {
    await RefreshToken.destroy({
      where: {
        expiresAt: {
          [RefreshToken.sequelize.Op.lt]: new Date(),
        },
      },
    });
  }
}

export default new RefreshTokenRepository();
