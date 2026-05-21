import redisClient from "../configurations/db.redis.js";
import logger from "../configurations/logger.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/generateTokens.js";

export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            throw new ApiError(401, "Access token is missing");
        }

        const decoded = verifyAccessToken(token);

        let isBlacklisted = false;
        try {
            isBlacklisted = await redisClient.exists(
                `blacklist:${decoded.userId}:${token}`
            );
        } catch (error) {
            logger.warn(`Auth token blacklist check skipped due to Redis error: ${error.message}`);
        }

        if (isBlacklisted) {
            throw new ApiError(401, "Token has been blacklisted");
        }


        req.user = {
            userId: decoded.userId,
            iat: decoded.iat,
            exp: decoded.exp,
        };

        next();
    } catch (error) {
        if (error instanceof ApiError) {
            next(error);
        } else if (error.name === "TokenExpiredError") {
            next(new ApiError(401, "Token has expired"));
        } else if (error.name === "JsonWebTokenError") {
            next(new ApiError(401, "Invalid token signature"));
        } else {
            next(new ApiError(401, "Authentication failed"));
        }
    }
};
