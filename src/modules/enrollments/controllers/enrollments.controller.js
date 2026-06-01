import { ApiResponse } from "../../../utils/ApiResponse.js";
import { ENROLLMENT_MESSAGES } from "../enrollments.constants.js";
import EnrollmentService from "../services/enrollments.service.js";

class EnrollmentController {
    async createEnrollment(req, res) {
        const enrollment = await EnrollmentService.createEnrollment(
            req.user.userId,
            req.body,
        );
        return res
            .status(201)
            .json(
                new ApiResponse(201, enrollment, ENROLLMENT_MESSAGES.CREATED),
            );
    }

    async listEnrollments(req, res) {
        const result = await EnrollmentService.listEnrollments(
            req.user.userId,
            req.query,
        );
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    result,
                    ENROLLMENT_MESSAGES.LIST_RETRIEVED,
                ),
            );
    }

    async getMyEnrollments(req, res) {
        const result = await EnrollmentService.getMyEnrollments(
            req.user.userId,
            req.query,
        );
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    result,
                    ENROLLMENT_MESSAGES.LIST_RETRIEVED,
                ),
            );
    }

    async getEnrollmentHistory(req, res) {
        const result = await EnrollmentService.getEnrollmentHistory(
            req.user.userId,
            req.query,
        );
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    result,
                    ENROLLMENT_MESSAGES.LIST_RETRIEVED,
                ),
            );
    }

    async getEnrollmentById(req, res) {
        const { enrollmentId } = req.params;
        const enrollment = await EnrollmentService.getEnrollmentById(
            req.user.userId,
            enrollmentId,
        );
        return res
            .status(200)
            .json(
                new ApiResponse(200, enrollment, ENROLLMENT_MESSAGES.RETRIEVED),
            );
    }

    async approveEnrollment(req, res) {
        const { enrollmentId } = req.params;
        const enrollment = await EnrollmentService.approveEnrollment(
            req.user.userId,
            enrollmentId,
        );
        return res
            .status(200)
            .json(
                new ApiResponse(200, enrollment, ENROLLMENT_MESSAGES.APPROVED),
            );
    }

    async rejectEnrollment(req, res) {
        const { enrollmentId } = req.params;
        const enrollment = await EnrollmentService.rejectEnrollment(
            req.user.userId,
            enrollmentId,
        );
        return res
            .status(200)
            .json(
                new ApiResponse(200, enrollment, ENROLLMENT_MESSAGES.REJECTED),
            );
    }

    async withdrawEnrollment(req, res) {
        const { enrollmentId } = req.params;
        const enrollment = await EnrollmentService.withdrawEnrollment(
            req.user.userId,
            enrollmentId,
        );
        return res
            .status(200)
            .json(
                new ApiResponse(200, enrollment, ENROLLMENT_MESSAGES.WITHDRAWN),
            );
    }
}

export default new EnrollmentController();
