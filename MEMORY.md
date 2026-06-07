# MEMORY

Last updated: 2026-06-01 (BR-03 enrollments)

## 1) Stack (from `package.json`)

- Runtime: Node.js ESM (`"type": "module"`)
- Web: `express@^5.2.1`, `cors@^2.8.6`, `cookie-parser@^1.4.7`
- Env/config: `dotenv@^17.4.2`
- ORM/DB: `prisma@^6.19.3`, `@prisma/client@^6.19.3`, `pg@^8.20.0`
- Cache/session/rate-limit storage: `redis@^5.12.1`
- Auth/crypto: `jsonwebtoken@^9.0.3`, `bcrypt@^6.0.0`
- Validation: `zod@^4.4.3`
- Logging: `pino@^10.3.1`, `pino-pretty@^13.1.3`
- API docs: `swagger-jsdoc@^6.2.8`, `swagger-ui-express@^5.0.1`
- Testing: `jest@^30.4.2`, `@jest/globals@^30.4.1`, `supertest@^7.2.2`
- Dev tools: `nodemon@^3.1.14`, `prettier@^3.8.3`

Scripts:

- `npm run dev` -> `nodemon -r dotenv/config src/server.js`
- `npm test` -> Jest (ESM, in-band)
- `npm run test:coverage`
- `npm run prisma:migrate`
- `npm run prisma:generate`
- `npm run prisma:deploy`
- `npm run prisma:seed`

## 2) Project Structure

`rd-lms/`

- `src/`
    - `app.js`, `server.js`, `constants.js`
    - `configurations/`
        - `environment.js`, `db.postgres.js`, `db.redis.js`, `logger.js`, `swagger.js`, `swagger.schemas.js`
    - `middlewares/`
        - `authenticate.middleware.js`
        - `authorize.middleware.js`
        - `permission.middleware.js`
        - `validate.middleware.js`
        - `rateLimit.middleware.js`
        - `error.middleware.js`
    - `routes/index.js`
    - `utils/`
        - `ApiError.js`, `ApiResponse.js`, `asyncHandler.js`
        - `generateTokens.js`, `password.js`, `pagination.js`, `dateTime.js`
        - `serializeBigInt.js`, `validationSchemas.js`
    - `modules/`
        - `auth/` -> constants, routes, schemas, controller, service, refresh-token repo, tokenSession utils
        - `users/` -> constants, routes, schemas, controller, service, repository
        - `roles/` -> constants, routes, schemas, controller, service, repository
        - `permissions/` -> constants, routes, schemas, controller, service, resolver service, repository
        - `courses/` -> constants, routes, schemas, controller, service, repository
        - `enrollments/` -> constants, routes, schemas, controller, service, repository
- `prisma/`
    - `schema.prisma`
    - `seed.js`
    - `migrations/` (fresh `init_bigint_identifiers` migration + lock)
- `tests/`
    - `helpers/setup.js`
    - `auth.test.js`, `roles.test.js`, `users.test.js`, `permissions.test.js`, `courses.test.js`, `enrollments.test.js`
- Root config/docs:
    - `README.md`, `.env.example`, `jest.config.js`, `.prettierrc`, `.prettierignore`, `.gitignore`
    - `package.json`, `package-lock.json`

⚠️ `.DS_Store` exists at repo root and is untracked.

## 3) Database Models / Schema (`prisma/schema.prisma`)

### `User` (`users`)

- `id` BigInt PK (autoincrement)
- `username` varchar(16), unique
- `email` unique
- `passwordHash` mapped `password_hash`
- `isActive` bool default true mapped `is_active`
- `isBlocked` bool default false mapped `is_blocked`
- timestamps: `createdAt`, `updatedAt`
- relations:
    - one-to-many `refreshTokens`
    - many-to-many via join `userRoles` <-> `Role`
    - many-to-many override via join `userPermissions` <-> `Permission`
    - one-to-one optional `userInfo`
    - one-to-many `createdCourses` (as creator)
    - one-to-many `courseInstructors`
    - one-to-many `enrollmentsAsStudent`, `enrollmentsApproved`, `enrollmentsRejected`, `enrollmentsWithdrawn`
    - one-to-many `createdContents` (CourseContent)

### `UserInfo` (`user_info`)

- `id` BigInt PK (autoincrement)
- `userId` BigInt unique FK -> `users.id` (cascade)
- `firstName`, `lastName`
- timestamps

### `RefreshToken` (`refresh_tokens`)

- `id` BigInt PK (autoincrement)
- `userId` BigInt FK -> `users.id` (cascade)
- `tokenHash` unique
- `expiresAt`
- `blacklistedAt` nullable
- timestamps

### `Role` (`roles`)

- `id` BigInt PK (autoincrement)
- `name` unique
- `key` unique
- `description` nullable
- timestamps
- relations: `userRoles`, `rolePermissions`

### `Permission` (`permissions`)

- `id` BigInt PK (autoincrement)
- `name` unique
- `key` unique
- `resource`, `action`
- `description` nullable
- timestamps
- relations: `rolePermissions`, `userPermissions`

### `UserRole` (`user_roles`)

- `id` BigInt PK (autoincrement)
- `userId` BigInt FK -> `users.id` (cascade)
- `roleId` BigInt FK -> `roles.id` (cascade)
- timestamps
- unique composite: `(userId, roleId)` (`unique_user_role`)

### `RolePermission` (`role_permissions`)

- `id` BigInt PK (autoincrement)
- `roleId` BigInt FK -> `roles.id` (cascade)
- `permissionId` BigInt FK -> `permissions.id` (cascade)
- timestamps
- unique composite: `(roleId, permissionId)` (`unique_role_permission`)

### `UserPermission` (`user_permissions`)

- `id` BigInt PK (autoincrement)
- `userId` BigInt FK -> `users.id` (cascade)
- `permissionId` BigInt FK -> `permissions.id` (cascade)
- `allowed` bool default true
- timestamps
- unique composite: `(userId, permissionId)` (`unique_user_permission`)

### `CourseCategory` (`course_categories`)

- `id` BigInt PK (autoincrement)
- `name` unique
- `description` nullable
- timestamps
- relations: one-to-many `courses`

### `Course` (`courses`)

- `id` BigInt PK (autoincrement)
- `title`, `slug` unique
- `shortDescription`, `description`, `thumbnailUrl` nullable
- `status` enum `CourseStatus` (`DRAFT`, `PUBLISHED`, `ARCHIVED`) default `DRAFT`
- `categoryId` nullable BigInt FK -> `course_categories.id` (set null on delete)
- `createdById` BigInt FK -> `users.id` (restrict)
- `deletedAt` nullable (soft delete)
- timestamps
- indexes: `status`, `categoryId`
- relations: `category`, `creator`, `instructors`, `settings`, `enrollments`, `sections`

### `CourseInstructor` (`course_instructors`)

- `id` BigInt PK (autoincrement)
- `courseId` BigInt FK -> `courses.id` (cascade)
- `userId` BigInt FK -> `users.id` (cascade)
- `isPrimary` bool default false
- `createdAt`
- unique composite: `(courseId, userId)` (`unique_course_instructor`)

### `CourseSettings` (`course_settings`)

- `id` BigInt PK (autoincrement)
- `courseId` BigInt unique FK -> `courses.id` (cascade)
- `allowSelfEnrollment` bool default true
- `requiresApproval` bool default false
- `showInCatalog` bool default true
- `enableDiscussions` bool default true
- timestamps

### `Enrollment` (`enrollments`) — BR-03

- `id` BigInt PK (autoincrement)
- `studentId` BigInt FK -> `users.id` (restrict)
- `courseId` BigInt FK -> `courses.id` (restrict)
- `status` enum `EnrollmentStatus` (`PENDING`, `APPROVED`, `REJECTED`, `WITHDRAWN`)
- audit: `approvedAt`, `approvedById`, `rejectedAt`, `rejectedById`, `withdrawnAt`, `withdrawnById` (nullable)
- timestamps: `createdAt`, `updatedAt`
- unique composite: `(studentId, courseId)` — permanent record; no delete API
- indexes: `studentId`, `courseId`, `status`
- relations: `student`, `course`, `approvedBy`, `rejectedBy`, `withdrawnBy` (User)

Status transitions (service-enforced):

- `PENDING` -> `APPROVED` | `REJECTED` | `WITHDRAWN`
- `APPROVED` -> `WITHDRAWN`
- terminal: `REJECTED`, `WITHDRAWN`

### `CourseSection` (`course_sections`) — BR-04

- `id` BigInt PK (autoincrement)
- `courseId` BigInt FK -> `courses.id` (cascade)
- `title` String
- `description` String?
- `position` Int
- `isPublished` Boolean default false mapped `is_published`
- timestamps: `createdAt`, `updatedAt`
- indexes: `courseId`
- relations: `course`, `contents` (CourseContent[])

### `CourseContent` (`course_contents`) — BR-04

- `id` BigInt PK (autoincrement)
- `sectionId` BigInt FK -> `course_sections.id` (cascade)
- `title` String
- `description` String?
- `contentType` enum `ContentType` (`VIDEO`, `PDF`, `NOTE`, `IMAGE`, `AUDIO`, `EXTERNAL_LINK`) mapped `content_type`
- `position` Int
- `isPublished` Boolean default false mapped `is_published`
- `createdById` BigInt FK -> `users.id` (restrict)
- timestamps: `createdAt`, `updatedAt`
- indexes: `sectionId`
- relations: `section` (CourseSection), `assets` (ContentAsset[]), `creator` (User)

### `ContentAsset` (`content_assets`) — BR-04

- `id` BigInt PK (autoincrement)
- `contentId` BigInt FK -> `course_contents.id` (cascade)
- `provider` String (e.g. "cloudinary")
- `publicId` String? mapped `public_id`
- `secureUrl` String mapped `secure_url`
- `originalFileName` String? mapped `original_file_name`
- `mimeType` String? mapped `mime_type`
- `sizeBytes` BigInt? mapped `size_bytes`
- `durationSeconds` Int? mapped `duration_seconds`
- timestamp: `createdAt`
- indexes: `contentId`
- relations: `content` (CourseContent)

Soft delete:

- `Course.deletedAt` — soft-deleted courses hidden from normal queries; ineligible for enrollment.
- Token invalidation is logical via `refresh_tokens.blacklisted_at`.
- Enrollment rows are never hard- or soft-deleted.

## 4) API Route Inventory (actual code)

Base prefix: `/api/v1`

### Auth routes (`src/modules/auth/routes/auth.routes.js`)

- `POST /auth/register`
    - Middleware: `registerLimiter -> validate(registerSchema) -> asyncHandler`
    - Access: public
- `POST /auth/login`
    - Middleware: `loginLimiter -> validate(loginSchema) -> asyncHandler`
    - Access: public
- `POST /auth/refresh`
    - Middleware: `validate(refreshTokenSchema) -> asyncHandler`
    - Access: public
- `POST /auth/access`
    - Middleware: `validate(refreshTokenSchema) -> asyncHandler`
    - Access: public
- `POST /auth/logout`
    - Middleware: `authenticate -> validate(logoutSchema) -> asyncHandler`
    - Access: authenticated
- `POST /auth/change-password`
    - Middleware: `authenticate -> passwordLimiter -> validate(changePasswordSchema) -> asyncHandler`
    - Access: authenticated
- `GET /auth/check-availability`
    - Middleware: `validate(checkAvailabilitySchema) -> asyncHandler`
    - Access: public

### Role routes (`src/modules/roles/routes/role.routes.js`)

- Router-level: `router.use(authenticate)`
- `POST /roles` -> `authorize(["super_admin"]) -> validate(createRoleSchema)`
- `GET /roles` -> authenticated only
- `GET /roles/:roleId` -> authenticated only
- `PUT /roles/:roleId` -> `authorize(["super_admin"]) -> validate(updateRoleSchema)`
- `DELETE /roles/:roleId` -> `authorize(["super_admin"])`
- `POST /roles/:roleId/permissions` -> `authorize(["super_admin"]) -> validate(assignPermissionSchema)`
- `DELETE /roles/:roleId/permissions/:permissionId` -> `authorize(["super_admin"])`

### Permission routes (`src/modules/permissions/routes/permission.routes.js`)

- Router-level: `router.use(authenticate)`
- `POST /permissions` -> `authorize(["super_admin"]) -> validate(createPermissionSchema)`
- `GET /permissions` -> authenticated only
- `GET /permissions/:permissionId` -> authenticated only
- `PUT /permissions/:permissionId` -> `authorize(["super_admin"]) -> validate(updatePermissionSchema)`
- `DELETE /permissions/:permissionId` -> `authorize(["super_admin"])`

### User routes (`src/modules/users/routes/user.routes.js`)

- Router-level: `router.use(authenticate)`
- `GET /users` -> `authorize(["admin","super_admin"])`
- `POST /users` -> `permission(["users.create"]) -> validate(onboardUserSchema)`
- `GET /users/me` -> authenticated only (current user profile: id, username, email, roles, userInfo)
- `GET /users/by-email` -> `authorize(["admin","super_admin"]) -> validate(getUserByEmailSchema)` (query `email`)
- `GET /users/:userId` -> `authorize(["admin","super_admin"])` (includes email in response)
- `PATCH /users/:userId/block` -> `authorize(["admin","super_admin"])`
- `PATCH /users/:userId/unblock` -> `authorize(["admin","super_admin"])`
- `PATCH /users/:userId/activate` -> `authorize(["admin","super_admin"])`
- `PATCH /users/:userId/deactivate` -> `authorize(["admin","super_admin"])`
- `POST /users/:userId/roles` -> `authorize(["super_admin"]) -> validate(assignRoleSchema)`
- `DELETE /users/:userId/roles/:roleId` -> `authorize(["super_admin"])`
- `POST /users/:userId/permissions` -> `authorize(["super_admin"]) -> validate(grantPermissionSchema)`
- `POST /users/:userId/permissions/:permissionId/deny` -> `authorize(["super_admin"])`
- `DELETE /users/:userId/permissions/:permissionId` -> `authorize(["super_admin"])`
- `GET /users/:userId/permissions` -> `authorize(["admin","super_admin"])`

### Course routes (`src/modules/courses/routes/courses.routes.js`)

- Public (no auth):
    - `GET /courses/categories`
    - `GET /courses` (optional auth — admins see all statuses when authenticated)
    - `GET /courses/:courseId` (optional auth — public sees published only)
    - `GET /courses/:courseId/instructors` (optional auth — public sees published only)
- Router-level `authenticate` applies to all mutating routes below
- `POST /courses/categories` -> `authorize(["admin","super_admin"]) -> validate(createCategorySchema)`
- `POST /courses` -> `permission(["courses.create"]) -> validate(createCourseSchema)`
- `GET /courses` -> public; optional auth elevates admin visibility
- `GET /courses/:courseId` -> public; optional auth elevates admin visibility
- `PATCH /courses/:courseId` -> `permission(["courses.update"]) -> validate(updateCourseSchema)`
- `PATCH /courses/:courseId/publish` -> `permission(["courses.publish"])`
- `PATCH /courses/:courseId/archive` -> `permission(["courses.publish"])`
- `DELETE /courses/:courseId` -> `permission(["courses.delete"])`
- `POST /courses/:courseId/instructors` -> `permission(["courses.update"]) -> validate(assignInstructorSchema)`
- `DELETE /courses/:courseId/instructors/:userId` -> `permission(["courses.update"])`
- `GET /courses/:courseId/instructors` -> public; optional auth elevates admin visibility

Service-level access rules (courses):

- Unauthenticated/public: list/get only `PUBLISHED`, non-deleted courses and their instructors.
- Authenticated non-admin: same as public for read endpoints.
- Update/publish: primary instructor OR admin/super_admin.
- Archive/delete/assign instructors: admin/super_admin only.

### Enrollment routes (`src/modules/enrollments/routes/enrollments.routes.js`)

- Router-level: `router.use(authenticate)`
- `POST /enrollments` -> `permission(["enrollments.read"]) -> validate(createEnrollmentSchema)` — student self-enroll (`body.courseId`); auto `APPROVED` or `PENDING` from `course.settings.requiresApproval`
- `GET /enrollments` -> `permission(["enrollments.read"]) -> validate(listEnrollmentsSchema)` — list (scoped: student own, instructor owned courses, admin all); filters: `status`, `courseId`, `studentId`, `dateFrom`, `dateTo`, pagination
- `GET /enrollments/my` -> `permission(["enrollments.read"])` — student active (`PENDING`, `APPROVED`)
- `GET /enrollments/history` -> `permission(["enrollments.read"])` — student history (`APPROVED`, `REJECTED`, `WITHDRAWN`)
- `GET /enrollments/:enrollmentId` -> `permission(["enrollments.read"]) -> validate(enrollmentIdParamSchema)` — detail with visibility rules
- `PATCH /enrollments/:enrollmentId/approve` -> `permission(["enrollments.manage"])` — instructor (course `CourseInstructor`) or admin/super_admin
- `PATCH /enrollments/:enrollmentId/reject` -> `permission(["enrollments.manage"])` — same as approve
- `PATCH /enrollments/:enrollmentId/withdraw` -> `permission(["enrollments.read"])` — student own or admin/super_admin

Service-level enrollment rules:

- Eligible course: exists, `PUBLISHED`, not `ARCHIVED`, `deletedAt` null — else `400` "Course is not available for enrollment"
- Duplicate `(studentId, courseId)` -> `409` "Student already enrolled"
- Invalid status transition -> `400` "Invalid enrollment status transition"
- Visibility/manage denial -> `403` "Access denied"

### Content routes (`src/modules/content/routes/content.routes.js`) — BR-04

- Router-level: `router.use(authenticate)`
- `POST /content/sections` -> `permission(["content.create"]) -> validate(createSectionSchema)` — create section in a course
- `GET /content/sections/:sectionId` -> `permission(["content.read"]) -> validate(sectionIdParamSchema)` — get section details (with visibility checks: enrolled/published)
- `PATCH /content/sections/:sectionId` -> `permission(["content.update"]) -> validate(updateSectionSchema)` — update section metadata
- `DELETE /content/sections/:sectionId` -> `permission(["content.delete"]) -> validate(sectionIdParamSchema)` — delete section (cascades contents)
- `PATCH /content/sections/:sectionId/reorder` -> `permission(["content.update"]) -> validate(reorderSectionSchema)` — change section position relative to other sections in the course
- `PATCH /content/sections/:sectionId/publish` -> `permission(["content.publish"]) -> validate(sectionIdParamSchema)` — publish/unpublish section
- `POST /content/contents` -> `permission(["content.create"]) -> validate(createContentSchema)` — create content item under a section
- `GET /content/contents/:contentId` -> `permission(["content.read"]) -> validate(contentIdParamSchema)` — get content details + asset metadata (with visibility checks)
- `PATCH /content/contents/:contentId` -> `permission(["content.update"]) -> validate(updateContentSchema)` — update content metadata/assets
- `DELETE /content/contents/:contentId` -> `permission(["content.delete"]) -> validate(contentIdParamSchema)` — delete content item and assets
- `PATCH /content/contents/reorder` -> `permission(["content.update"]) -> validate(reorderContentsSchema)` — reorder multiple content items inside a section
- `PATCH /content/contents/:contentId/publish` -> `permission(["content.publish"]) -> validate(contentIdParamSchema)` — publish/unpublish content
- `POST /content/contents/upload` -> `permission(["content.create"]) -> validate(uploadContentSchema)` — upload media file and auto-create course content item

Service-level content rules:

- Visibility: Student can only view section or content if enrolled (Approved) in the course, and course is `PUBLISHED`, section is published, and content is published. Instructors/Admins bypass visibility checks for courses they own/manage.
- Course / content ownership: Mutation requires admin/super_admin or instructor of the course.
- No local files saved: Uploads stream directly to Cloudinary using `multer.memoryStorage()`.

## 5) Auth System (JWT/session)

Token generation (`src/utils/generateTokens.js`):

- Access payload: `{ userId, jti, tv }`
    - `tv` = access token version from Redis (`tokenSession.getAccessTokenVersion`)
    - Expiry: `15m`
- Refresh payload: `{ userId, jti }`
    - Expiry: `7d`

Authentication middleware (`authenticate.middleware.js`):

- Reads `Authorization: Bearer <accessToken>`
- Verifies JWT signature
- Compares decoded `tv` to current Redis version; mismatch -> revoked
- Sets:
    - `req.user = { userId, iat, exp }`

Refresh/session rotation:

- Refresh tokens are stored hashed (`sha256`) in DB table `refresh_tokens`.
- Redis cache key pattern:
    - `refresh:${userId}:${tokenHash}` for quick validation
    - `user:${userId}:refreshes` set for bulk revocation
- `/auth/refresh` rotates refresh token (old invalidated in Redis + DB, new stored).
- `/auth/access` does not rotate refresh token (access-only issuance).
- `logout` and `changePassword` invalidate all refresh tokens + increment access token version.

## 6) Roles & Permissions

Role keys seen in code/seeding:

- `super_admin`
- `admin`
- `instructor`
- `student`

`authorize(requiredRoles)` (`authorize.middleware.js`):

- Fetches user via `UserRepository.findById`
- Extracts `user.userRoles[].role.key`
- Grants if user has any required role
- If no `requiredRoles`, passes through

`permission(requiredPermissions, requireAll=true)` (`permission.middleware.js`):

- Uses `PermissionResolverService.hasAllPermissions` or `.hasAnyPermission`
- Default requires all

Permission resolution priority (`permissionResolver.service.js`):

1. `super_admin` role -> all permissions true
2. explicit user deny (`user_permissions.allowed=false`)
3. explicit user allow (`user_permissions.allowed=true`)
4. role-derived permissions

Course permission role mappings (seed):

- `super_admin`: all (including `courses.*`)
- `admin`: all 5 course keys (`read`, `create`, `update`, `delete`, `publish`)
- `instructor`: `read`, `create`, `update`, `publish` (no `delete`)
- `student`: `read` only

Enrollment permission role mappings (seed, BR-03):

- `super_admin`: all
- `admin`: `enrollments.read`, `enrollments.manage`
- `instructor`: `enrollments.read`, `enrollments.manage`
- `student`: `enrollments.read`

Learning Content permission role mappings (seed, BR-04):

- `super_admin`: all
- `admin`: `content.read`, `content.create`, `content.update`, `content.delete`, `content.publish`
- `instructor`: `content.read`, `content.create`, `content.update`, `content.delete`, `content.publish`
- `student`: `content.read`

## 7) Response Envelope

Success (`ApiResponse`):

- JSON fields: `statusCode`, `data`, `message`, `success`
- `success = statusCode < 400`
- Global `serializeBigInt` middleware in `app.js` converts all `BigInt` values in JSON responses to strings (controllers must not convert IDs manually).

Error (`error.middleware.js` + `ApiError`):

- JSON fields: `success`, `statusCode`, `message`, `errors`
- In development only: includes `stack`
- Unknown errors are wrapped into `ApiError` with status fallback and message fallback.

## 8) Middleware Inventory

- `authenticate(req,res,next)`  
  Verifies access token + token version; sets `req.user`.
- `authorize(requiredRoles)(req,res,next)`  
  Role-based guard using user role keys.
- `permission(requiredPermissions, requireAll=true)(req,res,next)`  
  Permission-based guard via resolved permission map.
- `validate(schema)(req,res,next)`  
  Zod validation over `body/query/params`; attaches `req.validatedData`; throws `ApiError(400)` on issues.
- `rateLimiter(options)(req,res,next)`  
  Redis `INCR`/`EXPIRE` limiter with `X-RateLimit-*` headers; bypass in `test` and `development`.
- `errorMiddleware(err,req,res,next)`  
  Global error serialization/logging.

## 9) Error Handling Pattern

- Service layer throws `new ApiError(status, message[, errors])`.
- Route handlers are wrapped with `asyncHandler` to forward promise rejections.
- App-level 404 fallback:
    - `next(new ApiError(404, \`Cannot ${req.method} ${req.originalUrl} - Route not found\`))`
- Global middleware maps to standardized JSON error shape.

## 10) Seed Data (`prisma/seed.js`)

Seeding command:

- `npm run prisma:seed`

Seed behavior:

- Idempotent through `upsert` for permissions, roles, users, role-permissions, user-roles, and user-info.
- Seeds 29 permission keys (users/roles/permissions/courses/enrollments/content/assignments/quizzes/progress/announcements/reports).
- Seeds roles: `super_admin`, `admin`, `instructor`, `student`.
- Seeds demo users:
    - `superadmin@rd-lms.com`
    - `admin@rd-lms.com`
    - `instructor1@rd-lms.com`
    - `student1@rd-lms.com`
    - `student2@rd-lms.com`
- Assigns role-permission matrix per `ROLE_PERMISSIONS`.
- Seeds 4 default course categories: Programming, Data Science, Mathematics, Business.
- Seeds 4 demo courses (with `course_settings` and `course_instructors` per course): e.g. `intro-to-javascript`, `python-for-data-science` (published), `calculus-essentials` (draft), `business-fundamentals` (admin creator + instructor1 co-instructor).
- Seeds user permission overrides: `student1` ALLOW `courses.create`; `student2` DENY `courses.read`.

## 11) Validation

Library:

- `zod`

Shared ID helpers (`src/utils/validationSchemas.js`):

- `positiveBigIntParam` — route/query IDs: digits-only string → positive `BigInt` (rejects `abc`, `1.5`, `-1`, `0`).
- `optionalPositiveBigInt` — optional query FKs.
- `roleIdBody` / `permissionIdBody` — request body: numeric ID **or** stable key string (e.g. `"instructor"`, `"courses.read"`).
- Param schemas: `userIdParamSchema`, `roleIdParamSchema`, `permissionIdParamSchema`, `courseIdParamSchema`, `enrollmentIdParamSchema`, and composite variants.

Schema locations:

- `src/modules/auth/schemas/auth.schema.js`
- `src/modules/users/schemas/user.schema.js`
- `src/modules/roles/schemas/role.schema.js`
- `src/modules/permissions/schemas/permission.schema.js`
- `src/modules/courses/schemas/courses.schema.js`
- `src/modules/enrollments/schemas/enrollments.schema.js`

Application pattern:

- Route-level `validate(schema)` middleware before controller; coerced `params` merged back into `req.params` as strings for Prisma.
- Path parameters (`:userId`, `:roleId`, `:permissionId`, `:courseId`) require numeric IDs only.
- Validation issues transformed to:
    - `{ field: "<path>", message: "<msg>" }[]`

## 12) Environment Variables

From `.env.example` + required checks in `src/configurations/environment.js`:

- `NODE_ENV` - runtime environment (`development`/`test`/`production`)
- `PORT` - app listen port
- `ALLOWED_ORIGINS` - comma-separated CORS origins
- `DATABASE_URL` - PostgreSQL connection URL
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `JWT_ACCESS_SECRET` - signing secret for access tokens
- `JWT_REFRESH_SECRET` - signing secret for refresh tokens

## 13) Tests

Framework/pattern:

- Jest + Supertest against `app` (no dedicated HTTP server start in tests)
- Shared helper in `tests/helpers/setup.js`:
    - `ensureConnected()` opens Redis/Prisma
    - `teardown()` disconnects
    - `getToken(email,password)` utility

Coverage areas:

- `tests/auth.test.js`: register/login/refresh/access/logout/password-change/check-availability, fallback error envelope checks; IDs serialized as strings.
- `tests/roles.test.js`: role CRUD + role-permission assignment auth checks; BigInt path param validation matrix.
- `tests/users.test.js`: user listing/filtering, block/unblock, activate/deactivate, role assignment safeguards, user permission overrides, onboarding; BigInt path param validation matrix.
- `tests/permissions.test.js`: permission CRUD + auth guards; BigInt path param validation matrix.
- `tests/courses.test.js`: course CRUD lifecycle, publishing ownership, listing visibility, instructor assignment, soft delete, validation.
- `tests/enrollments.test.js`: BR-03 enrollment create/approve/reject/withdraw, listing scopes, history preservation, RBAC, validation, unique constraint.
- `tests/content.test.js`: BR-04 learning content management course sections, contents, assets, reordering transactions, uploads (mocked/mockable stream), visibility and course ownership validation.

## 14) Observed Inconsistencies / Clarifications

- ⚠️ `validate` writes normalized data to `req.validatedData`, but controllers/services mostly read `req.body`/`req.query` directly (validation still runs but sanitized values are unused).
- Path params are numeric BigInt IDs only; role/permission **keys** are accepted in request bodies (assign role, grant permission) via `roleIdBody` / `permissionIdBody`.
- ⚠️ `src/modules/permissions/permission.constants.js` predefined permissions list (12 items) does not match fuller 29-permission seed source in `prisma/seed.js`.
- ⚠️ `README.md` says rate limiting applies to login/register; middleware bypasses limits in both `development` and `test`.
- ⚠️ In `src/configurations/environment.js`, `PORT` is mandatory even though `src/constants.js` has fallback `8000`; missing `PORT` still throws.

## Change Log

| Date       | Author | Change                                                                                                                                                                                                                                                                                                                                               |
| ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-07 | Agent  | BR-04: Learning Content Management module — `CourseSection`, `CourseContent`, `ContentAsset` models, `/api/v1/content` API, hierarchical sections and content management, drag-and-drop transactional reordering, multipart buffer upload stream to Cloudinary, RBAC visibility, and ownership guards, integration tests in `tests/content.test.js`. |
| 2026-06-01 | Agent  | BR-03: Enrollments module — `Enrollment` model, `/api/v1/enrollments` API, status lifecycle, RBAC (`enrollments.read`/`manage`), instructor `enrollments.manage` in seed, `tests/enrollments.test.js`.                                                                                                                                               |
| 2026-06-01 | Agent  | Platform identifier strategy updated from UUID to BigInt auto-increment identifiers.                                                                                                                                                                                                                                                                 |
| 2026-05-31 | Agent  | Centralized OpenAPI component schemas in `swagger.schemas.js`; route JSDoc uses `$ref` for request/response models; RULES.md section 8 documents Swagger workflow.                                                                                                                                                                                   |
| 2026-05-31 | Agent  | Implemented BR-02 courses module: Prisma models, seed categories, full API at `/api/v1/courses`, instructor role no longer has `courses.delete`.                                                                                                                                                                                                     |
| 2026-05-29 | Codex  | Initial full-codebase audit and architecture memory creation from current repository state.                                                                                                                                                                                                                                                          |
