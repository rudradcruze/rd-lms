export async function up(queryInterface) {
  const roles = [
    {
      id: '650e8400-e29b-41d4-a716-446655440001',
      name: 'Super Admin',
      key: 'super_admin',
      description: 'Full system access',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440002',
      name: 'Admin',
      key: 'admin',
      description: 'Administrative access',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440003',
      name: 'Instructor',
      key: 'instructor',
      description: 'Can create and manage courses',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440004',
      name: 'Student',
      key: 'student',
      description: 'Can enroll in courses',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await queryInterface.bulkInsert('roles', roles);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('roles', {});
}
