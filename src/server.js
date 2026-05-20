import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

import prisma, { connectPostgres } from "./configurations/db.postgres.js";
import redisClient, { connectRedis } from "./configurations/db.redis.js";

import logger from "./configurations/logger.js";
import { PORT } from "./constants.js";

let server;

const serverShutdown = async (signal) => {
    logger.warn(`\n${signal} received. Server Shutting down...`);

    try {
        // Stop accepting new requests
        if (server) {
            server.close(() => {
                logger.info("HTTP server closed");
            });
        }

        // Close PostgreSQL Connection
        await prisma.$disconnect();
        logger.info("PostgreSQL connection closed");

        // Close Redis Connection
        await redisClient.quit();
        logger.info("Redis connection closed");

        logger.info("Server Shutdown completed");

        process.exit(0);
    } catch (error) {
        logger.error(error, "Server Shutdown failed:");

        process.exit(1);
    }
};

const startServer = async () => {
    try {
        // Database Connections
        await connectPostgres();
        await connectRedis();

        // Start HTTP Server
        server = app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });

        // HTTP Server Error Handling
        server.on("error", (error) => {
            logger.error(error, "Server Error:");

            process.exit(1);
        });
    } catch (error) {
        logger.error(error, "Application Startup Failed:");

        process.exit(1);
    }
};

// Graceful Shutdown Signals
process.on("SIGINT", () => serverShutdown("SIGINT"));
process.on("SIGTERM", () => serverShutdown("SIGTERM"));

startServer();
