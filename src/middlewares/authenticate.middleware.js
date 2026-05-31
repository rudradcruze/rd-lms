import { getAccessTokenVersion } from "../modules/auth/utils/tokenSession.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/generateTokens.js";

export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            throw new ApiError(401, "Access token is missing");
        }

        const decoded = verifyAccessToken(token);
        const tokenVersion = Number(decoded.tv ?? 0);
        const currentVersion = await getAccessTokenVersion(decoded.userId);

        if (tokenVersion !== currentVersion) {
            throw new ApiError(401, "Token has been revoked");
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

export const optionalAuthenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return next();
        }

        const decoded = verifyAccessToken(token);
        const tokenVersion = Number(decoded.tv ?? 0);
        const currentVersion = await getAccessTokenVersion(decoded.userId);

        if (tokenVersion !== currentVersion) {
            return next();
        }

        req.user = {
            userId: decoded.userId,
            iat: decoded.iat,
            exp: decoded.exp,
        };

        next();
    } catch {
        next();
    }
};
