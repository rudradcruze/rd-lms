import redisClient from "../../../configurations/db.redis.js";
import logger from "../../../configurations/logger.js";

const accessTokenVersionKey = (userId) => `user:${userId}:accessTokenVersion`;

/**
 * Current access-token generation version for a user.
 * Tokens embed this value as `tv`; mismatch means the session was revoked.
 */
export async function getAccessTokenVersion(userId) {
    try {
        const value = await redisClient.get(accessTokenVersionKey(userId));
        return value ? Number(value) : 0;
    } catch (error) {
        logger.warn(
            `Access token version read skipped due to Redis error: ${error.message}`
        );
        return 0;
    }
}

/**
 * Invalidates all outstanding access tokens for a user (logout, password change).
 */
export async function invalidateAccessTokens(userId) {
    try {
        await redisClient.incr(accessTokenVersionKey(userId));
    } catch (error) {
        logger.warn(
            `Access token invalidation skipped due to Redis error: ${error.message}`
        );
    }
}
