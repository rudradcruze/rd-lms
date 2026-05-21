export const AUTH_MESSAGES = {
    REGISTRATION_SUCCESS: "User registered successfully",
    LOGIN_SUCCESS: "User logged in successfully",
    LOGOUT_SUCCESS: "User logged out successfully",
    REFRESH_SUCCESS: "Token refreshed successfully",
    PASSWORD_CHANGED: "Password changed successfully",
    INVALID_CREDENTIALS: "Invalid email/username or password",
    USER_NOT_FOUND: "User not found",
    INVALID_TOKEN: "Invalid or expired token",
    USER_INACTIVE: "User account is inactive",
    USER_BLOCKED: "Your account has been blocked. Please contact an administrator.",
    USERNAME_EXISTS: "Username already exists",
    EMAIL_EXISTS: "Email already exists",
};

export const AUTH_ERRORS = {
    INVALID_CREDENTIALS: {
        statusCode: 401,
        message: AUTH_MESSAGES.INVALID_CREDENTIALS,
    },
    USER_NOT_FOUND: {
        statusCode: 404,
        message: AUTH_MESSAGES.USER_NOT_FOUND,
    },
    INVALID_TOKEN: {
        statusCode: 401,
        message: AUTH_MESSAGES.INVALID_TOKEN,
    },
    USER_INACTIVE: {
        statusCode: 403,
        message: AUTH_MESSAGES.USER_INACTIVE,
    },
    USER_BLOCKED: {
        statusCode: 403,
        message: AUTH_MESSAGES.USER_BLOCKED,
    },
};

export const TOKEN_EXPIRY = {
    ACCESS: 15 * 60, // 15 minutes in seconds
    REFRESH: 7 * 24 * 60 * 60, // 7 days in seconds
};

export const RESET_TOKEN_EXPIRY = 3600; // 1 hour
