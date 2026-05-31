import { ApiResponse } from "../../../utils/ApiResponse.js";
import { COURSE_MESSAGES } from "../courses.constants.js";
import CourseService from "../services/courses.service.js";

function getActorId(req) {
    return req.user?.userId ?? null;
}

class CourseController {
    async createCourse(req, res) {
        const course = await CourseService.createCourse(
            req.user.userId,
            req.body,
        );
        return res
            .status(201)
            .json(new ApiResponse(201, course, COURSE_MESSAGES.COURSE_CREATED));
    }

    async listCourses(req, res) {
        const result = await CourseService.listCourses(
            getActorId(req),
            req.query,
        );
        return res
            .status(200)
            .json(
                new ApiResponse(200, result, "Courses retrieved successfully"),
            );
    }

    async getCourseById(req, res) {
        const { courseId } = req.params;
        const course = await CourseService.getCourseById(
            getActorId(req),
            courseId,
        );
        return res
            .status(200)
            .json(
                new ApiResponse(200, course, "Course retrieved successfully"),
            );
    }

    async updateCourse(req, res) {
        const { courseId } = req.params;
        const course = await CourseService.updateCourse(
            req.user.userId,
            courseId,
            req.body,
        );
        return res
            .status(200)
            .json(new ApiResponse(200, course, COURSE_MESSAGES.COURSE_UPDATED));
    }

    async publishCourse(req, res) {
        const { courseId } = req.params;
        const course = await CourseService.publishCourse(
            req.user.userId,
            courseId,
        );
        return res
            .status(200)
            .json(
                new ApiResponse(200, course, COURSE_MESSAGES.COURSE_PUBLISHED),
            );
    }

    async archiveCourse(req, res) {
        const { courseId } = req.params;
        const course = await CourseService.archiveCourse(
            req.user.userId,
            courseId,
        );
        return res
            .status(200)
            .json(
                new ApiResponse(200, course, COURSE_MESSAGES.COURSE_ARCHIVED),
            );
    }

    async deleteCourse(req, res) {
        const { courseId } = req.params;
        await CourseService.deleteCourse(req.user.userId, courseId);
        return res
            .status(200)
            .json(new ApiResponse(200, null, COURSE_MESSAGES.COURSE_DELETED));
    }

    async assignInstructor(req, res) {
        const { courseId } = req.params;
        const { userId, isPrimary = false } = req.body;
        const assignment = await CourseService.assignInstructor(
            req.user.userId,
            courseId,
            userId,
            isPrimary,
        );
        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    assignment,
                    COURSE_MESSAGES.INSTRUCTOR_ASSIGNED,
                ),
            );
    }

    async removeInstructor(req, res) {
        const { courseId, userId } = req.params;
        await CourseService.removeInstructor(req.user.userId, courseId, userId);
        return res
            .status(200)
            .json(
                new ApiResponse(200, null, COURSE_MESSAGES.INSTRUCTOR_REMOVED),
            );
    }

    async getCourseInstructors(req, res) {
        const { courseId } = req.params;
        const result = await CourseService.getCourseInstructors(
            getActorId(req),
            courseId,
        );
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    result,
                    "Course instructors retrieved successfully",
                ),
            );
    }

    async listCategories(req, res) {
        const result = await CourseService.listCategories();
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    result,
                    "Course categories retrieved successfully",
                ),
            );
    }

    async createCategory(req, res) {
        const category = await CourseService.createCategory(
            req.user.userId,
            req.body,
        );
        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    category,
                    COURSE_MESSAGES.CATEGORY_CREATED,
                ),
            );
    }
}

export default new CourseController();
