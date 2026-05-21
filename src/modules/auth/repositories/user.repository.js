import prisma from "../../../configurations/db.postgres.js";

const publicUserSelect = {
    id: true,
    username: true,
    email: true,
    isActive: true,
    isBlocked: true,
    createdAt: true,
    updatedAt: true,
    userRoles: {
        select: {
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
        },
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

    async create(userData) {
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
                select: publicUserSelect,
                orderBy: { createdAt: "desc" },
            }),
        ]);

        return { rows, count };
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
}

export default new UserRepository();
