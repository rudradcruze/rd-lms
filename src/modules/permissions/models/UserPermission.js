import { DataTypes } from 'sequelize';
import sequelize from '../../../configurations/db.postgres.js';

const UserPermission = sequelize.define(
  'UserPermission',
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
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'permission_id',
      references: {
        model: 'permissions',
        key: 'id',
      },
    },
    allowed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'true = allow, false = deny',
    },
  },
  {
    tableName: 'user_permissions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'permission_id'],
        name: 'unique_user_permission',
      },
    ],
  }
);

export default UserPermission;
