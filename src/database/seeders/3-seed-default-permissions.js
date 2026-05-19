export async function up(queryInterface) {
  const permissions = [
    // User permissions
    { id: '750e8400-e29b-41d4-a716-446655440001', name: 'Create User', key: 'users.create', resource: 'users', action: 'create', created_at: new Date(), updated_at: new Date() },
    { id: '750e8400-e29b-41d4-a716-446655440002', name: 'Read User', key: 'users.read', resource: 'users', action: 'read', created_at: new Date(), updated_at: new Date() },
    { id: '750e8400-e29b-41d4-a716-446655440003', name: 'Update User', key: 'users.update', resource: 'users', action: 'update', created_at: new Date(), updated_at: new Date() },
    { id: '750e8400-e29b-41d4-a716-446655440004', name: 'Delete User', key: 'users.delete', resource: 'users', action: 'delete', created_at: new Date(), updated_at: new Date() },
    // Role permissions
    { id: '750e8400-e29b-41d4-a716-446655440005', name: 'Create Role', key: 'roles.create', resource: 'roles', action: 'create', created_at: new Date(), updated_at: new Date() },
    { id: '750e8400-e29b-41d4-a716-446655440006', name: 'Read Role', key: 'roles.read', resource: 'roles', action: 'read', created_at: new Date(), updated_at: new Date() },
    { id: '750e8400-e29b-41d4-a716-446655440007', name: 'Update Role', key: 'roles.update', resource: 'roles', action: 'update', created_at: new Date(), updated_at: new Date() },
    { id: '750e8400-e29b-41d4-a716-446655440008', name: 'Delete Role', key: 'roles.delete', resource: 'roles', action: 'delete', created_at: new Date(), updated_at: new Date() },
    // Course permissions
    { id: '750e8400-e29b-41d4-a716-446655440009', name: 'Create Course', key: 'courses.create', resource: 'courses', action: 'create', created_at: new Date(), updated_at: new Date() },
    { id: '750e8400-e29b-41d4-a716-44665544000a', name: 'Read Course', key: 'courses.read', resource: 'courses', action: 'read', created_at: new Date(), updated_at: new Date() },
    { id: '750e8400-e29b-41d4-a716-44665544000b', name: 'Update Course', key: 'courses.update', resource: 'courses', action: 'update', created_at: new Date(), updated_at: new Date() },
    { id: '750e8400-e29b-41d4-a716-44665544000c', name: 'Delete Course', key: 'courses.delete', resource: 'courses', action: 'delete', created_at: new Date(), updated_at: new Date() },
  ];

  await queryInterface.bulkInsert('permissions', permissions);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('permissions', {});
}
