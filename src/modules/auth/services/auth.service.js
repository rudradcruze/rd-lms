import crypto from "crypto";
import redisClient from "../../../configurations/db.redis.js";
import logger from "../../../configurations/logger.js";
import { ApiError } from "../../../utils/ApiError.js";
import {
    generateTokens,
    verifyRefreshToken,
    generateAccessToken,
} from "../../../utils/generateTokens.js";
import { hashPassword, verifyPassword } from "../../../utils/password.js";
import { AUTH_ERRORS, AUTH_MESSAGES, TOKEN_EXPIRY } from "../auth.constants.js";
import RefreshTokenRepository from "../repositories/refresh-token.repository.js";
import UserRepository from "../repositories/user.repository.js";

class AuthService {
    async register(registerData) {
        const { username, email, pass, firstname, lastname } = registerData;

        const existingUserByEmail = await UserRepository.findByEmail(email);
        if (existingUserByEmail) {
            throw new ApiError(409, AUTH_MESSAGES.EMAIL_EXISTS);
        }

        const existingUserByUsername =
            await UserRepository.findByUsername(username);
        if (existingUserByUsername) {
            throw new ApiError(409, AUTH_MESSAGES.USERNAME_EXISTS);
        }

        const passwordHash = await hashPassword(pass);

        const user = await UserRepository.create({
            username,
            email,
            passwordHash,
            firstName: firstname,
            lastName: lastname,
        });

        const { accessToken, refreshToken } = generateTokens(user.id);

        await this.storeRefreshToken(user.id, refreshToken);

        try {
            await redisClient.set(`username:${username}`, "1");
            await redisClient.set(`email:${email.toLowerCase()}`, "1");
        } catch (error) {
            logger.warn(`Redis caching of user credentials failed: ${error.message}`);
        }

        return {
            user,
            accessToken,
            refreshToken,
        };
    }

    async checkAvailability({ username, email }) {
        const result = {};

        if (username) {
            let taken = false;
            let cacheChecked = false;

            try {
                const cachedVal = await redisClient.get(`username:${username}`);
                cacheChecked = true;
                if (cachedVal === "1") {
                    taken = true;
                }
            } catch (error) {
                logger.warn(`Redis error in username availability check: ${error.message}`);
            }

            if (!taken) {
                // If it wasn't found as taken in cache, check database
                const dbUser = await UserRepository.findByUsername(username);
                if (dbUser) {
                    taken = true;
                    // Cache the taken status in Redis
                    try {
                        await redisClient.set(`username:${username}`, "1");
                    } catch (error) {
                        logger.warn(`Failed to write username taken status to Redis: ${error.message}`);
                    }
                }
            }

            result.username = { available: !taken };
        }

        if (email) {
            const normalizedEmail = email.toLowerCase();
            let taken = false;
            let cacheChecked = false;

            try {
                const cachedVal = await redisClient.get(`email:${normalizedEmail}`);
                cacheChecked = true;
                if (cachedVal === "1") {
                    taken = true;
                }
            } catch (error) {
                logger.warn(`Redis error in email availability check: ${error.message}`);
            }

            if (!taken) {
                const dbUser = await UserRepository.findByEmail(normalizedEmail);
                if (dbUser) {
                    taken = true;
                    // Cache the taken status in Redis
                    try {
                        await redisClient.set(`email:${normalizedEmail}`, "1");
                    } catch (error) {
                        logger.warn(`Failed to write email taken status to Redis: ${error.message}`);
                    }
                }
            }

            result.email = { available: !taken };
        }

        return result;
    }

    async login(identifier, password) {
        const user = await UserRepository.findByEmailOrUsername(identifier);

        if (!user) {
            throw new ApiError(
                AUTH_ERRORS.INVALID_CREDENTIALS.statusCode,
                AUTH_ERRORS.INVALID_CREDENTIALS.message
            );
        }

        if (!user.isActive) {
            throw new ApiError(
                AUTH_ERRORS.USER_INACTIVE.statusCode,
                AUTH_ERRORS.USER_INACTIVE.message
            );
        }

        if (user.isBlocked) {
            throw new ApiError(
                AUTH_ERRORS.USER_BLOCKED.statusCode,
                AUTH_ERRORS.USER_BLOCKED.message
            );
        }

        const isPasswordValid = await verifyPassword(
            password,
            user.passwordHash
        );
        if (!isPasswordValid) {
            throw new ApiError(
                AUTH_ERRORS.INVALID_CREDENTIALS.statusCode,
                AUTH_ERRORS.INVALID_CREDENTIALS.message
            );
        }

        const { accessToken, refreshToken } = generateTokens(user.id);

        await this.storeRefreshToken(user.id, refreshToken);

        try {
            await redisClient.set(`username:${user.username}`, "1");
            await redisClient.set(`email:${user.email.toLowerCase()}`, "1");
        } catch (error) {
            logger.warn(`Redis caching of user credentials during login failed: ${error.message}`);
        }

        const { passwordHash, ...userData } = user;

        return {
            user: userData,
            accessToken,
            refreshToken,
        };
    }

    async refreshToken(token) {
        try {
            const decoded = verifyRefreshToken(token);
            const tokenHash = this.hashToken(token);

            let isCachedValid = false;
            let redisError = false;

            try {
                const cachedVal = await redisClient.get(`refresh:${decoded.userId}:${tokenHash}`);
                if (cachedVal) {
                    isCachedValid = true;
                }
            } catch (error) {
                redisError = true;
                logger.warn(`Redis error in refresh token validation: ${error.message}`);
            }

            let storedToken = null;

            if (isCachedValid) {
                // Cache hit! Bypass database lookup
                storedToken = { tokenHash };
            } else {
                // Cache miss or Redis error: query PostgreSQL
                storedToken = await RefreshTokenRepository.findByTokenHash(tokenHash);

                if (!storedToken || storedToken.blacklistedAt || new Date(storedToken.expiresAt) <= new Date()) {
                    throw new Error("Token blacklisted, expired or not found");
                }
            }

            const user = await UserRepository.findById(decoded.userId);
            if (!user) {
                throw new ApiError(
                    AUTH_ERRORS.USER_NOT_FOUND.statusCode,
                    AUTH_ERRORS.USER_NOT_FOUND.message
                );
            }

            // Invalidate the old refresh token in Redis
            try {
                await redisClient.del(`refresh:${decoded.userId}:${tokenHash}`);
                await redisClient.sRem(`user:${decoded.userId}:refreshes`, tokenHash);
            } catch (error) {
                logger.warn(`Failed to delete refresh token from Redis: ${error.message}`);
            }

            // Invalidate the old refresh token in PostgreSQL
            await RefreshTokenRepository.invalidateTokenByHash(tokenHash);

            const { accessToken, refreshToken } = generateTokens(user.id);
            await this.storeRefreshToken(user.id, refreshToken);

            return {
                user,
                accessToken,
                refreshToken,
            };
        } catch (error) {
            throw new ApiError(
                AUTH_ERRORS.INVALID_TOKEN.statusCode,
                AUTH_ERRORS.INVALID_TOKEN.message
            );
        }
    }

    async generateAccessTokenFromRefreshToken(token) {
        try {
            const decoded = verifyRefreshToken(token);
            const tokenHash = this.hashToken(token);

            let isCachedValid = false;
            let redisError = false;

            try {
                const cachedVal = await redisClient.get(`refresh:${decoded.userId}:${tokenHash}`);
                if (cachedVal) {
                    isCachedValid = true;
                }
            } catch (error) {
                redisError = true;
                logger.warn(`Redis error in refresh token validation: ${error.message}`);
            }

            let storedToken = null;

            if (isCachedValid) {
                // Cache hit! Bypass database lookup
                storedToken = { tokenHash };
            } else {
                // Cache miss or Redis error: query PostgreSQL
                storedToken = await RefreshTokenRepository.findByTokenHash(tokenHash);

                if (!storedToken || storedToken.blacklistedAt || new Date(storedToken.expiresAt) <= new Date()) {
                    throw new Error("Token blacklisted, expired or not found");
                }
            }

            const user = await UserRepository.findById(decoded.userId);
            if (!user) {
                throw new ApiError(
                    AUTH_ERRORS.USER_NOT_FOUND.statusCode,
                    AUTH_ERRORS.USER_NOT_FOUND.message
                );
            }

            // ONLY generate a new accessToken. Do NOT invalidate or regenerate the refreshToken!
            const accessToken = generateAccessToken(user.id);

            return {
                user,
                accessToken,
            };
        } catch (error) {
            throw new ApiError(
                AUTH_ERRORS.INVALID_TOKEN.statusCode,
                AUTH_ERRORS.INVALID_TOKEN.message
            );
        }
    }

    async logout(userId, refreshToken) {
        await RefreshTokenRepository.invalidateAllUserTokens(userId);

        const tokenHash = this.hashToken(refreshToken);
        const tokenKey = `blacklist:${userId}:${tokenHash}`;
        try {
            await redisClient.set(tokenKey, "1", { EX: TOKEN_EXPIRY.REFRESH });
            // Clean up Redis caches for this specific token
            await redisClient.del(`refresh:${userId}:${tokenHash}`);
            await redisClient.sRem(`user:${userId}:refreshes`, tokenHash);
        } catch (error) {
            logger.warn(`Logout token blacklisting/cleanup skipped due to Redis error: ${error.message}`);
        }
    }

    async changePassword(userId, oldPassword, newPassword) {
        const user = await UserRepository.findById(userId, {
            includePasswordHash: true,
        });
        if (!user) {
            throw new ApiError(
                AUTH_ERRORS.USER_NOT_FOUND.statusCode,
                AUTH_ERRORS.USER_NOT_FOUND.message
            );
        }

        const isPasswordValid = await verifyPassword(
            oldPassword,
            user.passwordHash
        );
        if (!isPasswordValid) {
            throw new ApiError(401, "Old password is incorrect");
        }

        const hashedPassword = await hashPassword(newPassword);
        await UserRepository.changePassword(userId, hashedPassword);

        await RefreshTokenRepository.invalidateAllUserTokens(userId);

        // Revoke all active refresh tokens in Redis instantly
        try {
            const setKey = `user:${userId}:refreshes`;
            const activeHashes = await redisClient.sMembers(setKey);
            if (activeHashes && activeHashes.length > 0) {
                const pipeline = redisClient.multi();
                for (const hash of activeHashes) {
                    pipeline.del(`refresh:${userId}:${hash}`);
                }
                pipeline.del(setKey);
                await pipeline.exec();
            }
        } catch (error) {
            logger.warn(`Failed to clear user active refresh tokens from Redis on password change: ${error.message}`);
        }
    }

    async storeRefreshToken(userId, refreshToken) {
        const tokenHash = this.hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.REFRESH * 1000);

        await RefreshTokenRepository.create(userId, tokenHash, expiresAt);

        try {
            await redisClient.set(`refresh:${userId}:${tokenHash}`, refreshToken, {
                EX: TOKEN_EXPIRY.REFRESH,
            });
            // Track active refresh tokens in user's tracking set for fast complete revocation
            const setKey = `user:${userId}:refreshes`;
            await redisClient.sAdd(setKey, tokenHash);
            await redisClient.expire(setKey, TOKEN_EXPIRY.REFRESH);
        } catch (error) {
            logger.warn(`Redis store refresh token skipped due to Redis error: ${error.message}`);
        }
    }

    hashToken(token) {
        return crypto.createHash("sha256").update(token).digest("hex");
    }
}

export default new AuthService();
