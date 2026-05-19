import { createClient } from "redis";
import config from "./environment.js";
import logger from "./logger.js";

const redisClient = createClient({
    socket: {
        host: config.redis.host,
        port: config.redis.port,
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                return new Error("Redis Reconnection Failed");
            }

            return Math.min(retries * 100, 3000);
        },
    },
});

redisClient.on("connect", () => {
    logger.info("Redis Connecting...");
});

redisClient.on("ready", () => {
    logger.info("Redis Connected");
});

redisClient.on("error", (err) => {
    logger.error("Redis Error:", err.message);
});

redisClient.on("end", () => {
    logger.info("Redis Connection Closed");
});

export const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        logger.error("Redis Connection Failed");

        logger.error(error.message);

        process.exit(1);
    }
};

export default redisClient;
