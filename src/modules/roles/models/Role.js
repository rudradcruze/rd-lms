import { DataTypes } from 'sequelize';
import sequelize from '../../../configurations/db.postgres.js';

const Role = sequelize.define(
  'Role',
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
        name: 'unique_role_name',
        msg: 'Role name already exists',
      },
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'unique_role_key',
        msg: 'Role key already exists',
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'roles',
    timestamps: true,
    underscored: true,
  }
);

export default Role;
