import { ApiError } from "../../../utils/ApiError.js";
import {
    getPaginationMeta,
    getPaginationParams,
} from "../../../utils/pagination.js";
import { COURSE_STATUS } from "../../courses/courses.constants.js";
import CourseRepository from "../../courses/repositories/courses.repository.js";
import UserRepository from "../../users/repositories/user.repository.js";
import {
    ENROLLMENT_MESSAGES,
    ENROLLMENT_STATUS,
    VALID_TRANSITIONS,
} from "../enrollments.constants.js";
import EnrollmentRepository from "../repositories/enrollments.repository.js";

function getUserRoles(user) {
    return user?.userRoles?.map((ur) => ur.role.key) || [];
}

function isAdminOrSuperAdmin(roles) {
    return roles.includes("super_admin") || roles.includes("admin");
}

function parseDateFilter(value) {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new ApiError(400, "Invalid date filter");
    }
    return date;
}

class EnrollmentService {
    async getActorRoles(actorId) {
        const user = await UserRepository.findById(actorId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        return getUserRoles(user);
    }

    assertCourseEligibleForEnrollment(course) {
        if (
            !course ||
            course.deletedAt !== null ||
            course.status !== COURSE_STATUS.PUBLISHED
        ) {
            throw new ApiError(
                400,
                ENROLLMENT_MESSAGES.COURSE_NOT_AVAILABLE,
            );
        }
    }

    buildFilterWhere(query = {}) {
        const where = {};

        if (query.status) {
            where.status = query.status;
        }
        if (query.courseId) {
            where.courseId = query.courseId;
        }
        if (query.studentId) {
            where.studentId = query.studentId;
        }

        const dateFrom = parseDateFilter(query.dateFrom);
        const dateTo = parseDateFilter(query.dateTo);

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                where.createdAt.gte = dateFrom;
            }
            if (dateTo) {
                where.createdAt.lte = dateTo;
            }
        }

        return where;
    }

    async buildListScope(actorId, roles) {
        if (isAdminOrSuperAdmin(roles)) {
            return {};
        }

        if (roles.includes("instructor")) {
            return {
                course: {
                    instructors: {
                        some: { userId: actorId },
                    },
                },
            };
        }

        return { studentId: actorId };
    }

    async assertCanView(enrollment, actorId, roles) {
        if (isAdminOrSuperAdmin(roles)) {
            return;
        }

        if (roles.includes("student") && enrollment.studentId === actorId) {
            return;
        }

        if (roles.includes("instructor")) {
            const isInstructor = await CourseRepository.hasInstructor(
                enrollment.courseId,
                actorId,
            );
            if (isInstructor) {
                return;
            }
        }

        throw new ApiError(403, ENROLLMENT_MESSAGES.ACCESS_DENIED);
    }

    async assertCanManage(enrollment, actorId, roles) {
        if (isAdminOrSuperAdmin(roles)) {
            return;
        }

        if (roles.includes("instructor")) {
            const isInstructor = await CourseRepository.hasInstructor(
                enrollment.courseId,
                actorId,
            );
            if (isInstructor) {
                return;
            }
        }

        throw new ApiError(403, ENROLLMENT_MESSAGES.ACCESS_DENIED);
    }

    async assertCanWithdraw(enrollment, actorId, roles) {
        if (isAdminOrSuperAdmin(roles)) {
            return;
        }

        if (enrollment.studentId === actorId) {
            return;
        }

        throw new ApiError(403, ENROLLMENT_MESSAGES.ACCESS_DENIED);
    }

    assertValidTransition(currentStatus, targetStatus) {
        const allowed = VALID_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(targetStatus)) {
            throw new ApiError(
                400,
                ENROLLMENT_MESSAGES.INVALID_TRANSITION,
            );
        }
    }

    async getEnrollmentOrThrow(enrollmentId) {
        const enrollment = await EnrollmentRepository.findById(enrollmentId);
        if (!enrollment) {
            throw new ApiError(404, ENROLLMENT_MESSAGES.NOT_FOUND);
        }
        return enrollment;
    }

    formatListResult(rows, count, page, limit) {
        return {
            enrollments: rows,
            ...getPaginationMeta(page, limit, count),
        };
    }

    async listEnrollments(actorId, query = {}) {
        const roles = await this.getActorRoles(actorId);
        const { page, limit, offset } = getPaginationParams(
            query.page,
            query.limit,
        );

        const scope = await this.buildListScope(actorId, roles);
        const filters = this.buildFilterWhere(query);
        const where = { ...filters, ...scope };

        const { rows, count } = await EnrollmentRepository.findAll({
            limit,
            offset,
            where,
        });

        return this.formatListResult(rows, count, page, limit);
    }

    async getMyEnrollments(actorId, query = {}) {
        const { page, limit, offset } = getPaginationParams(
            query.page,
            query.limit,
        );

        const filters = this.buildFilterWhere(query);
        const where = {
            ...filters,
            status: {
                in: [ENROLLMENT_STATUS.PENDING, ENROLLMENT_STATUS.APPROVED],
            },
        };

        const { rows, count } = await EnrollmentRepository.findByStudent(
            actorId,
            { limit, offset, where },
        );

        return this.formatListResult(rows, count, page, limit);
    }

    async getEnrollmentHistory(actorId, query = {}) {
        const { page, limit, offset } = getPaginationParams(
            query.page,
            query.limit,
        );

        const filters = this.buildFilterWhere(query);
        const where = {
            ...filters,
            status: {
                in: [
                    ENROLLMENT_STATUS.APPROVED,
                    ENROLLMENT_STATUS.REJECTED,
                    ENROLLMENT_STATUS.WITHDRAWN,
                ],
            },
        };

        const { rows, count } = await EnrollmentRepository.findByStudent(
            actorId,
            { limit, offset, where },
        );

        return this.formatListResult(rows, count, page, limit);
    }

    async getEnrollmentById(actorId, enrollmentId) {
        const roles = await this.getActorRoles(actorId);
        const enrollment = await this.getEnrollmentOrThrow(enrollmentId);
        await this.assertCanView(enrollment, actorId, roles);
        return enrollment;
    }

    async createEnrollment(actorId, { courseId }) {
        const course = await CourseRepository.findById(courseId);
        this.assertCourseEligibleForEnrollment(course);

        const existing = await EnrollmentRepository.findExistingEnrollment(
            actorId,
            courseId,
        );
        if (existing) {
            throw new ApiError(409, ENROLLMENT_MESSAGES.ALREADY_ENROLLED);
        }

        const requiresApproval = course.settings?.requiresApproval ?? false;
        const status = requiresApproval
            ? ENROLLMENT_STATUS.PENDING
            : ENROLLMENT_STATUS.APPROVED;

        const data = {
            studentId: actorId,
            courseId,
            status,
        };

        if (status === ENROLLMENT_STATUS.APPROVED) {
            data.approvedAt = new Date();
        }

        try {
            return await EnrollmentRepository.create(data);
        } catch (error) {
            if (error.code === "P2002") {
                throw new ApiError(409, ENROLLMENT_MESSAGES.ALREADY_ENROLLED);
            }
            throw error;
        }
    }

    async approveEnrollment(actorId, enrollmentId) {
        const roles = await this.getActorRoles(actorId);
        const enrollment = await this.getEnrollmentOrThrow(enrollmentId);
        await this.assertCanManage(enrollment, actorId, roles);
        this.assertValidTransition(
            enrollment.status,
            ENROLLMENT_STATUS.APPROVED,
        );
        return EnrollmentRepository.approve(enrollmentId, actorId);
    }

    async rejectEnrollment(actorId, enrollmentId) {
        const roles = await this.getActorRoles(actorId);
        const enrollment = await this.getEnrollmentOrThrow(enrollmentId);
        await this.assertCanManage(enrollment, actorId, roles);
        this.assertValidTransition(
            enrollment.status,
            ENROLLMENT_STATUS.REJECTED,
        );
        return EnrollmentRepository.reject(enrollmentId, actorId);
    }

    async withdrawEnrollment(actorId, enrollmentId) {
        const roles = await this.getActorRoles(actorId);
        const enrollment = await this.getEnrollmentOrThrow(enrollmentId);
        await this.assertCanWithdraw(enrollment, actorId, roles);
        this.assertValidTransition(
            enrollment.status,
            ENROLLMENT_STATUS.WITHDRAWN,
        );
        return EnrollmentRepository.withdraw(enrollmentId, actorId);
    }
}

export default new EnrollmentService();
