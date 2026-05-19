export async function up(queryInterface) {
  const rolePermissions = [
    // Super admin gets all permissions
    { id: '850e8400-e29b-41d4-a716-446655440001', role_id: '650e8400-e29b-41d4-a716-446655440001', permission_id: '750e8400-e29b-41d4-a716-446655440001', created_at: new Date(), updated_at: new Date() },
    { id: '850e8400-e29b-41d4-a716-446655440002', role_id: '650e8400-e29b-41d4-a716-446655440001', permission_id: '750e8400-e29b-41d4-a716-446655440002', created_at: new Date(), updated_at: new Date() },
    { id: '850e8400-e29b-41d4-a716-446655440003', role_id: '650e8400-e29b-41d4-a716-446655440001', permission_id: '750e8400-e29b-41d4-a716-446655440003', created_at: new Date(), updated_at: new Date() },
    { id: '850e8400-e29b-41d4-a716-446655440004', role_id: '650e8400-e29b-41d4-a716-446655440001', permission_id: '750e8400-e29b-41d4-a716-446655440004', created_at: new Date(), updated_at: new Date() },
    { id: '850e8400-e29b-41d4-a716-446655440005', role_id: '650e8400-e29b-41d4-a716-446655440001', permission_id: '750e8400-e29b-41d4-a716-446655440005', created_at: new Date(), updated_at: new Date() },
    { id: '850e8400-e29b-41d4-a716-446655440006', role_id: '650e8400-e29b-41d4-a716-446655440001', permission_id: '750e8400-e29b-41d4-a716-446655440006', created_at: new Date(), updated_at: new Date() },
    { id: '850e8400-e29b-41d4-a716-446655440007', role_id: '650e8400-e29b-41d4-a716-446655440001', permission_id: '750e8400-e29b-41d4-a716-446655440007', created_at: new Date(), updated_at: new Date() },
    { id: '850e8400-e29b-41d4-a716-446655440008', role_id: '650e8400-e29b-41d4-a716-446655440001', permission_id: '750e8400-e29b-41d4-a716-446655440008', created_at: new Date(), updated_at: new Date() },
    { id: '850e8400-e29b-41d4-a716-446655440009', role_id: '650e8400-e29b-41d4-a716-446655440001', permission_id: '750e8400-e29b-41d4-a716-446655440009', created_at: new Date(), updated_at: new Date() },
    { id: '850e8400-e29b-41d4-a716-44665544000a', role_id: '650e8400-e29b-41d4-a716-446655440001', permission_id: '750e8400-e29b-41d4-a716-44665544000a', created_at: new Date(), updated_at: new Date() },
    { id: '850e8400-e29b-41d4-a716-44665544000b', role_id: '650e8400-e29b-41d4-a716-446655440001', permission_id: '750e8400-e29b-41d4-a716-44665544000b', created_at: new Date(), updated_at: new Date() },
    { id: '850e8400-e29b-41d4-a716-44665544000c', role_id: '650e8400-e29b-41d4-a716-446655440001', permission_id: '750e8400-e29b-41d4-a716-44665544000c', created_at: new Date(), updated_at: new Date() },
    // Instructor can create courses
    { id: '850e8400-e29b-41d4-a716-44665544000d', role_id: '650e8400-e29b-41d4-a716-446655440003', permission_id: '750e8400-e29b-41d4-a716-446655440009', created_at: new Date(), updated_at: new Date() },
    { id: '850e8400-e29b-41d4-a716-44665544000e', role_id: '650e8400-e29b-41d4-a716-446655440003', permission_id: '750e8400-e29b-41d4-a716-44665544000b', created_at: new Date(), updated_at: new Date() },
    // Student can read courses
    { id: '850e8400-e29b-41d4-a716-44665544000f', role_id: '650e8400-e29b-41d4-a716-446655440004', permission_id: '750e8400-e29b-41d4-a716-44665544000a', created_at: new Date(), updated_at: new Date() },
  ];

  await queryInterface.bulkInsert('role_permissions', rolePermissions);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('role_permissions', {});
}
