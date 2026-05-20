import config from "./configurations/environment.js";

export const PORT = config.app.port || 8000;

// Password Hashing
export const SALT_ROUNDS = 10;

// Token Expiry Times
export const ACCESS_TOKEN_EXPIRY = "15m";
export const REFRESH_TOKEN_EXPIRY = "7d";

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
