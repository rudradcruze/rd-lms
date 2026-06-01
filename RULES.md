# RULES

Derived from current code. These are mandatory for future agent work in this repository.

## 1) Routing + Middleware Order

- Protected module routers must attach authentication at router level with `router.use(authenticate)` before route declarations.
    <!-- Derived from: src/modules/users/routes/user.routes.js, src/modules/roles/routes/role.routes.js, src/modules/permissions/routes/permission.routes.js -->

- Public auth endpoints use per-route middleware in this order: limiter (if any) -> `validate(schema)` -> `asyncHandler(...)`.
    <!-- Derived from: src/modules/auth/routes/auth.routes.js -->

- Authenticated auth endpoints use: `authenticate` first, then limiter (if any), then validation, then handler.
    <!-- Derived from: src/modules/auth/routes/auth.routes.js -->

- Role-guarded routes use `authorize([...])` before controller invocation.
    <!-- Derived from: src/modules/users/routes/user.routes.js, src/modules/roles/routes/role.routes.js, src/modules/permissions/routes/permission.routes.js -->

- Permission-guarded routes use `permission([...])` before validation/controller (`POST /users` currently follows this).
    <!-- Derived from: src/modules/users/routes/user.routes.js -->

## 2) Controller + Service Pattern

- Controllers are thin: parse params/body/query, call service, return `new ApiResponse(statusCode, data, message)`.
    <!-- Derived from: src/modules/auth/controllers/auth.controller.js, src/modules/users/controllers/user.controller.js, src/modules/roles/controllers/role.controller.js, src/modules/permissions/controllers/permission.controller.js -->

- Business logic and permission/cache invalidation stay in services, not controllers.
    <!-- Derived from: src/modules/*/services/*.js -->

- Data access goes through repository classes; services should not duplicate Prisma query logic unless intentionally centralized (permission resolver is an exception).
    <!-- Derived from: src/modules/*/repositories/*.js, src/modules/permissions/services/permissionResolver.service.js -->

## 3) Error Throwing + Error Envelope

- Throw `ApiError` in service/middleware for domain errors (`404`, `409`, `403`, etc.).
    <!-- Derived from: src/modules/auth/services/auth.service.js, src/modules/users/services/user.service.js, src/modules/roles/services/role.service.js, src/modules/permissions/services/permission.service.js -->

- Use `asyncHandler` for async route handlers so thrown/rejected errors reach global error middleware.
    <!-- Derived from: src/utils/asyncHandler.js and all route files -->

- Keep global JSON error shape unchanged:  
  `{ success: false, statusCode, message, errors, ...(stack in development) }`.
    <!-- Derived from: src/middlewares/error.middleware.js, src/utils/ApiError.js -->

- Keep 404 catch-all behavior in `app.js` (`Cannot METHOD URL - Route not found`).
    <!-- Derived from: src/app.js -->

## 4) Success Response Structure

- Keep success envelope shape from `ApiResponse`:  
  `{ statusCode, data, message, success }`.
    <!-- Derived from: src/utils/ApiResponse.js -->

- Do not return raw objects directly from controllers unless intentionally deviating project-wide.
    <!-- Derived from: all controller files -->

## 5) Auth + Session Rules

- Access tokens must include `tv` (token version) and must be rejected when `tv` differs from Redis version.
    <!-- Derived from: src/utils/generateTokens.js, src/middlewares/authenticate.middleware.js, src/modules/auth/utils/tokenSession.js -->

- Refresh tokens must be hashed (`sha256`) before DB storage and handled via rotation/blacklisting logic.
    <!-- Derived from: src/modules/auth/services/auth.service.js, src/modules/auth/repositories/refresh-token.repository.js -->

- Logout/password-change must invalidate refresh tokens and access tokens (version bump).
    <!-- Derived from: src/modules/auth/services/auth.service.js -->

## 6) Roles/Permissions Enforcement

- Role keys used in authorization logic are string keys (`super_admin`, `admin`, `instructor`, `student`), not role names.
    <!-- Derived from: src/middlewares/authorize.middleware.js, prisma/seed.js -->

- `super_admin` assignment via API is forbidden; only seeded/system-owned.
    <!-- Derived from: src/modules/users/services/user.service.js -->

- Permission resolution priority must remain: super_admin all -> direct deny -> direct allow -> role permissions.
    <!-- Derived from: src/modules/permissions/services/permissionResolver.service.js -->

- Permission cache key contract (`user:{id}:permissions`) and invalidation hooks on role/permission/user changes must be preserved.
    <!-- Derived from: src/modules/permissions/services/permissionResolver.service.js, src/modules/users/services/user.service.js, src/modules/roles/services/role.service.js -->

## 7) Validation Rules

- Use Zod schemas under each module’s `schemas/` folder and apply via `validate(...)` middleware on routes.
    <!-- Derived from: src/modules/*/schemas/*.js and route files -->

- Keep validation issue format: `{ field, message }`.
    <!-- Derived from: src/middlewares/validate.middleware.js -->

## 8) Swagger / OpenAPI Documentation

- Shared component schemas live in [`src/configurations/swagger.schemas.js`](src/configurations/swagger.schemas.js) (`ApiResponse`, `ApiError`, domain models, request DTOs).
    <!-- Derived from: src/configurations/swagger.schemas.js, src/configurations/swagger.js -->

- [`src/configurations/swagger.js`](src/configurations/swagger.js) registers `apis` in this order: `swagger.schemas.js` first, then each module `routes/*.routes.js`. Auth paths defined inline in `swagger.js` may reference `#/components/schemas/*`.
    <!-- Derived from: src/configurations/swagger.js -->

- Every new or changed endpoint must have JSDoc `@swagger` on the route handler with:
    - correct `tags`, `summary`, and `security` (`[]` for public routes)
    - request bodies using `$ref: '#/components/schemas/<RequestSchema>'` when a schema exists
    - success/error responses using `$ref` to `ApiResponse`, `ApiError`, and domain schemas
      <!-- Derived from: src/modules/courses/routes/courses.routes.js, src/modules/users/routes/user.routes.js -->

- When adding a new domain model or request shape, add or update the schema in `swagger.schemas.js` before referencing it from route JSDoc.
    <!-- Derived from: courses module swagger rollout -->

- After Swagger changes, confirm `/api-docs` loads and the new operations appear under the correct tag with response schemas.
    <!-- Operational check -->

## 9) File/Folder Conventions

- Keep module layout: `modules/<domain>/{routes,controllers,services,repositories,schemas,*.constants}.js`.
    <!-- Derived from: src/modules/auth, src/modules/users, src/modules/roles, src/modules/permissions -->

- Keep middleware files in `src/middlewares` named `<purpose>.middleware.js`.
    <!-- Derived from: src/middlewares/*.js -->

- Keep utility files in `src/utils` with PascalCase only for class-like utilities (`ApiError`, `ApiResponse`) and lower camel for function-focused modules.
    <!-- Derived from: src/utils/* -->

## 10) Database + Seed Rules

- Prisma schema is source of truth for models/relations; update migrations with schema changes.
    <!-- Derived from: prisma/schema.prisma, prisma/migrations/* -->

- Seeding must be idempotent via `upsert` for repeatability.
    <!-- Derived from: prisma/seed.js -->

- Preserve default role bootstrap assumption (`student` must exist for registration).
    <!-- Derived from: src/modules/users/repositories/user.repository.js -->

## 11) Testing Rules

- Tests are Jest + Supertest under `tests/**/*.test.js` with shared setup helper.
    <!-- Derived from: jest.config.js, tests/helpers/setup.js -->

- Use seeded credentials from `tests/helpers/setup.js` for role-based behavior tests.
    <!-- Derived from: tests/helpers/setup.js -->

- Keep coverage for auth flows, role management, user management, permission management, course management, and error envelope regressions.
    <!-- Derived from: tests/auth.test.js, tests/roles.test.js, tests/users.test.js, tests/permissions.test.js, tests/courses.test.js -->

## 12) Config/Formatting Rules

- Prettier style: 4-space tabs, semicolons, double quotes, bracket spacing, trailing commas (es5).
    <!-- Derived from: .prettierrc -->

- Keep ESM imports/exports project-wide (`type: module`).
    <!-- Derived from: package.json and all source files -->

## 13) Known Constraints / Guardrails

- Path parameters (`:userId`, `:roleId`, `:permissionId`, `:courseId`) require numeric BigInt IDs via `positiveBigIntParam`. Role/permission keys are allowed in **request bodies** only (assign role, grant permission).
    <!-- Derived from: src/utils/validationSchemas.js, src/modules/users/services/user.service.js -->

- Rate limiter bypasses `development` and `test`; behavior in local dev differs from production.
    <!-- Derived from: src/middlewares/rateLimit.middleware.js -->

## 14) Identifier Strategy (mandatory)

- All Prisma entities must use `id BigInt @id @default(autoincrement())`. UUID primary keys are prohibited.
    <!-- Derived from: prisma/schema.prisma -->

- All foreign keys must use `BigInt`.
    <!-- Derived from: prisma/schema.prisma -->

- Route parameters must validate positive integer BigInt IDs (`src/utils/validationSchemas.js` → `positiveBigIntParam`).
    <!-- Derived from: src/utils/validationSchemas.js, route validate() middleware -->

- API responses serialize BigInt IDs as strings globally via `serializeBigInt` in `src/app.js`. Controllers must not manually convert IDs.
    <!-- Derived from: src/utils/serializeBigInt.js, src/app.js -->

- JWT payloads store `userId` as a string; `authenticate` sets `req.user.userId` as `BigInt`.
    <!-- Derived from: src/utils/generateTokens.js, src/middlewares/authenticate.middleware.js -->

## 15) Mandatory Post-Feature Workflow

1. Implement the feature with the module/repository/service/controller patterns above.
2. Add or update tests in `tests/` for the new/changed behavior.
3. If data model or seed assumptions changed, update `prisma/schema.prisma`, migrations, and `prisma/seed.js`.
4. Update Swagger: add or extend schemas in `src/configurations/swagger.schemas.js`, add route JSDoc with `$ref` responses, register new route files in `src/configurations/swagger.js` `apis` if needed, and verify `/api-docs`.
5. Run migrations/seed as needed, then run `npm test` (and `npm run test:coverage` when relevant).
6. Update `MEMORY.md` to reflect new architecture/routes/models/rules-impact before finalizing.
