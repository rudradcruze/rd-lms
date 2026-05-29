# PROMPT_TEMPLATES.md

Ready-to-use agent prompts for **rd-lms**. Read `MEMORY.md` and `RULES.md` before every task. Copy a template, fill `[PLACEHOLDERS]`, and paste into the agent.

**Project anchors (do not invent alternatives):**
- API base: `/api/v1`
- Middleware: `authenticate`, `authorize`, `permission`, `validate`, `rateLimiter`, `asyncHandler`, `errorMiddleware`
- Roles: `super_admin`, `admin`, `instructor`, `student`
- Success envelope: `new ApiResponse(statusCode, data, message)` → `{ statusCode, data, message, success }`
- Errors: `throw new ApiError(statusCode, message[, errors])` → `{ success: false, statusCode, message, errors }`
- Post-feature workflow: implement → test → seed (if DB) → `npm test` → update `MEMORY.md`

---

## 1) New Entity / Module

Use when adding a **new domain** (new Prisma model + module folder + routes), e.g. `courses`, `enrollments`.

### Prompt structure

```text
Read MEMORY.md and RULES.md first. Do not change unrelated modules.

## Goal
Implement a new [ENTITY_NAME] module for rd-lms: [ONE_SENTENCE_DESCRIPTION].

## Requirements
- Prisma model: [MODEL_FIELDS_AND_RELATIONS]
- API routes under `/api/v1/[ROUTE_PREFIX]`:
  - [METHOD] [PATH] — [WHO_CAN_ACCESS] — [BEHAVIOR]
- Access control:
  - Public routes: [LIST_OR_NONE]
  - Authenticated only: `router.use(authenticate)` on the router
  - Role guard: `authorize(["ROLE_KEY", ...])` where [DESCRIBE]
  - Permission guard: `permission(["resource.action", ...])` where [DESCRIBE]
- Validation: Zod schemas in `src/modules/[entity]/schemas/[entity].schema.js`, applied with `validate(schema)`
- Business rules: [LIST_RULES]
- Throw `ApiError` for domain failures; wrap handlers with `asyncHandler`
- Return `new ApiResponse(...)` from controllers only

## Permissions (if RBAC applies)
- Add keys to `prisma/seed.js` (upsert): [e.g. courses.create, courses.read]
- Map to roles in `ROLE_PERMISSIONS`: instructor gets [X], student gets [Y], admin gets [Z]
- Do NOT allow assigning `super_admin` via API

## Files to create/update
- `prisma/schema.prisma` + migration via `npm run prisma:migrate`
- `prisma/seed.js` (idempotent `upsert`)
- `src/modules/[entity]/[entity].constants.js`
- `src/modules/[entity]/routes/[entity].routes.js`
- `src/modules/[entity]/controllers/[entity].controller.js`
- `src/modules/[entity]/services/[entity].service.js`
- `src/modules/[entity]/repositories/[entity].repository.js`
- `src/modules/[entity]/schemas/[entity].schema.js`
- `src/routes/index.js` — mount `router.use("/[route-prefix]", [entity]Routes)`
- `tests/[entity].test.js` using `tests/helpers/setup.js` (`request`, `getToken`, `CREDS`)
- Swagger JSDoc on routes (optional but preferred for new modules)
- `MEMORY.md` — routes, models, permissions

## Middleware order (protected router)
1. `router.use(authenticate)`
2. Per route: `authorize([...])` OR `permission([...])` → `validate(schema)` → `asyncHandler(...)`

## Out of scope
[LIST_ANYTHING_NOT_TO_BUILD]

## Post-implementation checklist
- [ ] Implement module following repository → service → controller → routes
- [ ] Add/update tests in `tests/[entity].test.js`
- [ ] Update `prisma/seed.js` if permissions/roles/demo data changed
- [ ] Run `npm run prisma:migrate` and `npm run prisma:seed` if schema changed
- [ ] Run `npm test` (all suites must pass)
- [ ] Update `MEMORY.md` (models, routes, middleware, seed notes)
```

### Filled example — Courses module

```text
Read MEMORY.md and RULES.md first. Do not change unrelated modules.

## Goal
Implement a new `courses` module for rd-lms: instructors create and manage courses; students read published courses.

## Requirements
- Prisma model `Course`: id (UUID), title, slug (unique), description (optional), status (enum: draft | published), instructorId (FK → users), createdAt, updatedAt
- API routes under `/api/v1/courses`:
  - POST / — create course — `permission(["courses.create"])` — instructor or admin
  - GET / — list courses (paginated, filter by status) — authenticated
  - GET /:courseId — get one — authenticated; students only see `published`
  - PATCH /:courseId — update — `permission(["courses.update"])` — owner instructor or admin
  - PATCH /:courseId/publish — publish — `permission(["courses.publish"])` — owner or admin
  - DELETE /:courseId — delete — `permission(["courses.delete"])` — owner or admin
- Router: `router.use(authenticate)` at top
- Validation: Zod in `src/modules/courses/schemas/course.schema.js`
- Service throws `ApiError(404)` if not found, `ApiError(403)` if student requests draft
- Controllers return `new ApiResponse(200|201, data, message)`

## Permissions
- Seed keys already in `prisma/seed.js`: courses.read, courses.create, courses.update, courses.delete, courses.publish
- Ensure instructor role has create/update/delete/publish; student has read only (verify ROLE_PERMISSIONS)

## Files to create/update
- prisma/schema.prisma + migration
- src/modules/courses/* (constants, routes, controller, service, repository, schemas)
- src/routes/index.js
- tests/courses.test.js
- MEMORY.md

## Out of scope
- Enrollments, content uploads, quizzes

## Post-implementation checklist
- [ ] Implement module following repository → service → controller → routes
- [ ] Add tests/courses.test.js (instructor can create; student cannot; student sees published only)
- [ ] Verify prisma/seed.js role mappings for courses.*
- [ ] Run npm run prisma:migrate && npm run prisma:seed
- [ ] Run npm test
- [ ] Update MEMORY.md
```

### Files the agent is expected to touch

| Area | Paths |
|------|--------|
| Schema | `prisma/schema.prisma`, `prisma/migrations/*` |
| Seed | `prisma/seed.js` |
| Module | `src/modules/[entity]/**` |
| Router mount | `src/routes/index.js` |
| Tests | `tests/[entity].test.js`, possibly `tests/helpers/setup.js` |
| Docs | `MEMORY.md`, optional `src/configurations/swagger.js` apis array |

---

## 2) Extend Existing Feature

Use when adding a **route, field, or behavior** inside `auth`, `users`, `roles`, or `permissions` (or an existing module you already built).

### Prompt structure

```text
Read MEMORY.md and RULES.md. Extend the existing [MODULE_NAME] module only.

## Goal
[DESCRIBE_CHANGE] in [MODULE_NAME].

## Current behavior (do not break)
- Existing routes: [LIST_FROM_MEMORY_OR_FILES]
- Existing middleware pattern on this router: [e.g. router.use(authenticate); POST uses permission([...])]

## Change
- New/updated endpoint: [METHOD] /api/v1/[PATH]
- Middleware chain: [e.g. authenticate → authorize(["admin","super_admin"]) → validate(schema) → asyncHandler]
- Schema changes: [FIELD_NAMES] in [schema file]
- Service logic: [RULES]; use `throw new ApiError(...)` 
- Response: `new ApiResponse(statusCode, data, "[MESSAGE]")`
- If permissions change: call `PermissionResolverService.invalidateUserCache(userId)` or `invalidateRoleCache(roleId)` where applicable

## Tests
- Update `tests/[MODULE].test.js`:
  - [TEST_CASE_1]
  - [TEST_CASE_2]
- Use `getToken(CREDS.[role].email, CREDS.[role].password)` from `tests/helpers/setup.js`

## Files to touch (minimal)
- `src/modules/[module]/routes/[module].routes.js`
- `src/modules/[module]/controllers/[module].controller.js`
- `src/modules/[module]/services/[module].service.js`
- `src/modules/[module]/repositories/[module].repository.js` (if DB access needed)
- `src/modules/[module]/schemas/[module].schema.js`
- `src/modules/[module]/[module].constants.js` (messages only if needed)
- `tests/[module].test.js`
- `MEMORY.md` (route inventory section)
- Prisma/seed ONLY if [YES/NO]

## Do not
- Refactor unrelated modules
- Change global error envelope or bypass `asyncHandler`/`ApiResponse`
- Assign `super_admin` via new endpoints

## Post-implementation checklist
- [ ] Implement change with existing patterns in sibling routes
- [ ] Add/update tests in tests/[module].test.js
- [ ] Seed/migrate only if schema or permission keys changed
- [ ] Run npm test
- [ ] Update MEMORY.md
```

### Filled example — User soft-search filter

```text
Read MEMORY.md and RULES.md. Extend the existing users module only.

## Goal
Add optional `search` query param to GET /api/v1/users to filter by username or email (case-insensitive substring).

## Current behavior (do not break)
- GET /users: authenticate → authorize(["admin","super_admin"]) → UserController.getAllUsers
- Query params: page, limit, isActive, isBlocked, role
- Response: ApiResponse with data.users, data.total, data.page, data.limit, data.totalPages

## Change
- Same route GET /users; add query `search` (optional string, min 1 char if present)
- validate: extend list schema or validate inline in route if no list schema exists yet
- UserRepository.findAll: add OR filter on username/email when search provided
- No new permissions; same authorize(["admin","super_admin"])

## Tests
- tests/users.test.js: admin can filter with ?search=student1; returns matching users
- student token still gets 403 on GET /users

## Files to touch (minimal)
- src/modules/users/routes/user.routes.js (Swagger comment)
- src/modules/users/controllers/user.controller.js (pass search from req.query)
- src/modules/users/services/user.service.js
- src/modules/users/repositories/user.repository.js
- tests/users.test.js
- MEMORY.md

## Do not
- Change block/activate/onboard flows

## Post-implementation checklist
- [ ] Implement search filter
- [ ] Add tests/users.test.js cases
- [ ] No prisma change
- [ ] Run npm test
- [ ] Update MEMORY.md GET /users query params
```

### Files the agent is expected to touch

| Change type | Typical paths |
|-------------|----------------|
| New route | `routes`, `controller`, `service`, `schemas`, `tests` |
| New field (API only) | `schemas`, `service`, `repository`, `tests` |
| New field (DB) | + `prisma/schema.prisma`, migration, `seed.js`, `MEMORY.md` |
| Cache/RBAC side effect | `permissionResolver.service.js` or caller service |

---

## 3) BRD Section → Feature

Use when implementing requirements from **BRD_LMS.pdf** (or a pasted BRD excerpt).

### Prompt structure

```text
Read MEMORY.md and RULES.md before coding.

## BRD input
[PASTE_BR_SECTION_OR_ATTACH_BRD_LMS.pdf_AND_SECTION_ID]

## Interpretation
- Business rules to implement: [BULLET_LIST]
- Actors/roles: map to keys `super_admin` | `admin` | `instructor` | `student`
- Permissions: map to seeded keys in prisma/seed.js (e.g. enrollments.manage) or propose new keys with upsert in seed
- Out of BRD scope for this task: [LIST]

## Technical mapping (rd-lms)
- New module vs extend: [NEW_MODULE | EXTEND users | EXTEND auth | ...]
- Endpoints (method, path, middleware):
  - [METHOD] /api/v1/... — authenticate → [authorize|permission] → validate → asyncHandler
- Data model: [Prisma models/fields or "none"]
- Auth: public | Bearer access token (`req.user.userId` after `authenticate`)
- Errors: ApiError statuses [400,403,404,409,...]
- Success: ApiResponse with message from module constants file

## Acceptance criteria
1. [TESTABLE_CRITERION_1]
2. [TESTABLE_CRITERION_2]

## Deliverables
[List files — same module layout as RULES.md §8]

## Post-implementation checklist
- [ ] Implement per BRD and RULES.md middleware order
- [ ] tests/*.test.js covering acceptance criteria with CREDS roles
- [ ] prisma migrate + seed if permissions/models added
- [ ] npm test
- [ ] Update MEMORY.md (routes, models, BRD traceability note)
```

### Filled example — BR-03 Enrollment (read + manage)

```text
Read MEMORY.md and RULES.md before coding.

## BRD input
BR-03 Enrollment Management: Admins approve enrollments; students enroll in published courses; instructors view enrollments for their courses.

## Interpretation
- Rules: student creates pending enrollment; admin/instructor with enrollments.manage approves; student can read own enrollments
- Roles: student (read + create request), instructor (read course enrollments), admin (manage all)
- Permissions: enrollments.read, enrollments.manage (already in prisma/seed.js)
- Out of scope: payment, waitlists, email notifications

## Technical mapping
- New module: enrollments
- Endpoints:
  - POST /api/v1/enrollments — authenticate → permission(["enrollments.read"]) — student requests enrollment (body: courseId)
  - GET /api/v1/enrollments — authenticate → permission(["enrollments.read"]) — list (admin all; student own; instructor by course)
  - PATCH /api/v1/enrollments/:id/approve — authenticate → permission(["enrollments.manage"]) — admin or instructor for owned course
- Data model: Enrollment (id, userId, courseId, status: pending|approved|rejected, timestamps); FKs cascade per existing patterns
- Auth: Bearer token; no public routes

## Acceptance criteria
1. student1@rd-lms.com can POST enrollment; gets 201 ApiResponse
2. student cannot PATCH approve (403 ApiError)
3. admin@rd-lms.com can approve (200)
4. instructor with enrollments.read sees enrollments for their courses only

## Deliverables
- prisma/schema.prisma + migration
- src/modules/enrollments/*
- src/routes/index.js
- tests/enrollments.test.js
- MEMORY.md update

## Post-implementation checklist
- [ ] Module + seed role mappings verified
- [ ] tests with CREDS.student, CREDS.admin, CREDS.instructor
- [ ] npm run prisma:migrate && npm run prisma:seed
- [ ] npm test
- [ ] MEMORY.md updated
```

### Files the agent is expected to touch

Same as **New Entity/Module**, plus a short BRD traceability note in `MEMORY.md` Change Log.

---

## 4) Bug Fix

Use for a **scoped fix** without feature creep; all existing tests must keep passing.

### Prompt structure

```text
Read MEMORY.md and RULES.md.

## Bug
- Symptom: [WHAT_FAILS]
- Expected: [CORRECT_BEHAVIOR]
- Actual: [CURRENT_BEHAVIOR]
- Reproduction: [STEPS_OR_TEST_NAME]
- Likely area: [FILE_OR_MODULE]

## Constraints
- Fix only the root cause; no unrelated refactors
- Preserve ApiResponse / ApiError envelopes and middleware order
- Do not change JWT `tv` / refresh rotation behavior unless the bug is in auth/session
- Run full `npm test` before finishing

## Hypothesis (optional)
[YOUR_GUESS]

## Verification
- [ ] Existing test [TEST_FILE] still passes
- [ ] Add regression test: [DESCRIBE_NEW_TEST_IF_NEEDED]

## Post-implementation checklist
- [ ] Minimal fix in [FILES]
- [ ] Regression test added if none covered the bug
- [ ] npm test (all green)
- [ ] Update MEMORY.md only if behavior/docs were wrong (e.g. ⚠️ inconsistency resolved)
```

### Filled example — Role assign by key in path

```text
Read MEMORY.md and RULES.md.

## Bug
- Symptom: DELETE /api/v1/users/:userId/roles/instructor returns 404 when :roleId is role key "instructor"
- Expected: Resolve role by UUID or key (as user.service assignRoleToUser already does via resolveRole)
- Actual: Route works for assign POST with key; remove may not resolve key consistently
- Reproduction: tests/users.test.js DELETE with role key instructor
- Likely area: src/modules/users/services/user.service.js removeRoleFromUser + route param handling

## Constraints
- Mirror resolveRole() pattern from assignRoleToUser; do not change authorize(["super_admin"]) guard
- Preserve PermissionResolverService.invalidateUserCache on success

## Verification
- [ ] tests/users.test.js DELETE role by key passes
- [ ] UUID path still works

## Post-implementation checklist
- [ ] Fix removeRoleFromUser to resolve UUID or key
- [ ] Confirm tests/users.test.js green
- [ ] npm test
- [ ] Update MEMORY.md ⚠️ note if UUID-or-key is now consistently supported for user role routes
```

### Files the agent is expected to touch

| Bug type | Typical paths |
|----------|----------------|
| Service logic | `src/modules/*/services/*.js` |
| Middleware | `src/middlewares/*.js` |
| Validation | `schemas`, `validate.middleware.js` |
| Tests | `tests/*.test.js` |
| Docs only | `MEMORY.md` (if correcting documented behavior) |

---

## 5) Migration Only

Use when adding a **column or table** without full feature API yet (or schema-first step).

### Prompt structure

```text
Read MEMORY.md and RULES.md.

## Schema change
- Model: [MODEL_NAME]
- Change: [ADD_TABLE | ADD_COLUMN | ALTER_CONSTRAINT]
- Fields: [FIELD: TYPE, DEFAULT, RELATIONS]
- Cascade/delete rules: match existing patterns (onDelete: Cascade where join tables)

## Migration
- Update `prisma/schema.prisma`
- Create migration: `npm run prisma:migrate` (name: [MIGRATION_NAME])
- Do not hand-edit applied migration SQL unless necessary

## Seed
- Update `prisma/seed.js` with idempotent `upsert` for: [DATA]
- Do not break existing demo users (superadmin@rd-lms.com, etc.)

## Application code
- [NO_APP_CODE_YET | minimal repository select fields if tests require it]

## Tests
- [ ] Existing npm test still passes
- [ ] Add test only if: [CONDITION]

## Post-implementation checklist
- [ ] schema.prisma updated
- [ ] migration committed
- [ ] seed.js updated (upsert)
- [ ] npm run prisma:generate
- [ ] npm run prisma:seed
- [ ] npm test
- [ ] Update MEMORY.md model section + Change Log
```

### Filled example — `users.phone` optional column

```text
Read MEMORY.md and RULES.md.

## Schema change
- Model: User
- Change: ADD_COLUMN phone (optional String?, mapped phone_number, unique when not null)
- No new relations

## Migration
- Update prisma/schema.prisma
- Migration name: add_phone_to_users

## Seed
- Optionally set phone for demo admin in seed upsert (e.g. +8801000000001); use upsert on username admin1

## Application code
- NO_APP_CODE_YET — schema + seed only

## Tests
- Existing npm test must still pass (no API surface change)

## Post-implementation checklist
- [ ] schema + migration
- [ ] seed upsert for admin1 phone
- [ ] prisma generate + seed
- [ ] npm test
- [ ] MEMORY.md User model fields updated
```

### Files the agent is expected to touch

| Item | Paths |
|------|--------|
| Schema | `prisma/schema.prisma` |
| Migration | `prisma/migrations/<timestamp>_*/migration.sql` |
| Seed | `prisma/seed.js` |
| Docs | `MEMORY.md` |
| App code | Only if prompt explicitly allows |

---

## Prompt Sizing Guide

### When to use a single prompt

Use **one prompt** when:

- The work fits **one module** (or one migration + seed) and ≤ **5 endpoints**
- Access rules are clear (`authorize(["admin","super_admin"])` vs `permission(["courses.create"])`)
- You can list **acceptance tests** in bullets (the agent can implement + test in one pass)
- BRD section maps to a single bounded feature (e.g. “enrollment approve/reject” only)

Example: “Add GET /users?search= filter” → **Extend Existing Feature** template, one shot.

### When to split into multiple prompts

Split when:

1. **Schema first, API second** — Run **Migration Only**, then **New Entity/Module** (or BRD template) in a follow-up prompt after migration is merged.
2. **Cross-cutting concerns** — e.g. new permission keys in seed (prompt 1) + routes using them (prompt 2) if you need seed merged before tests run.
3. **Large BRD sections** — e.g. “Course Management BR-02” → (a) Course CRUD, (b) publish workflow, (c) content module; each with its own acceptance criteria.
4. **Risky auth changes** — Token/session changes isolated from feature work so `tests/auth.test.js` failures are easier to attribute.

Suggested split order: **Migration Only → New/Extend module → BRD polish → Bug fixes**.

### Too broad (agent will hallucinate)

Avoid prompts that:

- Say “implement the LMS from BRD” without section IDs or acceptance criteria
- List many modules at once (“add courses, enrollments, quizzes, and reports”)
- Omit middleware (`authenticate` / `authorize` / `permission`) or say “admin only” without role keys
- Invent permission names not in `prisma/seed.js` without asking to add seed upserts
- Request “REST best practices” instead of `ApiResponse` / `ApiError` / `asyncHandler`
- Ask to change auth globally while also shipping unrelated features

**Fix:** Narrow to one template type, name files, list endpoints with middleware chains, reference `CREDS` roles for tests.

### Too narrow (wastes round trips)

Avoid prompts that:

- Only say “add a field” without model name, file paths, or test expectation
- Ask “run tests” in a separate prompt after the agent already implemented the feature (use the checklist in the same prompt)
- Split “add route” and “add controller method” into two prompts when one **Extend Existing Feature** block suffices

**Fix:** Combine schema + route + service + test + MEMORY update in one prompt when total touch surface is small.

### Quick reference

| Size | Scope | Template |
|------|--------|----------|
| S | One bug, one test | Bug Fix |
| S | Column/table, no API | Migration Only |
| M | One endpoint or query param | Extend Existing Feature |
| L | New module + tests + seed | New Entity/Module |
| L | BRD section with clear AC | BRD Section → Feature |
| XL | Multiple modules | Split into M/L prompts |

---

## Standard post-implementation checklist (copy into any prompt)

```text
## Post-implementation checklist (mandatory per RULES.md §13)
- [ ] Code follows module layout and middleware order in RULES.md
- [ ] Services throw ApiError; routes use asyncHandler; controllers use ApiResponse
- [ ] Tests added/updated under tests/*.test.js using tests/helpers/setup.js
- [ ] If prisma/schema changed: migrate + seed (upsert) + prisma generate
- [ ] npm test passes (npm run test:coverage for larger features)
- [ ] MEMORY.md updated (models, routes, permissions, Change Log)
- [ ] No assignment of super_admin via new APIs; permission cache invalidation preserved where RBAC changes
```

---

## Seeded test credentials (for examples)

From `tests/helpers/setup.js` / `prisma/seed.js`:

| Role | Email | Password |
|------|--------|----------|
| super_admin | superadmin@rd-lms.com | AdminPass123! |
| admin | admin@rd-lms.com | AdminPass123! |
| instructor | instructor1@rd-lms.com | Pass123!inst |
| student | student1@rd-lms.com | Pass123!std1 |

Use: `const token = await getToken(CREDS.admin.email, CREDS.admin.password)` then `.set("Authorization", \`Bearer ${token}\`)`.
