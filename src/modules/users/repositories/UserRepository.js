import prisma from "../../../configurations/db.postgres.js";

const userRoleSelect = {
    id: true,
    roleId: true,
    role: {
        select: {
            id: true,
            name: true,
            key: true,
        },
    },
};

class UserRepository {
    async findById(id) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                userRoles: {
                    select: userRoleSelect,
                },
            },
        });
    }

    async findByEmail(email) {
        return prisma.user.findFirst({
            where: { email: email.toLowerCase() },
            select: { id: true },
        });
    }

    async findAll(options = {}) {
        const { limit = 10, offset = 0, isActive } = options;

        const where = {};
        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        const [count, rows] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                skip: offset,
                take: limit,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    userRoles: {
                        select: userRoleSelect,
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        return { rows, count };
    }

    async assignRole(userId, roleId) {
        return prisma.userRole.create({
            data: { userId, roleId },
        });
    }

    async removeRole(userId, roleId) {
        await prisma.userRole.deleteMany({
            where: { userId, roleId },
        });
    }

    async grantPermission(userId, permissionId, allowed = true) {
        return prisma.userPermission.upsert({
            where: {
                userId_permissionId: {
                    userId,
                    permissionId,
                },
            },
            create: { userId, permissionId, allowed },
            update: { allowed },
        });
    }

    async revokePermission(userId, permissionId) {
        await prisma.userPermission.deleteMany({
            where: { userId, permissionId },
        });
    }

    async hasRole(userId, roleId) {
        const record = await prisma.userRole.findFirst({
            where: { userId, roleId },
        });
        return !!record;
    }
}

export default new UserRepository();
