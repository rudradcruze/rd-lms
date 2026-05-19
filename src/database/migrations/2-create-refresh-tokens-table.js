export async function up(queryInterface, DataTypes) {
  await queryInterface.createTable('refresh_tokens', {
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
    token_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    blacklisted_at: {
      type: DataTypes.DATE,
      defaultValue: null,
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

  await queryInterface.addIndex('refresh_tokens', ['user_id'], {
    name: 'idx_refresh_tokens_user_id',
  });

  await queryInterface.addIndex('refresh_tokens', ['expires_at'], {
    name: 'idx_refresh_tokens_expires_at',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('refresh_tokens');
}
