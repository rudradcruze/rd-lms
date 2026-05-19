import config from "../configurations/environment.js";
import logger from "../configurations/logger.js";
import { ApiError } from "../utils/ApiError.js";

const errorMiddleware = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ApiError)) {
        error = new ApiError(500, error?.message || "Internal Server Error");
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
        message: error.message,
        errors: error.errors,
        ...(config.app.environment === "development" && {
            stack: error.stack,
        }),
    });
};

export default errorMiddleware;
