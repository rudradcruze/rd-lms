const requiredEnvVariables = [
    "PORT",
    "DATABASE_URL",

    "REDIS_HOST",
    "REDIS_PORT",

    "ALLOWED_ORIGINS",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
];

requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
});

const config = {
    app: {
        port: Number(process.env.PORT),
        environment: process.env.NODE_ENV || "development",
    },

    postgres: {
        url: process.env.DATABASE_URL,
    },

    redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
    },

    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(",").map((origin) =>
                  origin.trim(),
              )
            : ["http://localhost:5173", "http://localhost:3000"],
        credentials: true,
    },

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
    },
};

export default config;
