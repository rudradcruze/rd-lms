export async function up(queryInterface, DataTypes) {
  await queryInterface.createTable('role_permissions', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    permission_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'permissions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addConstraint('role_permissions', {
    fields: ['role_id', 'permission_id'],
    type: 'unique',
    name: 'unique_role_permission',
  });

  await queryInterface.addIndex('role_permissions', ['role_id'], {
    name: 'idx_role_permissions_role_id',
  });
  await queryInterface.addIndex('role_permissions', ['permission_id'], {
    name: 'idx_role_permissions_permission_id',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('role_permissions');
}
