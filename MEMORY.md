# MEMORY

Last updated: 2026-05-31

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
  - `modules/`
    - `auth/` -> constants, routes, schemas, controller, service, refresh-token repo, tokenSession utils
    - `users/` -> constants, routes, schemas, controller, service, repository
    - `roles/` -> constants, routes, schemas, controller, service, repository
    - `permissions/` -> constants, routes, schemas, controller, service, resolver service, repository
    - `courses/` -> constants, routes, schemas, controller, service, repository
- `prisma/`
  - `schema.prisma`
  - `seed.js`
  - `migrations/` (5 SQL migrations + lock)
- `tests/`
  - `helpers/setup.js`
  - `auth.test.js`, `roles.test.js`, `users.test.js`, `courses.test.js`
- Root config/docs:
  - `README.md`, `.env.example`, `jest.config.js`, `.prettierrc`, `.prettierignore`, `.gitignore`
  - `package.json`, `package-lock.json`

⚠️ `.DS_Store` exists at repo root and is untracked.

## 3) Database Models / Schema (`prisma/schema.prisma`)

### `User` (`users`)
- `id` UUID PK
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

### `UserInfo` (`user_info`)
- `id` UUID PK
- `userId` UUID unique FK -> `users.id` (cascade)
- `firstName`, `lastName`
- timestamps

### `RefreshToken` (`refresh_tokens`)
- `id` UUID PK
- `userId` UUID FK -> `users.id` (cascade)
- `tokenHash` unique
- `expiresAt`
- `blacklistedAt` nullable
- timestamps

### `Role` (`roles`)
- `id` UUID PK
- `name` unique
- `key` unique
- `description` nullable
- timestamps
- relations: `userRoles`, `rolePermissions`

### `Permission` (`permissions`)
- `id` UUID PK
- `name` unique
- `key` unique
- `resource`, `action`
- `description` nullable
- timestamps
- relations: `rolePermissions`, `userPermissions`

### `UserRole` (`user_roles`)
- `id` UUID PK
- `userId` FK -> `users.id` (cascade)
- `roleId` FK -> `roles.id` (cascade)
- timestamps
- unique composite: `(userId, roleId)` (`unique_user_role`)

### `RolePermission` (`role_permissions`)
- `id` UUID PK
- `roleId` FK -> `roles.id` (cascade)
- `permissionId` FK -> `permissions.id` (cascade)
- timestamps
- unique composite: `(roleId, permissionId)` (`unique_role_permission`)

### `UserPermission` (`user_permissions`)
- `id` UUID PK
- `userId` FK -> `users.id` (cascade)
- `permissionId` FK -> `permissions.id` (cascade)
- `allowed` bool default true
- timestamps
- unique composite: `(userId, permissionId)` (`unique_user_permission`)

### `CourseCategory` (`course_categories`)
- `id` UUID PK
- `name` unique
- `description` nullable
- timestamps
- relations: one-to-many `courses`

### `Course` (`courses`)
- `id` UUID PK
- `title`, `slug` unique
- `shortDescription`, `description`, `thumbnailUrl` nullable
- `status` enum `CourseStatus` (`DRAFT`, `PUBLISHED`, `ARCHIVED`) default `DRAFT`
- `categoryId` nullable FK -> `course_categories.id` (set null on delete)
- `createdById` FK -> `users.id` (restrict)
- `deletedAt` nullable (soft delete)
- timestamps
- indexes: `status`, `categoryId`
- relations: `category`, `creator`, `instructors`, `settings`

### `CourseInstructor` (`course_instructors`)
- `id` UUID PK
- `courseId` FK -> `courses.id` (cascade)
- `userId` FK -> `users.id` (cascade)
- `isPrimary` bool default false
- `createdAt`
- unique composite: `(courseId, userId)` (`unique_course_instructor`)

### `CourseSettings` (`course_settings`)
- `id` UUID PK
- `courseId` unique FK -> `courses.id` (cascade)
- `allowSelfEnrollment` bool default true
- `requiresApproval` bool default false
- `showInCatalog` bool default true
- `enableDiscussions` bool default true
- timestamps

Soft delete:
- `Course.deletedAt` — soft-deleted courses hidden from normal queries.
- Token invalidation is logical via `refresh_tokens.blacklisted_at`.

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
- `GET /users/:userId` -> `authorize(["admin","super_admin"])`
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

## 7) Response Envelope

Success (`ApiResponse`):
- JSON fields: `statusCode`, `data`, `message`, `success`
- `success = statusCode < 400`

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

## 11) Validation

Library:
- `zod`

Schema locations:
- `src/modules/auth/schemas/auth.schema.js`
- `src/modules/users/schemas/user.schema.js`
- `src/modules/roles/schemas/role.schema.js`
- `src/modules/permissions/schemas/permission.schema.js`
- `src/modules/courses/schemas/courses.schema.js`

Application pattern:
- Route-level `validate(schema)` middleware before controller.
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
- `tests/auth.test.js`: register/login/refresh/access/logout/password-change/check-availability, fallback error envelope checks.
- `tests/roles.test.js`: role CRUD + role-permission assignment auth checks.
- `tests/users.test.js`: user listing/filtering, block/unblock, activate/deactivate, role assignment safeguards, user permission overrides, onboarding.
- `tests/courses.test.js`: course CRUD lifecycle, publishing ownership, listing visibility, instructor assignment, soft delete, validation.

## 14) Observed Inconsistencies / Clarifications

- ⚠️ `validate` writes normalized data to `req.validatedData`, but controllers/services mostly read `req.body`/`req.query` directly (validation still runs but sanitized values are unused).
- ⚠️ Role/permission routes and Swagger comments say `:roleId` / `:permissionId` can be UUID or key; services mostly call repository `findById` (UUID lookup). Key-based path params may fail.
- ⚠️ `RoleService.assignPermissionToRole` and `revokePermissionFromRole` resolve permission by ID only; Swagger/docs suggest key also works.
- ⚠️ `src/modules/permissions/permission.constants.js` predefined permissions list (12 items) does not match fuller 29-permission seed source in `prisma/seed.js`.
- ⚠️ `README.md` says rate limiting applies to login/register; middleware bypasses limits in both `development` and `test`.
- ⚠️ In `src/configurations/environment.js`, `PORT` is mandatory even though `src/constants.js` has fallback `8000`; missing `PORT` still throws.

## Change Log

| Date | Author | Change |
|---|---|---|
| 2026-05-31 | Agent | Centralized OpenAPI component schemas in `swagger.schemas.js`; route JSDoc uses `$ref` for request/response models; RULES.md section 8 documents Swagger workflow. |
| 2026-05-31 | Agent | Implemented BR-02 courses module: Prisma models, seed categories, full API at `/api/v1/courses`, instructor role no longer has `courses.delete`. |
| 2026-05-29 | Codex | Initial full-codebase audit and architecture memory creation from current repository state. |
