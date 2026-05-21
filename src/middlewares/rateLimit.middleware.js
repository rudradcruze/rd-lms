import redisClient from "../configurations/db.redis.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Custom Redis Rate Limiter Middleware
 * Tracks sliding-window counts via Redis INCR and EXPIRE.
 * Exposes standard headers: X-RateLimit-Limit and X-RateLimit-Remaining
 */
export const rateLimiter = ({
    windowMs = 15 * 60 * 1000, // Time window (default: 15 minutes)
    max = 100, // Request limit (default: 100 requests per window)
    message = "Too many requests, please try again later.",
} = {}) => {
    return async (req, res, next) => {
        // Bypass rate limiting in test environment to avoid 429s during Jest execution
        if (process.env.NODE_ENV === "test") {
            return next();
        }

        const ip =
            req.ip ||
            req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.socket.remoteAddress;

        // Create a unique key combining URL route and client IP
        const key = `ratelimit:${req.originalUrl}:${ip}`;

        try {
            // Increment requests count atomically
            const current = await redisClient.incr(key);

            if (current === 1) {
                // First request in the window, set key expiration (convert ms to seconds)
                await redisClient.expire(key, Math.floor(windowMs / 1000));
            }

            // If count exceeds threshold, throw 429 Too Many Requests
            if (current > max) {
                throw new ApiError(429, message);
            }

            // Inject standard RateLimit metadata headers
            res.setHeader("X-RateLimit-Limit", max);
            res.setHeader("X-RateLimit-Remaining", Math.max(0, max - current));

            next();
        } catch (error) {
            next(error);
        }
    };
};
export default rateLimiter;
