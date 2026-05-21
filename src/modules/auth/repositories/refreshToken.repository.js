import prisma from "../../../configurations/db.postgres.js";

class RefreshTokenRepository {
    async create(userId, tokenHash, expiresAt) {
        return prisma.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
            },
        });
    }

    async findByTokenHash(tokenHash) {
        return prisma.refreshToken.findFirst({
            where: { tokenHash },
        });
    }

    async findValidByUser(userId) {
        return prisma.refreshToken.findMany({
            where: {
                userId,
                blacklistedAt: null,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async invalidateToken(tokenId) {
        await prisma.refreshToken.update({
            where: { id: tokenId },
            data: { blacklistedAt: new Date() },
        });
    }

    async invalidateAllUserTokens(userId) {
        await prisma.refreshToken.updateMany({
            where: {
                userId,
                blacklistedAt: null,
            },
            data: { blacklistedAt: new Date() },
        });
    }

    async deleteExpiredTokens() {
        await prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
    }
}

export default new RefreshTokenRepository();
