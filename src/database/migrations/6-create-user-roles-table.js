export async function up(queryInterface, DataTypes) {
  await queryInterface.createTable('user_roles', {
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

  await queryInterface.addConstraint('user_roles', {
    fields: ['user_id', 'role_id'],
    type: 'unique',
    name: 'unique_user_role',
  });

  await queryInterface.addIndex('user_roles', ['user_id'], {
    name: 'idx_user_roles_user_id',
  });
  await queryInterface.addIndex('user_roles', ['role_id'], {
    name: 'idx_user_roles_role_id',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('user_roles');
}
