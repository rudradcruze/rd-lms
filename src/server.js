import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

import sequelize, { connectPostgres } from "./configurations/db.postgres.js";
import redisClient, { connectRedis } from "./configurations/db.redis.js";

import { PORT } from "./constants.js";

let server;

const serverShutdown = async (signal) => {
    console.log(`\n${signal} received. Server Shutting down...`);

    try {
        // Stop accepting new requests
        if (server) {
            server.close(() => {
                console.log("HTTP server closed");
            });
        }

        // Close PostgreSQL Connection
        await sequelize.close();
        console.log("PostgreSQL connection closed");

        // Close Redis Connection
        await redisClient.quit();
        console.log("Redis connection closed");

        console.log("Server Shutdown completed");

        process.exit(0);
    } catch (error) {
        console.error("Server Shutdown failed:", error);

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
            console.log(`Server running on port ${PORT}`);
        });

        // HTTP Server Error Handling
        server.on("error", (error) => {
            console.error("Server Error:", error);

            process.exit(1);
        });
    } catch (error) {
        console.error("Application Startup Failed:", error);

        process.exit(1);
    }
};

// Graceful Shutdown Signals
process.on("SIGINT", () => serverShutdown("SIGINT"));
process.on("SIGTERM", () => serverShutdown("SIGTERM"));

startServer();
