import prisma from "../../../configurations/db.postgres.js";

const sectionSelect = {
    id: true,
    courseId: true,
    title: true,
    description: true,
    position: true,
    isPublished: true,
    createdAt: true,
    updatedAt: true,
    contents: {
        orderBy: { position: "asc" },
        select: {
            id: true,
            sectionId: true,
            title: true,
            description: true,
            contentType: true,
            position: true,
            isPublished: true,
            createdById: true,
            createdAt: true,
            updatedAt: true,
            assets: {
                select: {
                    id: true,
                    contentId: true,
                    provider: true,
                    publicId: true,
                    secureUrl: true,
                    originalFileName: true,
                    mimeType: true,
                    sizeBytes: true,
                    durationSeconds: true,
                    createdAt: true,
                },
            },
        },
    },
};

const contentSelect = {
    id: true,
    sectionId: true,
    title: true,
    description: true,
    contentType: true,
    position: true,
    isPublished: true,
    createdById: true,
    createdAt: true,
    updatedAt: true,
    section: {
        select: {
            id: true,
            courseId: true,
            title: true,
            isPublished: true,
        },
    },
    assets: {
        select: {
            id: true,
            contentId: true,
            provider: true,
            publicId: true,
            secureUrl: true,
            originalFileName: true,
            mimeType: true,
            sizeBytes: true,
            durationSeconds: true,
            createdAt: true,
        },
    },
};

class ContentRepository {
    // ─── Sections ────────────────────────────────────────────────────────────

    async createSection(data) {
        return prisma.courseSection.create({
            data: {
                courseId: data.courseId,
                title: data.title,
                description: data.description ?? null,
                position: data.position,
                isPublished: data.isPublished ?? false,
            },
            select: sectionSelect,
        });
    }

    async findSectionById(id) {
        return prisma.courseSection.findUnique({
            where: { id },
            select: sectionSelect,
        });
    }

    async updateSection(id, data) {
        return prisma.courseSection.update({
            where: { id },
            data,
            select: sectionSelect,
        });
    }

    async deleteSection(id) {
        return prisma.courseSection.delete({
            where: { id },
        });
    }

    async findNextSectionPosition(courseId) {
        const result = await prisma.courseSection.aggregate({
            where: { courseId },
            _max: { position: true },
        });
        return (result._max.position ?? -1) + 1;
    }

    async countSectionsInCourse(courseId) {
        return prisma.courseSection.count({
            where: { courseId },
        });
    }

    async reorderSections(courseId, sectionId, newPosition) {
        return prisma.$transaction(async (tx) => {
            const sectionToMove = await tx.courseSection.findUnique({
                where: { id: sectionId },
            });
            if (!sectionToMove) return null;

            const oldPosition = sectionToMove.position;
            if (oldPosition === newPosition) return sectionToMove;

            // Shift other sections
            if (oldPosition < newPosition) {
                await tx.courseSection.updateMany({
                    where: {
                        courseId,
                        position: {
                            gt: oldPosition,
                            lte: newPosition,
                        },
                    },
                    data: {
                        position: { decrement: 1 },
                    },
                });
            } else {
                await tx.courseSection.updateMany({
                    where: {
                        courseId,
                        position: {
                            gte: newPosition,
                            lt: oldPosition,
                        },
                    },
                    data: {
                        position: { increment: 1 },
                    },
                });
            }

            // Update moved section position
            return tx.courseSection.update({
                where: { id: sectionId },
                data: { position: newPosition },
                select: sectionSelect,
            });
        });
    }

    // ─── Contents ────────────────────────────────────────────────────────────

    async createContent(data) {
        return prisma.$transaction(async (tx) => {
            const content = await tx.courseContent.create({
                data: {
                    sectionId: data.sectionId,
                    title: data.title,
                    description: data.description ?? null,
                    contentType: data.contentType,
                    position: data.position,
                    isPublished: data.isPublished ?? false,
                    createdById: data.createdById,
                },
            });

            if (data.asset) {
                await tx.contentAsset.create({
                    data: {
                        contentId: content.id,
                        provider: data.asset.provider,
                        publicId: data.asset.publicId ?? null,
                        secureUrl: data.asset.secureUrl,
                        originalFileName: data.asset.originalFileName ?? null,
                        mimeType: data.asset.mimeType ?? null,
                        sizeBytes: data.asset.sizeBytes ?? null,
                        durationSeconds: data.asset.durationSeconds ?? null,
                    },
                });
            }

            return tx.courseContent.findUnique({
                where: { id: content.id },
                select: contentSelect,
            });
        });
    }

    async findContentById(id) {
        return prisma.courseContent.findUnique({
            where: { id },
            select: contentSelect,
        });
    }

    async updateContent(id, data) {
        const { asset, ...contentData } = data;
        return prisma.$transaction(async (tx) => {
            if (Object.keys(contentData).length > 0) {
                await tx.courseContent.update({
                    where: { id },
                    data: contentData,
                });
            }

            if (asset) {
                // Delete existing asset first (1-to-1 logical relation mapping to 1-to-many db schema)
                await tx.contentAsset.deleteMany({
                    where: { contentId: id },
                });

                await tx.contentAsset.create({
                    data: {
                        contentId: id,
                        provider: asset.provider,
                        publicId: asset.publicId ?? null,
                        secureUrl: asset.secureUrl,
                        originalFileName: asset.originalFileName ?? null,
                        mimeType: asset.mimeType ?? null,
                        sizeBytes: asset.sizeBytes ?? null,
                        durationSeconds: asset.durationSeconds ?? null,
                    },
                });
            }

            return tx.courseContent.findUnique({
                where: { id },
                select: contentSelect,
            });
        });
    }

    async deleteContent(id) {
        return prisma.courseContent.delete({
            where: { id },
        });
    }

    async findNextContentPosition(sectionId) {
        const result = await prisma.courseContent.aggregate({
            where: { sectionId },
            _max: { position: true },
        });
        return (result._max.position ?? -1) + 1;
    }

    async reorderContents(sectionId, orderedIds) {
        return prisma.$transaction(async (tx) => {
            let index = 0;
            for (const contentId of orderedIds) {
                await tx.courseContent.updateMany({
                    where: { id: contentId, sectionId },
                    data: { position: index },
                });
                index++;
            }
        });
    }
}

export default new ContentRepository();
