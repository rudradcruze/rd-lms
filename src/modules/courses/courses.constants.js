export const COURSE_STATUS = {
    DRAFT: "DRAFT",
    PUBLISHED: "PUBLISHED",
    ARCHIVED: "ARCHIVED",
};

export const DEFAULT_COURSE_SETTINGS = {
    allowSelfEnrollment: true,
    requiresApproval: false,
    showInCatalog: true,
    enableDiscussions: true,
};

export const COURSE_MESSAGES = {
    COURSE_CREATED: "Course created successfully",
    COURSE_UPDATED: "Course updated successfully",
    COURSE_PUBLISHED: "Course published successfully",
    COURSE_ARCHIVED: "Course archived successfully",
    COURSE_DELETED: "Course deleted successfully",
    COURSE_NOT_FOUND: "Course not found",
    CATEGORY_NOT_FOUND: "Course category not found",
    CATEGORY_CREATED: "Course category created successfully",
    SLUG_TAKEN: "A course with this slug already exists",
    NOT_OWNER: "You do not have permission to modify this course",
    ADMIN_ONLY: "This action requires administrator privileges",
    PUBLISH_REQUIREMENTS:
        "Course must have a title, description, category, and at least one instructor before publishing",
    INSTRUCTOR_ASSIGNED: "Instructor assigned successfully",
    INSTRUCTOR_REMOVED: "Instructor removed successfully",
    INSTRUCTOR_ALREADY_ASSIGNED:
        "Instructor is already assigned to this course",
    INSTRUCTOR_NOT_FOUND: "Instructor assignment not found",
    INVALID_INSTRUCTOR: "User must have the instructor role to be assigned",
    USER_NOT_FOUND: "User not found",
    CATEGORY_NAME_TAKEN: "A category with this name already exists",
    CANNOT_REMOVE_PRIMARY:
        "Cannot remove the primary instructor. Assign another primary instructor first",
};
