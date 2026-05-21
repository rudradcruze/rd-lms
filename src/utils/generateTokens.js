import jwt from "jsonwebtoken";
import config from "../configurations/environment.js";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../constants.js";

import crypto from "crypto";

export const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId, jti: crypto.randomUUID() },
        config.jwt.accessSecret,
        {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        }
    );
};

export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId, jti: crypto.randomUUID() },
        config.jwt.refreshSecret,
        {
            expiresIn: REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const generateTokens = (userId) => {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, config.jwt.accessSecret);
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, config.jwt.refreshSecret);
};
