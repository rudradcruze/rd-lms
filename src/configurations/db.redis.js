import { createClient } from "redis";

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error("Redis Reconnection Failed");
      }

      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on("connect", () => {
  console.log("Redis Connecting...");
});

redisClient.on("ready", () => {
  console.log("Redis Connected");
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err.message);
});

redisClient.on("end", () => {
  console.log("Redis Connection Closed");
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error("Redis Connection Failed");

    console.error(error.message);

    process.exit(1);
  }
};

export default redisClient;