import prisma from "../../../configurations/db.postgres.js";

class PermissionRepository {
    async create(permissionData) {
        return prisma.permission.create({
            data: permissionData,
        });
    }

    async findById(id) {
        return prisma.permission.findUnique({
            where: { id },
        });
    }

    async findByKey(key) {
        return prisma.permission.findFirst({ where: { key } });
    }

    async findAll(options = {}) {
        const { limit = 100, offset = 0 } = options;

        const [count, rows] = await Promise.all([
            prisma.permission.count(),
            prisma.permission.findMany({
                skip: offset,
                take: limit,
                orderBy: [{ resource: "asc" }, { action: "asc" }],
            }),
        ]);

        return { rows, count };
    }

    async update(permissionId, permissionData) {
        await prisma.permission.update({
            where: { id: permissionId },
            data: permissionData,
        });
        return this.findById(permissionId);
    }

    async delete(permissionId) {
        await prisma.permission.delete({ where: { id: permissionId } });
    }
}

export default new PermissionRepository();
