import config from "../configurations/environment.js";
import logger from "../configurations/logger.js";
import { ApiError } from "../utils/ApiError.js";

const errorMiddleware = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ApiError)) {
        const statusCode = error?.statusCode || error?.status || 500;
        const message = error?.message || "Internal Server Error";
        error = new ApiError(statusCode, message, [], error?.stack || "");
    }

    logger.error({
        message: error.message,
        statusCode: error.statusCode,
        stack: error.stack,
        path: req.originalUrl,
        method: req.method,
    });

    res.status(error.statusCode).json({
        success: error.success,
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors,
        ...(config.app.environment === "development" && {
            stack: error.stack,
        }),
    });
};

export default errorMiddleware;
