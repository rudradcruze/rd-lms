import prisma from "../../../configurations/db.postgres.js";

const userSummarySelect = {
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

const courseSummarySelect = {
    id: true,
    title: true,
    slug: true,
    status: true,
};

export const enrollmentSelect = {
    id: true,
    studentId: true,
    courseId: true,
    status: true,
    approvedAt: true,
    approvedById: true,
    rejectedAt: true,
    rejectedById: true,
    withdrawnAt: true,
    withdrawnById: true,
    createdAt: true,
    updatedAt: true,
    student: {
        select: userSummarySelect,
    },
    course: {
        select: courseSummarySelect,
    },
    approvedBy: {
        select: userSummarySelect,
    },
    rejectedBy: {
        select: userSummarySelect,
    },
    withdrawnBy: {
        select: userSummarySelect,
    },
};

class EnrollmentRepository {
    async create(data) {
        return prisma.enrollment.create({
            data,
            select: enrollmentSelect,
        });
    }

    async findById(id) {
        return prisma.enrollment.findUnique({
            where: { id },
            select: enrollmentSelect,
        });
    }

    async findExistingEnrollment(studentId, courseId) {
        return prisma.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId,
                    courseId,
                },
            },
            select: { id: true, status: true },
        });
    }

    async findByStudent(studentId, options = {}) {
        const { limit = 10, offset = 0, where = {} } = options;

        const fullWhere = {
            studentId,
            ...where,
        };

        const [count, rows] = await Promise.all([
            prisma.enrollment.count({ where: fullWhere }),
            prisma.enrollment.findMany({
                where: fullWhere,
                skip: offset,
                take: limit,
                select: enrollmentSelect,
                orderBy: { createdAt: "desc" },
            }),
        ]);

        return { rows, count };
    }

    async findByCourse(courseId, options = {}) {
        const { limit = 10, offset = 0, where = {} } = options;

        const fullWhere = {
            courseId,
            ...where,
        };

        const [count, rows] = await Promise.all([
            prisma.enrollment.count({ where: fullWhere }),
            prisma.enrollment.findMany({
                where: fullWhere,
                skip: offset,
                take: limit,
                select: enrollmentSelect,
                orderBy: { createdAt: "desc" },
            }),
        ]);

        return { rows, count };
    }

    async findAll(options = {}) {
        const { limit = 10, offset = 0, where = {} } = options;

        const [count, rows] = await Promise.all([
            prisma.enrollment.count({ where }),
            prisma.enrollment.findMany({
                where,
                skip: offset,
                take: limit,
                select: enrollmentSelect,
                orderBy: { createdAt: "desc" },
            }),
        ]);

        return { rows, count };
    }

    async count(where = {}) {
        return prisma.enrollment.count({ where });
    }

    async approve(id, approvedById) {
        return prisma.enrollment.update({
            where: { id },
            data: {
                status: "APPROVED",
                approvedAt: new Date(),
                approvedById,
                rejectedAt: null,
                rejectedById: null,
            },
            select: enrollmentSelect,
        });
    }

    async reject(id, rejectedById) {
        return prisma.enrollment.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectedAt: new Date(),
                rejectedById,
            },
            select: enrollmentSelect,
        });
    }

    async withdraw(id, withdrawnById) {
        return prisma.enrollment.update({
            where: { id },
            data: {
                status: "WITHDRAWN",
                withdrawnAt: new Date(),
                withdrawnById,
            },
            select: enrollmentSelect,
        });
    }
}

export default new EnrollmentRepository();
