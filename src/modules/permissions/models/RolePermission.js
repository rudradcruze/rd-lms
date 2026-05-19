import { DataTypes } from 'sequelize';
import sequelize from '../../../configurations/db.postgres.js';
import Role from '../../roles/models/Role.js';
import Permission from './Permission.js';

const RolePermission = sequelize.define(
  'RolePermission',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'permission_id',
      references: {
        model: 'permissions',
        key: 'id',
      },
    },
  },
  {
    tableName: 'role_permissions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'permission_id'],
        name: 'unique_role_permission',
      },
    ],
  }
);

RolePermission.belongsTo(Role, {
  foreignKey: 'roleId',
  as: 'role',
  onDelete: 'CASCADE',
});

RolePermission.belongsTo(Permission, {
  foreignKey: 'permissionId',
  as: 'permission',
  onDelete: 'CASCADE',
});

Role.hasMany(RolePermission, {
  foreignKey: 'roleId',
  as: 'rolePermissions',
  onDelete: 'CASCADE',
});

Permission.hasMany(RolePermission, {
  foreignKey: 'permissionId',
  as: 'rolePermissions',
  onDelete: 'CASCADE',
});

export default RolePermission;
