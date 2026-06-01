import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const normalizeSchemaMap = (schema) => {
    if (!schema) {
        throw new ApiError(500, "Validation schema is required.");
    }

    if (typeof schema.safeParseAsync === "function") {
        if (
            schema.shape &&
            (schema.shape.body || schema.shape.query || schema.shape.params)
        ) {
            const map = {};
            if (schema.shape.body) map.body = schema.shape.body;
            if (schema.shape.query) map.query = schema.shape.query;
            if (schema.shape.params) map.params = schema.shape.params;
            return map;
        }
        return { body: schema };
    }

    return schema;
};

const formatValidationIssues = (issues = []) =>
    issues.map((issue) => ({
        field: issue.path.length > 0 ? issue.path.join(".") : "request",
        message: issue.message,
    }));

const validate = (schema) =>
    asyncHandler(async (req, res, next) => {
        const schemaMap = normalizeSchemaMap(schema);
        const validatedData = {};
        const validationErrors = [];

        for (const target of ["body", "query", "params"]) {
            const targetSchema = schemaMap[target];

            if (!targetSchema) {
                continue;
            }

            const result = await targetSchema.safeParseAsync(req[target]);

            if (!result.success) {
                validationErrors.push(
                    ...formatValidationIssues(result.error.issues)
                );
                continue;
            }

            validatedData[target] = result.data;
        }

        if (validationErrors.length > 0) {
            throw new ApiError(400, "Validation failed", validationErrors);
        }

        if (validatedData.params) {
            for (const [key, value] of Object.entries(validatedData.params)) {
                req.params[key] =
                    typeof value === "bigint" ? value.toString() : value;
            }
        }

        req.validatedData =
            Object.keys(schemaMap).length === 1 && schemaMap.body
                ? validatedData.body
                : validatedData;

        next();
    });

export default validate;
