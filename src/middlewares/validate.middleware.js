import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const normalizeSchemaMap = (schema) => {
    if (!schema) {
        throw new ApiError(500, "Validation schema is required.");
    }

    if (typeof schema.safeParseAsync === "function") {
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

        req.validatedData =
            Object.keys(schemaMap).length === 1 && schemaMap.body
                ? validatedData.body
                : validatedData;

        next();
    });

export default validate;
