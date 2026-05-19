import { DataTypes } from 'sequelize';
import sequelize from '../../../configurations/db.postgres.js';

const UserRole = sequelize.define(
  'UserRole',
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
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'role_id',
      references: {
        model: 'roles',
        key: 'id',
      },
    },
  },
  {
    tableName: 'user_roles',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'role_id'],
        name: 'unique_user_role',
      },
    ],
  }
);

export default UserRole;
