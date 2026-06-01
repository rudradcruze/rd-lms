# 🎓 RD-LMS Backend

An interactive, high-performance **Learning Management System (LMS)** backend built using modern **Node.js**, **Express**, **Prisma**, **PostgreSQL**, and **Redis**.

This backend incorporates robust security mechanisms, fine-grained role-based access control (RBAC), user permission overrides, session rotation (RTR), and Redis-backed rate limiting.

---

## 🚀 Step-by-Step Installation & Setup

Follow these commands in sequence to initialize the project environment and database:

### 📥 1. Install Dependencies
Install all production and development dependencies:
```bash
npm install
```

### 🔑 2. Configure Environment Variables
Copy the template configuration file to create your `.env`:
```bash
cp .env.example .env
```
Open the `.env` file and define the configuration variables. Ensure your local PostgreSQL and Redis databases are running and set the credentials accordingly:
```ini
PORT=8000
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<db_name>?schema=public"
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
JWT_ACCESS_SECRET="your-jwt-access-secret-at-least-32-bytes"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-at-least-32-bytes"
```

### 🗄️ 3. Initialize the Database & Run Migrations
Run Prisma migrations to create all schemas, tables, and relationships in PostgreSQL:
```bash
npm run prisma:migrate
```
*Note: This command will run schema migrations and automatically prompt you for a migration name if running for the first time.*

### 🛠️ 4. Generate Prisma Client
Generate the type-safe Prisma client to communicate with your database:
```bash
npm run prisma:generate
```

### 🌱 5. Seed Database
Seed the system permissions, default roles, permission-to-role mappings, and demo accounts (using the `@rd-lms.com` email domain):
```bash
npm run prisma:seed
```

---

## 🏃 Starting & Running the App

### 🧑‍💻 Start Development Server
Run the application with auto-reloads powered by Nodemon:
```bash
npm run dev
```
The server will start on your configured port (e.g., `http://localhost:8000`).

### 📘 Swagger Interactive UI
Access fully documented API endpoints and execute interactive sandbox requests:
* **Interactive UI**: [http://localhost:8000/api-docs](http://localhost:8000/api-docs)

---

## 🧪 Running Automated Tests

RD-LMS uses a highly comprehensive **Jest** and **Supertest** test suite to validate authentication flows, role assignments, custom permission overrides, activation states, and rate limiting.

### 🧪 Run All Tests
Execute all automated test suites sequentially:
```bash
npm test
```

### 📊 Run Tests with Coverage Report
Run tests and generate a complete test coverage summary:
```bash
npm run test:coverage
```

---

## 👥 Seeded Demo Accounts
Use these pre-configured user credentials (seeding maps these with `@rd-lms.com` emails) to authenticate and test endpoints:

| Role | Email | Password | Allowed Operations Example |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@rd-lms.com` | `AdminPass123!` | Management of all roles, custom user overrides, permissions |
| **Admin** | `admin@rd-lms.com` | `AdminPass123!` | View lists, block/unblock, activate/deactivate users |
| **Instructor** | `instructor1@rd-lms.com` | `Pass123!inst` | Course creation, management of modules |
| **Student** | `student1@rd-lms.com` | `Pass123!std1` | Enroll, read-only dashboard access |
| **Student (Alternative)** | `student2@rd-lms.com` | `Pass123!std2` | Enroll, read-only dashboard access |

---

## 🛠️ Step-by-Step Manual Testing Recipes (via Swagger UI)

To manually verify the core features of the RD-LMS backend without using command line HTTP clients, open the **Swagger UI** at [http://localhost:8000/api-docs](http://localhost:8000/api-docs) and perform the following sequence:

### Recipe A: Authenticate as Super Admin (Login)
1. Locate the `POST /api/v1/auth/login` endpoint in the Swagger UI and click **"Try it out"**.
2. Provide the seeded credentials in the request body:
   - **identifier**: `superadmin@rd-lms.com`
   - **password**: `AdminPass123!`
3. Click **"Execute"**.
4. **Expected Result**: A `200 OK` response with `accessToken` and `refreshToken`.
5. Copy the returned `accessToken`. Click the **"Authorize"** button at the top of the Swagger UI, paste the token, and click **"Authorize"** to lock in your session.

### Recipe B: Register a New Student User
1. Locate the `POST /api/v1/auth/register` endpoint in the Swagger UI and click **"Try it out"**.
2. Provide a new student registration payload:
   - **username**: `student_johndoe`
   - **email**: `johndoe@rd-lms.com`
   - **pass**: `SecurePassword123!`
   - **firstname**: `John`
   - **lastname**: `Doe`
3. Click **"Execute"**.
4. **Expected Result**: A `201 Created` response. Note the returned user ID (`userId`).

### Recipe C: Verify Redis Rate Limiting
1. Find any authenticated endpoint (e.g., `POST /api/v1/auth/login`).
2. Rapidly spam the endpoint with bad/wrong credentials to exceed **20 attempts in a 15-minute window**.
3. **Expected Result**: Initially, you will receive `401 Unauthorized` responses. Once you exceed 20 attempts, the API will return `429 Too Many Requests`. The response headers will show `X-RateLimit-Limit: 20` and `X-RateLimit-Remaining: 0`.

### Recipe D: Fetch User Profiles
1. With your Super Admin access token authorized, locate `GET /api/v1/users` and click **"Try it out"**.
2. Click **"Execute"**.
3. **Expected Result**: A `200 OK` list containing all user records, with each record dynamically including their nested `userInfo` (first and last names).

### Recipe E: Assign & Revoke Roles
1. Locate `POST /api/v1/users/{userId}/roles` under User management.
2. Provide the `userId` noted from Recipe B in the path.
3. In the request body, pass `{"roleId": "instructor"}` (accepts either numeric role ID or role key).
4. Click **"Execute"**.
5. **Expected Result**: The role is successfully assigned and the user's active permissions cache in Redis is automatically invalidated.
6. To revoke, locate `DELETE /api/v1/users/{userId}/roles/{roleId}` and execute with the `userId` and role key `user`.

### Recipe F: Test Fine-Grained Permission Overrides
1. Locate `POST /api/v1/users/{userId}/permissions` to grant a permission override.
2. In the request body, pass `{"permissionId": "users.read"}` (accepts either numeric permission ID or key).
3. **Expected Result**: The permission `users.read` is successfully added to the user's explicit allowed list, immediately invalidating their Redis cache.
4. To test explicit deny: locate `POST /api/v1/users/{userId}/permissions/{permissionId}/deny` and execute. This flips `allowed: false` in the database, overriding any role memberships in real time!

### Recipe G: Token Session Rotation (RTR)
1. Locate `POST /api/v1/auth/refresh`.
2. Provide your active `refreshToken` in the request body.
3. Click **"Execute"**.
4. **Expected Result**: A `200 OK` response with a brand-new token pair. The old `refreshToken` is immediately blacklisted. Attempting to execute another refresh request using the old `refreshToken` will fail with `401 Unauthorized`.

---

## 📬 Contact & Support

* **Author**: Francis Rudra D Cruze
* **Email**: [francisrudra@gmail.com](mailto:francisrudra@gmail.com)
* **Mobile**: +8801870179066
