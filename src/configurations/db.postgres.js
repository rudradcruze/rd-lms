import { PrismaClient } from "@prisma/client";
import config from "./environment.js";
import logger from "./logger.js";

const prisma =
    globalThis.__prismaClient ||
    new PrismaClient({
        datasources: {
            db: {
                url: config.postgres.url,
            },
        },
    });

if (config.app.environment !== "production") {
    globalThis.__prismaClient = prisma;
}

export const connectPostgres = async () => {
    try {
        await prisma.$connect();

        logger.info("PostgreSQL Connected");
    } catch (error) {
        logger.error("PostgreSQL Connection Failed");

        logger.error(error.message);

        process.exit(1);
    }
};

export default prisma;
