import prisma from "../../../configurations/db.postgres.js";
import { DEFAULT_COURSE_SETTINGS } from "../courses.constants.js";

const instructorUserSelect = {
    id: true,
    username: true,
    email: true,
    userInfo: {
        select: {
            firstName: true,
            lastName: true,
        },
    },
};

const courseSelect = {
    id: true,
    title: true,
    slug: true,
    shortDescription: true,
    description: true,
    thumbnailUrl: true,
    status: true,
    categoryId: true,
    createdById: true,
    deletedAt: true,
    createdAt: true,
    updatedAt: true,
    category: {
        select: {
            id: true,
            name: true,
            description: true,
        },
    },
    settings: {
        select: {
            id: true,
            allowSelfEnrollment: true,
            requiresApproval: true,
            showInCatalog: true,
            enableDiscussions: true,
            createdAt: true,
            updatedAt: true,
        },
    },
    creator: {
        select: {
            id: true,
            username: true,
            email: true,
            userInfo: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
    },
    instructors: {
        select: {
            id: true,
            isPrimary: true,
            createdAt: true,
            user: {
                select: instructorUserSelect,
            },
        },
    },
};

class CourseRepository {
    async create(data, creatorId) {
        return prisma.$transaction(async (tx) => {
            const course = await tx.course.create({
                data: {
                    title: data.title,
                    slug: data.slug,
                    shortDescription: data.shortDescription ?? null,
                    description: data.description ?? null,
                    thumbnailUrl: data.thumbnailUrl ?? null,
                    categoryId: data.categoryId ?? null,
                    createdById: creatorId,
                    status: "DRAFT",
                    settings: {
                        create: { ...DEFAULT_COURSE_SETTINGS },
                    },
                    instructors: {
                        create: {
                            userId: creatorId,
                            isPrimary: true,
                        },
                    },
                },
                select: courseSelect,
            });

            return course;
        });
    }

    async findById(id, options = {}) {
        const { includeDeleted = false } = options;

        const where = { id };
        if (!includeDeleted) {
            where.deletedAt = null;
        }

        return prisma.course.findFirst({
            where,
            select: courseSelect,
        });
    }

    async findBySlug(slug, options = {}) {
        const { excludeId = null, includeDeleted = false } = options;

        const where = { slug };
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        if (excludeId) {
            where.id = { not: excludeId };
        }

        return prisma.course.findFirst({
            where,
            select: { id: true, slug: true },
        });
    }

    async findAll(options = {}) {
        const {
            limit = 10,
            offset = 0,
            search,
            status,
            categoryId,
            instructorId,
        } = options;

        const where = { deletedAt: null };

        if (status) {
            where.status = status;
        }
        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (instructorId) {
            where.instructors = {
                some: { userId: instructorId },
            };
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { slug: { contains: search, mode: "insensitive" } },
            ];
        }

        const [count, rows] = await Promise.all([
            prisma.course.count({ where }),
            prisma.course.findMany({
                where,
                skip: offset,
                take: limit,
                select: courseSelect,
                orderBy: { createdAt: "desc" },
            }),
        ]);

        return { rows, count };
    }

    async update(id, data) {
        const { settings, ...courseData } = data;

        await prisma.$transaction(async (tx) => {
            if (Object.keys(courseData).length > 0) {
                await tx.course.update({
                    where: { id },
                    data: courseData,
                });
            }

            if (settings && Object.keys(settings).length > 0) {
                await tx.courseSettings.update({
                    where: { courseId: id },
                    data: settings,
                });
            }
        });

        return this.findById(id);
    }

    async softDelete(id) {
        await prisma.course.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async publish(id) {
        await prisma.course.update({
            where: { id },
            data: { status: "PUBLISHED" },
        });
        return this.findById(id);
    }

    async archive(id) {
        await prisma.course.update({
            where: { id },
            data: { status: "ARCHIVED" },
        });
        return this.findById(id);
    }

    async assignInstructor(courseId, userId, isPrimary = false) {
        if (isPrimary) {
            await prisma.courseInstructor.updateMany({
                where: { courseId, isPrimary: true },
                data: { isPrimary: false },
            });
        }

        return prisma.courseInstructor.create({
            data: {
                courseId,
                userId,
                isPrimary,
            },
            select: {
                id: true,
                isPrimary: true,
                createdAt: true,
                user: {
                    select: instructorUserSelect,
                },
            },
        });
    }

    async removeInstructor(courseId, userId) {
        await prisma.courseInstructor.deleteMany({
            where: { courseId, userId },
        });
    }

    async findCourseInstructors(courseId) {
        return prisma.courseInstructor.findMany({
            where: { courseId },
            select: {
                id: true,
                isPrimary: true,
                createdAt: true,
                user: {
                    select: instructorUserSelect,
                },
            },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        });
    }

    async isPrimaryInstructor(courseId, userId) {
        const record = await prisma.courseInstructor.findFirst({
            where: { courseId, userId, isPrimary: true },
            select: { id: true },
        });
        return !!record;
    }

    async hasInstructor(courseId, userId) {
        const record = await prisma.courseInstructor.findFirst({
            where: { courseId, userId },
            select: { id: true },
        });
        return !!record;
    }

    async countInstructors(courseId) {
        return prisma.courseInstructor.count({
            where: { courseId },
        });
    }

    async findAllCategories() {
        return prisma.courseCategory.findMany({
            orderBy: { name: "asc" },
        });
    }

    async createCategory(data) {
        return prisma.courseCategory.create({ data });
    }

    async findCategoryById(id) {
        return prisma.courseCategory.findUnique({ where: { id } });
    }

    async findCategoryByName(name) {
        return prisma.courseCategory.findUnique({ where: { name } });
    }
}

export default new CourseRepository();
