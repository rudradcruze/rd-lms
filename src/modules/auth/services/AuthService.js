import crypto from "crypto";
import redisClient from "../../../configurations/db.redis.js";
import { ApiError } from "../../../utils/ApiError.js";
import {
    generateTokens,
    verifyRefreshToken,
} from "../../../utils/generateTokens.js";
import { hashPassword, verifyPassword } from "../../../utils/password.js";
import { AUTH_ERRORS, AUTH_MESSAGES, TOKEN_EXPIRY } from "../auth.constants.js";
import RefreshTokenRepository from "../repositories/RefreshTokenRepository.js";
import UserRepository from "../repositories/UserRepository.js";

class AuthService {
    async register(registerData) {
        const { username, email, password } = registerData;

        const existingUserByEmail = await UserRepository.findByEmail(email);
        if (existingUserByEmail) {
            throw new ApiError(409, AUTH_MESSAGES.EMAIL_EXISTS);
        }

        const existingUserByUsername =
            await UserRepository.findByUsername(username);
        if (existingUserByUsername) {
            throw new ApiError(409, AUTH_MESSAGES.USERNAME_EXISTS);
        }

        const passwordHash = await hashPassword(password);

        const user = await UserRepository.create({
            username,
            email,
            passwordHash,
        });

        const { accessToken, refreshToken } = generateTokens(user.id);

        await this.storeRefreshToken(user.id, refreshToken);

        return {
            user,
            accessToken,
            refreshToken,
        };
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

            const storedToken = await RefreshTokenRepository.findByTokenHash(
                this.hashToken(token)
            );

            if (!storedToken || storedToken.blacklistedAt) {
                throw new Error("Token blacklisted or not found");
            }

            const user = await UserRepository.findById(decoded.userId);
            if (!user) {
                throw new ApiError(
                    AUTH_ERRORS.USER_NOT_FOUND.statusCode,
                    AUTH_ERRORS.USER_NOT_FOUND.message
                );
            }

            await RefreshTokenRepository.invalidateToken(storedToken.id);

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

    async logout(userId, refreshToken) {
        await RefreshTokenRepository.invalidateAllUserTokens(userId);

        const tokenKey = `blacklist:${userId}:${this.hashToken(refreshToken)}`;
        await redisClient.setex(tokenKey, TOKEN_EXPIRY.REFRESH, "1");
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
    }

    async storeRefreshToken(userId, refreshToken) {
        const tokenHash = this.hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.REFRESH * 1000);

        await RefreshTokenRepository.create(userId, tokenHash, expiresAt);

        await redisClient.setex(
            `refresh:${userId}:${tokenHash}`,
            TOKEN_EXPIRY.REFRESH,
            refreshToken
        );
    }

    hashToken(token) {
        return crypto.createHash("sha256").update(token).digest("hex");
    }
}

export default new AuthService();
