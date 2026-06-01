export const ENROLLMENT_STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    WITHDRAWN: "WITHDRAWN",
};

export const VALID_TRANSITIONS = {
    [ENROLLMENT_STATUS.PENDING]: [
        ENROLLMENT_STATUS.APPROVED,
        ENROLLMENT_STATUS.REJECTED,
        ENROLLMENT_STATUS.WITHDRAWN,
    ],
    [ENROLLMENT_STATUS.APPROVED]: [ENROLLMENT_STATUS.WITHDRAWN],
    [ENROLLMENT_STATUS.REJECTED]: [],
    [ENROLLMENT_STATUS.WITHDRAWN]: [],
};

export const ENROLLMENT_MESSAGES = {
    CREATED: "Enrollment created successfully",
    LIST_RETRIEVED: "Enrollments retrieved successfully",
    RETRIEVED: "Enrollment retrieved successfully",
    APPROVED: "Enrollment approved successfully",
    REJECTED: "Enrollment rejected successfully",
    WITHDRAWN: "Enrollment withdrawn successfully",
    NOT_FOUND: "Enrollment not found",
    COURSE_NOT_AVAILABLE: "Course is not available for enrollment",
    ALREADY_ENROLLED: "Student already enrolled",
    INVALID_TRANSITION: "Invalid enrollment status transition",
    ACCESS_DENIED: "Access denied",
};
