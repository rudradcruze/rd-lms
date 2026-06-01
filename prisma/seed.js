import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// ─── BRD-Aligned Permissions ──────────────────────────────────────────────────
const PERMISSIONS = [
    // User Management
    {
        key: "users.read",
        name: "Read Users",
        resource: "users",
        action: "read",
        description: "View user profiles and lists",
    },
    {
        key: "users.create",
        name: "Create Users",
        resource: "users",
        action: "create",
        description: "Add new users to the system",
    },
    {
        key: "users.update",
        name: "Update Users",
        resource: "users",
        action: "update",
        description: "Modify existing user profiles",
    },
    {
        key: "users.delete",
        name: "Delete Users",
        resource: "users",
        action: "delete",
        description: "Remove users from the system",
    },
    {
        key: "users.block",
        name: "Block/Unblock Users",
        resource: "users",
        action: "block",
        description: "Block or unblock user accounts",
    },

    // Role & Permission Management
    {
        key: "roles.manage",
        name: "Manage Roles",
        resource: "roles",
        action: "manage",
        description: "Full CRUD on roles",
    },
    {
        key: "permissions.manage",
        name: "Manage Permissions",
        resource: "permissions",
        action: "manage",
        description: "Full CRUD on permissions",
    },

    // Course Management (BR-02)
    {
        key: "courses.read",
        name: "Read Courses",
        resource: "courses",
        action: "read",
        description: "View course details and listings",
    },
    {
        key: "courses.create",
        name: "Create Courses",
        resource: "courses",
        action: "create",
        description: "Create new courses",
    },
    {
        key: "courses.update",
        name: "Update Courses",
        resource: "courses",
        action: "update",
        description: "Modify existing courses",
    },
    {
        key: "courses.delete",
        name: "Delete Courses",
        resource: "courses",
        action: "delete",
        description: "Remove courses from the system",
    },
    {
        key: "courses.publish",
        name: "Publish Courses",
        resource: "courses",
        action: "publish",
        description: "Publish or unpublish a course",
    },

    // Enrollment Management (BR-03)
    {
        key: "enrollments.read",
        name: "Read Enrollments",
        resource: "enrollments",
        action: "read",
        description: "View enrollment records",
    },
    {
        key: "enrollments.manage",
        name: "Manage Enrollments",
        resource: "enrollments",
        action: "manage",
        description: "Approve or manage course enrollments",
    },

    // Content Management (BR-04)
    {
        key: "content.read",
        name: "Read Content",
        resource: "content",
        action: "read",
        description: "View learning materials",
    },
    {
        key: "content.create",
        name: "Create Content",
        resource: "content",
        action: "create",
        description: "Upload learning materials",
    },
    {
        key: "content.update",
        name: "Update Content",
        resource: "content",
        action: "update",
        description: "Modify learning materials",
    },
    {
        key: "content.delete",
        name: "Delete Content",
        resource: "content",
        action: "delete",
        description: "Remove learning materials",
    },

    // Assignment Management (BR-05)
    {
        key: "assignments.read",
        name: "Read Assignments",
        resource: "assignments",
        action: "read",
        description: "View assignments and submissions",
    },
    {
        key: "assignments.create",
        name: "Create Assignments",
        resource: "assignments",
        action: "create",
        description: "Create new assignments",
    },
    {
        key: "assignments.update",
        name: "Update Assignments",
        resource: "assignments",
        action: "update",
        description: "Edit existing assignments",
    },
    {
        key: "assignments.grade",
        name: "Grade Assignments",
        resource: "assignments",
        action: "grade",
        description: "Grade student submissions",
    },

    // Quiz & Assessment (BR-06)
    {
        key: "quizzes.read",
        name: "Read Quizzes",
        resource: "quizzes",
        action: "read",
        description: "View quizzes and results",
    },
    {
        key: "quizzes.create",
        name: "Create Quizzes",
        resource: "quizzes",
        action: "create",
        description: "Create new quizzes",
    },
    {
        key: "quizzes.update",
        name: "Update Quizzes",
        resource: "quizzes",
        action: "update",
        description: "Edit existing quizzes",
    },
    {
        key: "quizzes.grade",
        name: "Grade Quizzes",
        resource: "quizzes",
        action: "grade",
        description: "Review and finalize quiz scores",
    },

    // Progress Tracking (BR-07)
    {
        key: "progress.read",
        name: "Read Progress",
        resource: "progress",
        action: "read",
        description: "View student progress and completion",
    },
    {
        key: "progress.manage",
        name: "Manage Progress",
        resource: "progress",
        action: "manage",
        description: "Reset or adjust progress records",
    },

    // Communications & Notifications (BR-08)
    {
        key: "announcements.read",
        name: "Read Announcements",
        resource: "announcements",
        action: "read",
        description: "Read course announcements",
    },
    {
        key: "announcements.create",
        name: "Create Announcements",
        resource: "announcements",
        action: "create",
        description: "Post course announcements",
    },

    // Reports & Analytics (BR-09)
    {
        key: "reports.read",
        name: "Read Reports",
        resource: "reports",
        action: "read",
        description: "Access platform analytics and reports",
    },
];

// ─── BRD-Aligned Roles ────────────────────────────────────────────────────────
const ROLES = [
    {
        key: "super_admin",
        name: "Super Administrator",
        description:
            "Platform owner — bypasses all access checks and has complete system control. Only one super_admin should exist.",
    },
    {
        key: "admin",
        name: "Administrator",
        description:
            "Platform administrator — manages users, courses, and platform operations (BR-09).",
    },
    {
        key: "instructor",
        name: "Instructor",
        description:
            "Creates and manages educational content, assignments, and quizzes (BR-02, BR-04, BR-05, BR-06).",
    },
    {
        key: "student",
        name: "Student",
        description:
            "Enrolled learner who participates in courses and submits assignments (BR-03, BR-05, BR-06, BR-07).",
    },
];

// ─── Role → Permission Mappings ───────────────────────────────────────────────
const ROLE_PERMISSIONS = {
    super_admin: "*", // all permissions

    admin: [
        "users.read",
        "users.create",
        "users.update",
        "users.delete",
        "users.block",
        "roles.manage",
        "permissions.manage",
        "courses.read",
        "courses.create",
        "courses.update",
        "courses.delete",
        "courses.publish",
        "enrollments.read",
        "enrollments.manage",
        "content.read",
        "assignments.read",
        "quizzes.read",
        "progress.read",
        "progress.manage",
        "announcements.read",
        "announcements.create",
        "reports.read",
    ],

    instructor: [
        "courses.read",
        "courses.create",
        "courses.update",
        "courses.publish",
        "content.read",
        "content.create",
        "content.update",
        "content.delete",
        "assignments.read",
        "assignments.create",
        "assignments.update",
        "assignments.grade",
        "quizzes.read",
        "quizzes.create",
        "quizzes.update",
        "quizzes.grade",
        "enrollments.read",
        "enrollments.manage",
        "progress.read",
        "announcements.read",
        "announcements.create",
    ],

    student: [
        "courses.read",
        "content.read",
        "assignments.read",
        "quizzes.read",
        "enrollments.read",
        "progress.read",
        "announcements.read",
    ],
};

// ─── Default Course Categories (BR-02) ────────────────────────────────────────
const COURSE_CATEGORIES = [
    { name: "Programming", description: "Software development and coding" },
    { name: "Data Science", description: "Data analysis and machine learning" },
    { name: "Mathematics", description: "Math and quantitative subjects" },
    { name: "Business", description: "Business and management" },
];

const DEFAULT_COURSE_SETTINGS = {
    allowSelfEnrollment: true,
    requiresApproval: false,
    showInCatalog: true,
    enableDiscussions: true,
};

// ─── Demo Courses (BR-02) ─────────────────────────────────────────────────────
const SEED_COURSES = [
    {
        slug: "intro-to-javascript",
        title: "Introduction to JavaScript",
        shortDescription: "Learn JavaScript from scratch",
        description:
            "Covers variables, functions, DOM basics, and modern ES6+ syntax for new developers.",
        status: "PUBLISHED",
        categoryName: "Programming",
        creatorUsername: "instructor1",
        settings: { ...DEFAULT_COURSE_SETTINGS },
    },
    {
        slug: "python-for-data-science",
        title: "Python for Data Science",
        shortDescription: "Analyze data with Python",
        description:
            "Hands-on course using pandas, NumPy, and visualization libraries for data workflows.",
        status: "PUBLISHED",
        categoryName: "Data Science",
        creatorUsername: "instructor1",
        settings: {
            ...DEFAULT_COURSE_SETTINGS,
            requiresApproval: true,
        },
    },
    {
        slug: "calculus-essentials",
        title: "Calculus Essentials",
        shortDescription: "Core calculus concepts",
        description:
            "Limits, derivatives, and integrals with applied examples (draft — not yet public).",
        status: "DRAFT",
        categoryName: "Mathematics",
        creatorUsername: "instructor1",
        settings: {
            ...DEFAULT_COURSE_SETTINGS,
            showInCatalog: false,
        },
    },
    {
        slug: "business-fundamentals",
        title: "Business Fundamentals",
        shortDescription: "Intro to business management",
        description:
            "Overview of operations, marketing, and finance for aspiring managers.",
        status: "PUBLISHED",
        categoryName: "Business",
        creatorUsername: "admin1",
        settings: { ...DEFAULT_COURSE_SETTINGS },
        extraInstructorUsername: "instructor1",
    },
];

// ─── Direct user permission overrides (demo RBAC) ───────────────────────────
const USER_PERMISSION_OVERRIDES = [
    {
        username: "student1",
        permissionKey: "courses.create",
        allowed: true,
        description: "Grant courses.create to student1 for override testing",
    },
    {
        username: "student2",
        permissionKey: "courses.read",
        allowed: false,
        description: "Deny courses.read for student2 to test direct deny priority",
    },
];

// ─── Demo Users ───────────────────────────────────────────────────────────────
const USERS = [
    {
        username: "superadmin",
        email: "superadmin@rd-lms.com",
        password: "AdminPass123!",
        role: "super_admin",
        isActive: true,
    },
    {
        username: "admin1",
        email: "admin@rd-lms.com",
        password: "AdminPass123!",
        role: "admin",
        isActive: true,
    },
    {
        username: "instructor1",
        email: "instructor1@rd-lms.com",
        password: "Pass123!inst",
        role: "instructor",
        isActive: true,
    },
    {
        username: "student1",
        email: "student1@rd-lms.com",
        password: "Pass123!std1",
        role: "student",
        isActive: true,
    },
    {
        username: "student2",
        email: "student2@rd-lms.com",
        password: "Pass123!std2",
        role: "student",
        isActive: true,
    },
];

async function main() {
    console.log("\n🌱 Starting BRD-Aligned Database Seeding...\n");

    // ── 1. Seed Permissions ─────────────────────────────────────────────────
    console.log("🔑 Seeding permissions...");
    const permMap = {}; // key → record
    for (const perm of PERMISSIONS) {
        const record = await prisma.permission.upsert({
            where: { key: perm.key },
            update: {
                name: perm.name,
                resource: perm.resource,
                action: perm.action,
                description: perm.description,
            },
            create: perm,
        });
        permMap[perm.key] = record;
    }
    console.log(`   ✓ ${PERMISSIONS.length} permissions seeded.`);

    // ── 2. Seed Roles ───────────────────────────────────────────────────────
    console.log("👥 Seeding roles...");
    const roleMap = {}; // key → record
    for (const role of ROLES) {
        const record = await prisma.role.upsert({
            where: { key: role.key },
            update: { name: role.name, description: role.description },
            create: role,
        });
        roleMap[role.key] = record;
    }
    console.log(`   ✓ ${ROLES.length} roles seeded.`);

    // ── 3. Assign Permissions to Roles ──────────────────────────────────────
    console.log("🔗 Mapping permissions to roles...");
    for (const [roleKey, permKeys] of Object.entries(ROLE_PERMISSIONS)) {
        const role = roleMap[roleKey];
        const keys = permKeys === "*" ? Object.keys(permMap) : permKeys;
        for (const permKey of keys) {
            const perm = permMap[permKey];
            if (!perm) {
                console.warn(
                    `   ⚠ Permission key "${permKey}" not found — skipping.`,
                );
                continue;
            }
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: role.id,
                        permissionId: perm.id,
                    },
                },
                update: {},
                create: { roleId: role.id, permissionId: perm.id },
            });
        }
        console.log(`   ✓ ${roleKey}: ${keys.length} permissions assigned.`);
    }

    // ── 3b. Seed Course Categories ───────────────────────────────────────────
    console.log("📚 Seeding course categories...");
    const categoryMap = {};
    for (const category of COURSE_CATEGORIES) {
        const record = await prisma.courseCategory.upsert({
            where: { name: category.name },
            update: { description: category.description },
            create: category,
        });
        categoryMap[category.name] = record;
    }
    console.log(`   ✓ ${COURSE_CATEGORIES.length} course categories seeded.`);

    // ── 4. Seed Demo Users ──────────────────────────────────────────────────
    console.log("👤 Seeding demo users...");
    const userMap = {};
    const createdUsers = [];
    for (const userData of USERS) {
        const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);
        const user = await prisma.user.upsert({
            where: { username: userData.username },
            update: {
                email: userData.email,
                passwordHash,
                isActive: userData.isActive,
                isBlocked: false,
            },
            create: {
                username: userData.username,
                email: userData.email,
                passwordHash,
                isActive: userData.isActive,
                isBlocked: false,
            },
        });

        // Assign role
        const role = roleMap[userData.role];
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: role.id } },
            update: {},
            create: { userId: user.id, roleId: role.id },
        });

        // Seed UserInfo based on username
        let firstName = "Student";
        let lastName = "One";
        if (userData.username === "superadmin") {
            firstName = "Super";
            lastName = "Admin";
        } else if (userData.username === "admin1") {
            firstName = "Admin";
            lastName = "User";
        } else if (userData.username === "instructor1") {
            firstName = "Instructor";
            lastName = "One";
        } else if (userData.username === "student1") {
            firstName = "Student";
            lastName = "One";
        } else if (userData.username === "student2") {
            firstName = "Student";
            lastName = "Two";
        }

        await prisma.userInfo.upsert({
            where: { userId: user.id },
            update: { firstName, lastName },
            create: { userId: user.id, firstName, lastName },
        });

        userMap[userData.username] = user;
        createdUsers.push({ ...userData, id: user.id });
        console.log(`   ✓ ${userData.role.padEnd(12)} → ${userData.email}`);
    }

    // ── 5. Seed Demo Courses, Settings & Instructors ────────────────────────
    console.log("🎓 Seeding courses (settings + instructors)...");
    let courseCount = 0;
    for (const courseData of SEED_COURSES) {
        const creator = userMap[courseData.creatorUsername];
        const category = categoryMap[courseData.categoryName];
        if (!creator) {
            console.warn(
                `   ⚠ Creator "${courseData.creatorUsername}" not found — skipping course "${courseData.slug}".`,
            );
            continue;
        }
        if (!category) {
            console.warn(
                `   ⚠ Category "${courseData.categoryName}" not found — skipping course "${courseData.slug}".`,
            );
            continue;
        }

        const course = await prisma.course.upsert({
            where: { slug: courseData.slug },
            update: {
                title: courseData.title,
                shortDescription: courseData.shortDescription,
                description: courseData.description,
                status: courseData.status,
                categoryId: category.id,
                createdById: creator.id,
                deletedAt: null,
            },
            create: {
                title: courseData.title,
                slug: courseData.slug,
                shortDescription: courseData.shortDescription,
                description: courseData.description,
                status: courseData.status,
                categoryId: category.id,
                createdById: creator.id,
            },
        });

        await prisma.courseSettings.upsert({
            where: { courseId: course.id },
            update: { ...courseData.settings },
            create: {
                courseId: course.id,
                ...courseData.settings,
            },
        });

        await prisma.courseInstructor.upsert({
            where: {
                courseId_userId: {
                    courseId: course.id,
                    userId: creator.id,
                },
            },
            update: { isPrimary: true },
            create: {
                courseId: course.id,
                userId: creator.id,
                isPrimary: true,
            },
        });

        if (courseData.extraInstructorUsername) {
            const coInstructor = userMap[courseData.extraInstructorUsername];
            if (coInstructor) {
                await prisma.courseInstructor.upsert({
                    where: {
                        courseId_userId: {
                            courseId: course.id,
                            userId: coInstructor.id,
                        },
                    },
                    update: { isPrimary: false },
                    create: {
                        courseId: course.id,
                        userId: coInstructor.id,
                        isPrimary: false,
                    },
                });
            }
        }

        courseCount += 1;
        console.log(
            `   ✓ ${courseData.status.padEnd(9)} ${courseData.slug} (${courseData.categoryName})`,
        );
    }
    console.log(`   ✓ ${courseCount} courses seeded with settings and instructors.`);

    // ── 6. Seed User Permission Overrides ───────────────────────────────────
    console.log("🔐 Seeding user permission overrides...");
    let overrideCount = 0;
    for (const override of USER_PERMISSION_OVERRIDES) {
        const user = userMap[override.username];
        const perm = permMap[override.permissionKey];
        if (!user) {
            console.warn(
                `   ⚠ User "${override.username}" not found — skipping override.`,
            );
            continue;
        }
        if (!perm) {
            console.warn(
                `   ⚠ Permission "${override.permissionKey}" not found — skipping override.`,
            );
            continue;
        }

        await prisma.userPermission.upsert({
            where: {
                userId_permissionId: {
                    userId: user.id,
                    permissionId: perm.id,
                },
            },
            update: { allowed: override.allowed },
            create: {
                userId: user.id,
                permissionId: perm.id,
                allowed: override.allowed,
            },
        });
        overrideCount += 1;
        const action = override.allowed ? "ALLOW" : "DENY";
        console.log(
            `   ✓ ${action.padEnd(5)} ${override.username} → ${override.permissionKey}`,
        );
    }
    console.log(`   ✓ ${overrideCount} user permission overrides seeded.`);

    // ── Summary ─────────────────────────────────────────────────────────────
    console.log("\n🚀 Database Seeding Completed Successfully!");
    console.log("════════════════════════════════════════════════════");
    console.log("  SEEDED USERS (use these to test the API):");
    console.log("════════════════════════════════════════════════════");
    for (const u of createdUsers) {
        console.log(
            `  [${u.role.toUpperCase().padEnd(11)}] ${u.email.padEnd(28)} / ${u.password}`,
        );
    }
    console.log("════════════════════════════════════════════════════");
    console.log("  SEEDED COURSES (public catalog):");
    console.log("════════════════════════════════════════════════════");
    for (const c of SEED_COURSES.filter((c) => c.status === "PUBLISHED")) {
        console.log(`  • ${c.title} (/courses/${c.slug})`);
    }
    console.log("════════════════════════════════════════════════════\n");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
