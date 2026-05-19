import { DataTypes } from 'sequelize';
import sequelize from '../../../configurations/db.postgres.js';

const RefreshToken = sequelize.define(
  'RefreshToken',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    tokenHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'token_hash',
      unique: {
        name: 'unique_token_hash',
        msg: 'Token hash must be unique',
      },
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    blacklistedAt: {
      type: DataTypes.DATE,
      field: 'blacklisted_at',
      defaultValue: null,
    },
  },
  {
    tableName: 'refresh_tokens',
    timestamps: true,
    underscored: true,
  }
);

export default RefreshToken;
