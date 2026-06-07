/**
 * Shared OpenAPI component schemas for Swagger UI.
 * Referenced from route JSDoc via $ref: '#/components/schemas/<Name>'.
 *
 * @swagger
 * components:
 *   tags:
 *     - name: Authentication
 *       description: Registration, login, tokens, and session management
 *     - name: Users
 *       description: User administration and RBAC overrides
 *     - name: Roles
 *       description: Role CRUD and role-permission assignment
 *     - name: Permissions
 *       description: Permission CRUD
 *     - name: Courses
 *       description: Course lifecycle, categories, and instructors (BR-02)
 *   schemas:
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         statusCode:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: Operation completed successfully.
 *         data:
 *           nullable: true
 *     ApiError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         statusCode:
 *           type: integer
 *           example: 400
 *         message:
 *           type: string
 *           example: Validation failed
 *         errors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ValidationErrorItem'
 *     ValidationErrorItem:
 *       type: object
 *       properties:
 *         field:
 *           type: string
 *           example: email
 *         message:
 *           type: string
 *           example: Please provide a valid email address
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         total:
 *           type: integer
 *           example: 42
 *         totalPages:
 *           type: integer
 *           example: 5
 *         hasNextPage:
 *           type: boolean
 *           example: true
 *         hasPrevPage:
 *           type: boolean
 *           example: false
 *     UserInfo:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *     RoleSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         name:
 *           type: string
 *           example: Instructor
 *         key:
 *           type: string
 *           example: instructor
 *         description:
 *           type: string
 *           nullable: true
 *     UserRoleAssignment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         roleId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         role:
 *           $ref: '#/components/schemas/RoleSummary'
 *         createdAt:
 *           type: string
 *           format: date-time
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         username:
 *           type: string
 *           example: johndoe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         isActive:
 *           type: boolean
 *           example: true
 *         isBlocked:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         userInfo:
 *           $ref: '#/components/schemas/UserInfo'
 *         userRoles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserRoleAssignment'
 *     UserListData:
 *       allOf:
 *         - $ref: '#/components/schemas/PaginationMeta'
 *         - type: object
 *           properties:
 *             users:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         key:
 *           type: string
 *           example: instructor
 *         name:
 *           type: string
 *           example: Instructor
 *         description:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         rolePermissions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 format: int64
 *                 example: 1
 *               permissionId:
 *                 type: integer
 *                 format: int64
 *                 example: 1
 *               permission:
 *                 $ref: '#/components/schemas/Permission'
 *     RoleListData:
 *       allOf:
 *         - $ref: '#/components/schemas/PaginationMeta'
 *         - type: object
 *           properties:
 *             roles:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 *     Permission:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         key:
 *           type: string
 *           example: courses.read
 *         name:
 *           type: string
 *           example: Read Courses
 *         resource:
 *           type: string
 *           example: courses
 *         action:
 *           type: string
 *           example: read
 *         description:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     PermissionListData:
 *       allOf:
 *         - $ref: '#/components/schemas/PaginationMeta'
 *         - type: object
 *           properties:
 *             permissions:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Permission'
 *     ResolvedPermissions:
 *       type: object
 *       properties:
 *         isSuperAdmin:
 *           type: boolean
 *           example: false
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           example: [courses.read, courses.create]
 *         permissionMap:
 *           type: object
 *           additionalProperties:
 *             type: boolean
 *     OnboardUserRequest:
 *       type: object
 *       required: [username, email, pass, firstname, lastname, role]
 *       properties:
 *         username:
 *           type: string
 *           minLength: 4
 *           maxLength: 16
 *         email:
 *           type: string
 *           format: email
 *         pass:
 *           type: string
 *           minLength: 8
 *         firstname:
 *           type: string
 *         lastname:
 *           type: string
 *         role:
 *           type: string
 *           description: Role key (not super_admin)
 *           example: instructor
 *     CreateRoleRequest:
 *       type: object
 *       required: [key, name]
 *       properties:
 *         key:
 *           type: string
 *           pattern: '^[a-z_]+$'
 *           example: content_manager
 *         name:
 *           type: string
 *           example: Content Manager
 *         description:
 *           type: string
 *     UpdateRoleRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *     CreatePermissionRequest:
 *       type: object
 *       required: [key, name, resource, action]
 *       properties:
 *         key:
 *           type: string
 *           example: courses.read
 *         name:
 *           type: string
 *           example: Read Courses
 *         resource:
 *           type: string
 *           example: courses
 *         action:
 *           type: string
 *           example: read
 *         description:
 *           type: string
 *     CourseStatus:
 *       type: string
 *       enum: [DRAFT, PUBLISHED, ARCHIVED]
 *       example: DRAFT
 *     CourseCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         name:
 *           type: string
 *           example: Programming
 *         description:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CourseSettings:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         allowSelfEnrollment:
 *           type: boolean
 *           example: true
 *         requiresApproval:
 *           type: boolean
 *           example: false
 *         showInCatalog:
 *           type: boolean
 *           example: true
 *         enableDiscussions:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CourseInstructorUser:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         username:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         userInfo:
 *           $ref: '#/components/schemas/UserInfo'
 *     CourseInstructor:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         isPrimary:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         user:
 *           $ref: '#/components/schemas/CourseInstructorUser'
 *     CourseCreator:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         username:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         userInfo:
 *           $ref: '#/components/schemas/UserInfo'
 *     Course:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         title:
 *           type: string
 *           example: Introduction to JavaScript
 *         slug:
 *           type: string
 *           example: introduction-to-javascript
 *         shortDescription:
 *           type: string
 *           nullable: true
 *         description:
 *           type: string
 *           nullable: true
 *         thumbnailUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         status:
 *           $ref: '#/components/schemas/CourseStatus'
 *         categoryId:
 *           type: integer
 *           format: int64
 *           example: 1
 *           nullable: true
 *         createdById:
 *           type: integer
 *           format: int64
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         category:
 *           $ref: '#/components/schemas/CourseCategory'
 *         settings:
 *           $ref: '#/components/schemas/CourseSettings'
 *         creator:
 *           $ref: '#/components/schemas/CourseCreator'
 *         instructors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CourseInstructor'
 *     CourseListData:
 *       allOf:
 *         - $ref: '#/components/schemas/PaginationMeta'
 *         - type: object
 *           properties:
 *             courses:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 *     CategoryListData:
 *       type: object
 *       properties:
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CourseCategory'
 *     InstructorListData:
 *       type: object
 *       properties:
 *         instructors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CourseInstructor'
 *     CreateCourseRequest:
 *       type: object
 *       required: [title]
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *         slug:
 *           type: string
 *         shortDescription:
 *           type: string
 *         description:
 *           type: string
 *           maxLength: 10000
 *         thumbnailUrl:
 *           type: string
 *           format: uri
 *         categoryId:
 *           type: integer
 *           format: int64
 *           example: 1
 *     UpdateCourseRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *         slug:
 *           type: string
 *         shortDescription:
 *           type: string
 *         description:
 *           type: string
 *           maxLength: 10000
 *         thumbnailUrl:
 *           type: string
 *           format: uri
 *         categoryId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         settings:
 *           type: object
 *           properties:
 *             allowSelfEnrollment:
 *               type: boolean
 *             requiresApproval:
 *               type: boolean
 *             showInCatalog:
 *               type: boolean
 *             enableDiscussions:
 *               type: boolean
 *     CreateCategoryRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
 *           type: string
 *           example: Programming
 *         description:
 *           type: string
 *     AssignInstructorRequest:
 *       type: object
 *       required: [userId]
 *       properties:
 *         userId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         isPrimary:
 *           type: boolean
 *           default: false
 *     EnrollmentStatus:
 *       type: string
 *       enum: [PENDING, APPROVED, REJECTED, WITHDRAWN]
 *       example: PENDING
 *     EnrollmentUserSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         username:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         userInfo:
 *           $ref: '#/components/schemas/UserInfo'
 *     EnrollmentCourseSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         title:
 *           type: string
 *         slug:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/CourseStatus'
 *     Enrollment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         studentId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         courseId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         status:
 *           $ref: '#/components/schemas/EnrollmentStatus'
 *         approvedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         approvedById:
 *           type: integer
 *           format: int64
 *           nullable: true
 *         rejectedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         rejectedById:
 *           type: integer
 *           format: int64
 *           nullable: true
 *         withdrawnAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         withdrawnById:
 *           type: integer
 *           format: int64
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         student:
 *           $ref: '#/components/schemas/EnrollmentUserSummary'
 *         course:
 *           $ref: '#/components/schemas/EnrollmentCourseSummary'
 *         approvedBy:
 *           $ref: '#/components/schemas/EnrollmentUserSummary'
 *         rejectedBy:
 *           $ref: '#/components/schemas/EnrollmentUserSummary'
 *         withdrawnBy:
 *           $ref: '#/components/schemas/EnrollmentUserSummary'
 *     CreateEnrollmentRequest:
 *       type: object
 *       required: [courseId]
 *       properties:
 *         courseId:
 *           type: integer
 *           format: int64
 *           example: 1
 *     EnrollmentListData:
 *       type: object
 *       properties:
 *         enrollments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Enrollment'
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         total:
 *           type: integer
 *           example: 25
 *         totalPages:
 *           type: integer
 *           example: 3
 *         hasNextPage:
 *           type: boolean
 *         hasPrevPage:
 *           type: boolean
 *     CourseSection:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         courseId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         title:
 *           type: string
 *           example: Module 1 - Introduction
 *         description:
 *           type: string
 *           nullable: true
 *           example: Overview of course goals
 *         position:
 *           type: integer
 *           example: 0
 *         isPublished:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         contents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CourseContent'
 *     CourseContent:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         sectionId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         title:
 *           type: string
 *           example: Welcome Video
 *         description:
 *           type: string
 *           nullable: true
 *           example: Course introduction video
 *         contentType:
 *           type: string
 *           enum: [VIDEO, PDF, NOTE, IMAGE, AUDIO, EXTERNAL_LINK]
 *           example: VIDEO
 *         position:
 *           type: integer
 *           example: 0
 *         isPublished:
 *           type: boolean
 *           example: false
 *         createdById:
 *           type: integer
 *           format: int64
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         assets:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ContentAsset'
 *     ContentAsset:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         contentId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         provider:
 *           type: string
 *           example: cloudinary
 *         publicId:
 *           type: string
 *           nullable: true
 *           example: lms_videos/intro
 *         secureUrl:
 *           type: string
 *           format: uri
 *           example: https://res.cloudinary.com/demo/video/upload/v1/intro.mp4
 *         originalFileName:
 *           type: string
 *           nullable: true
 *           example: welcome.mp4
 *         mimeType:
 *           type: string
 *           nullable: true
 *           example: video/mp4
 *         sizeBytes:
 *           type: integer
 *           format: int64
 *           nullable: true
 *           example: 1548293
 *         durationSeconds:
 *           type: integer
 *           nullable: true
 *           example: 120
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CreateSectionRequest:
 *       type: object
 *       required: [courseId, title]
 *       properties:
 *         courseId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         title:
 *           type: string
 *           example: Module 1 - Getting Started
 *         description:
 *           type: string
 *           example: The basics of the course.
 *         position:
 *           type: integer
 *           example: 0
 *     UpdateSectionRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         position:
 *           type: integer
 *     CreateContentRequest:
 *       type: object
 *       required: [sectionId, title, contentType]
 *       properties:
 *         sectionId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         title:
 *           type: string
 *           example: Welcome Video
 *         description:
 *           type: string
 *           example: Welcome to the course
 *         contentType:
 *           type: string
 *           enum: [VIDEO, PDF, NOTE, IMAGE, AUDIO, EXTERNAL_LINK]
 *           example: VIDEO
 *         position:
 *           type: integer
 *           example: 0
 *         asset:
 *           type: object
 *           properties:
 *             provider:
 *               type: string
 *             publicId:
 *               type: string
 *             secureUrl:
 *               type: string
 *             originalFileName:
 *               type: string
 *             mimeType:
 *               type: string
 *             sizeBytes:
 *               type: integer
 *             durationSeconds:
 *               type: integer
 *     UpdateContentRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         contentType:
 *           type: string
 *           enum: [VIDEO, PDF, NOTE, IMAGE, AUDIO, EXTERNAL_LINK]
 *         position:
 *           type: integer
 *         asset:
 *           type: object
 *           properties:
 *             provider:
 *               type: string
 *             publicId:
 *               type: string
 *             secureUrl:
 *               type: string
 *             originalFileName:
 *               type: string
 *             mimeType:
 *               type: string
 *             sizeBytes:
 *               type: integer
 *             durationSeconds:
 *               type: integer
 *     ReorderContentsRequest:
 *       type: object
 *       required: [sectionId, contentIds]
 *       properties:
 *         sectionId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         contentIds:
 *           type: array
 *           items:
 *             type: integer
 *             format: int64
 *           example: [1, 2, 3]
 *     UploadResult:
 *       type: object
 *       properties:
 *         publicId:
 *           type: string
 *           example: lms_videos/welcome
 *         secureUrl:
 *           type: string
 *           format: uri
 *           example: https://res.cloudinary.com/demo/video/upload/welcome.mp4
 *         metadata:
 *           type: object
 *           properties:
 *             originalFileName:
 *               type: string
 *               example: welcome.mp4
 *             mimeType:
 *               type: string
 *               example: video/mp4
 *             sizeBytes:
 *               type: integer
 *               example: 1249301
 *             durationSeconds:
 *               type: integer
 *               example: 120
 */

export {};
