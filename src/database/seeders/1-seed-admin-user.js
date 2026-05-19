import bcrypt from 'bcrypt';

export async function up(queryInterface) {
  const hashedPassword = await bcrypt.hash('admin@123', 10);

  await queryInterface.bulkInsert('users', [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      username: 'admin',
      email: 'admin@lms.local',
      password_hash: hashedPassword,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('users', {
    username: 'admin',
  });
}
