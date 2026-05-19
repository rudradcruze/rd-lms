import { DataTypes } from 'sequelize';
import sequelize from '../../../configurations/db.postgres.js';

const Permission = sequelize.define(
  'Permission',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'unique_permission_name',
        msg: 'Permission name already exists',
      },
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'unique_permission_key',
        msg: 'Permission key already exists',
      },
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Resource name (e.g., users, courses, roles)',
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Action name (e.g., create, read, update, delete)',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'permissions',
    timestamps: true,
    underscored: true,
  }
);

export default Permission;
