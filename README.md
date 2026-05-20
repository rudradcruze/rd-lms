# RD-LMS

Interactive learning management system built with Node.js, Express, Prisma, PostgreSQL, and Redis.

## Setup

1. Install dependencies:

    ```bash
    npm install
    ```

2. Create your `.env` file from `.env.example` and set `DATABASE_URL`.

3. Generate the Prisma client:

    ```bash
    npm run prisma:generate
    ```

4. Apply the initial migration for a clean database reset:

    ```bash
    npm run prisma:migrate
    ```

5. Start the app:

    ```bash
    npm run dev
    ```

## Prisma Workflow

- `npm run prisma:migrate` is for local development when you want Prisma to manage schema changes.
- `npm run prisma:deploy` is for applying existing migrations in a clean environment.
- Prisma reads `DATABASE_URL` directly.

## Contact

Author: Francis Rudra D Cruze\
Email: francisrudra@gmail.com\
Mobile: +8801870179066
