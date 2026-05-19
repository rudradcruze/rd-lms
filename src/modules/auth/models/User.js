import { DataTypes } from 'sequelize';
import sequelize from '../../../configurations/db.postgres.js';
import { hashPassword } from '../../../utils/password.js';

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(16),
      allowNull: false,
      unique: {
        name: 'unique_username',
        msg: 'Username already exists',
      },
      validate: {
        len: [4, 16],
        is: /^[a-zA-Z0-9_.]+$/,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'unique_email',
        msg: 'Email already exists',
      },
      validate: {
        isEmail: true,
      },
      lower: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password_hash',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          user.passwordHash = await hashPassword(user.passwordHash);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash')) {
          user.passwordHash = await hashPassword(user.passwordHash);
        }
      },
    },
  }
);

export default User;
