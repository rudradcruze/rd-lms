export const PERMISSION_MESSAGES = {
    PERMISSION_CREATED: "Permission created successfully",
    PERMISSION_UPDATED: "Permission updated successfully",
    PERMISSION_DELETED: "Permission deleted successfully",
    PERMISSION_NOT_FOUND: "Permission not found",
};

export const PREDEFINED_PERMISSIONS = [
    // User permissions
    { resource: "users", action: "create", key: "users.create" },
    { resource: "users", action: "read", key: "users.read" },
    { resource: "users", action: "update", key: "users.update" },
    { resource: "users", action: "delete", key: "users.delete" },
    // Role permissions
    { resource: "roles", action: "create", key: "roles.create" },
    { resource: "roles", action: "read", key: "roles.read" },
    { resource: "roles", action: "update", key: "roles.update" },
    { resource: "roles", action: "delete", key: "roles.delete" },
    // Course permissions
    { resource: "courses", action: "create", key: "courses.create" },
    { resource: "courses", action: "read", key: "courses.read" },
    { resource: "courses", action: "update", key: "courses.update" },
    { resource: "courses", action: "delete", key: "courses.delete" },
];
