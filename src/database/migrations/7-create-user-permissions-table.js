export async function up(queryInterface, DataTypes) {
  await queryInterface.createTable('user_permissions', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
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
    allowed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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

  await queryInterface.addConstraint('user_permissions', {
    fields: ['user_id', 'permission_id'],
    type: 'unique',
    name: 'unique_user_permission',
  });

  await queryInterface.addIndex('user_permissions', ['user_id'], {
    name: 'idx_user_permissions_user_id',
  });
  await queryInterface.addIndex('user_permissions', ['permission_id'], {
    name: 'idx_user_permissions_permission_id',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('user_permissions');
}
