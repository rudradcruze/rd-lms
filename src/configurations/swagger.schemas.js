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
 */

export {};
