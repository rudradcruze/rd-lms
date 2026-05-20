import prisma from "../../../configurations/db.postgres.js";

const rolePermissionSelect = {
    id: true,
    permissionId: true,
    permission: {
        select: {
            id: true,
            key: true,
            name: true,
            resource: true,
            action: true,
        },
    },
};

class RoleRepository {
    async create(roleData) {
        return prisma.role.create({
            data: roleData,
        });
    }

    async findById(id) {
        return prisma.role.findUnique({
            where: { id },
            include: {
                rolePermissions: {
                    select: rolePermissionSelect,
                },
            },
        });
    }

    async findByKey(key) {
        return prisma.role.findFirst({ where: { key } });
    }

    async findAll(options = {}) {
        const { limit = 10, offset = 0 } = options;

        const [count, rows] = await Promise.all([
            prisma.role.count(),
            prisma.role.findMany({
                skip: offset,
                take: limit,
                include: {
                    rolePermissions: {
                        select: {
                            id: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        return { rows, count };
    }

    async update(roleId, roleData) {
        await prisma.role.update({
            where: { id: roleId },
            data: roleData,
        });
        return this.findById(roleId);
    }

    async delete(roleId) {
        await prisma.role.delete({ where: { id: roleId } });
    }

    async assignPermission(roleId, permissionId) {
        return prisma.rolePermission.create({
            data: { roleId, permissionId },
        });
    }

    async revokePermission(roleId, permissionId) {
        await prisma.rolePermission.deleteMany({
            where: { roleId, permissionId },
        });
    }

    async hasPermission(roleId, permissionId) {
        const record = await prisma.rolePermission.findFirst({
            where: { roleId, permissionId },
        });
        return !!record;
    }
}

export default new RoleRepository();
