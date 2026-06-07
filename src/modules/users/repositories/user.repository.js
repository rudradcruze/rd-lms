import prisma from "../../../configurations/db.postgres.js";

const userRoleSelect = {
    id: true,
    roleId: true,
    createdAt: true,
    updatedAt: true,
    role: {
        select: {
            id: true,
            name: true,
            key: true,
            description: true,
            createdAt: true,
            updatedAt: true,
        },
    },
};

const publicUserSelect = {
    id: true,
    username: true,
    email: true,
    isActive: true,
    isBlocked: true,
    createdAt: true,
    updatedAt: true,
    userRoles: {
        select: userRoleSelect,
    },
    userInfo: {
        select: {
            firstName: true,
            lastName: true,
        },
    },
};

const authUserSelect = {
    id: true,
    username: true,
    email: true,
    passwordHash: true,
    isActive: true,
    isBlocked: true,
    createdAt: true,
    updatedAt: true,
    userInfo: {
        select: {
            firstName: true,
            lastName: true,
        },
    },
};

class UserRepository {
    async findById(id, options = {}) {
        const { includePasswordHash = false } = options;

        return prisma.user.findUnique({
            where: { id },
            select: includePasswordHash ? authUserSelect : publicUserSelect,
        });
    }

    async findByEmail(email) {
        return prisma.user.findFirst({
            where: { email: email.toLowerCase() },
            select: { id: true },
        });
    }

    async findPublicByEmail(email) {
        return prisma.user.findFirst({
            where: { email: email.toLowerCase() },
            select: publicUserSelect,
        });
    }

    async findByUsername(username) {
        return prisma.user.findFirst({
            where: { username },
            select: { id: true },
        });
    }

    async findByEmailOrUsername(identifier) {
        return prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier.toLowerCase() },
                    { username: identifier },
                ],
            },
            select: authUserSelect,
        });
    }

    async findAll(options = {}) {
        const { limit = 10, offset = 0, isActive, isBlocked, roleKey } =
            options;

        const where = {};
        if (isActive !== undefined) where.isActive = isActive;
        if (isBlocked !== undefined) where.isBlocked = isBlocked;
        if (roleKey) {
            where.userRoles = {
                some: { role: { key: roleKey } },
            };
        }

        const [count, rows] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                skip: offset,
                take: limit,
                select: publicUserSelect,
                orderBy: { createdAt: "desc" },
            }),
        ]);

        return { rows, count };
    }

    async create(userData) {
        const studentRole = await prisma.role.findUnique({
            where: { key: "student" },
        });

        if (!studentRole) {
            throw new Error(
                "Default 'student' role not found in the database. Please run seeding."
            );
        }

        return this.createWithRole(userData, studentRole.id);
    }

    async createWithRole(userData, roleId) {
        const user = await prisma.user.create({
            data: {
                username: userData.username,
                email: userData.email.toLowerCase(),
                passwordHash: userData.passwordHash,
                userInfo: {
                    create: {
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                    },
                },
                userRoles: {
                    create: {
                        roleId,
                    },
                },
            },
        });

        return this.findById(user.id);
    }

    async update(userId, userData) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                ...userData,
                ...(userData.email
                    ? { email: userData.email.toLowerCase() }
                    : {}),
            },
        });

        return this.findById(userId);
    }

    async changePassword(userId, newPassword) {
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPassword },
        });
    }

    async delete(userId) {
        await prisma.user.delete({ where: { id: userId } });
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

    async blockUser(userId) {
        await prisma.user.update({
            where: { id: userId },
            data: { isBlocked: true },
        });
    }

    async unblockUser(userId) {
        await prisma.user.update({
            where: { id: userId },
            data: { isBlocked: false },
        });
    }

    async activateUser(userId) {
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: true },
        });
    }

    async deactivateUser(userId) {
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
    }
}

export default new UserRepository();
