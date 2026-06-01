/**
 * Recursively converts BigInt values to strings for JSON serialization.
 */
export function serializeBigInt(value) {
    if (typeof value === "bigint") {
        return value.toString();
    }

    if (value === null || value === undefined) {
        return value;
    }

    if (value instanceof Date) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(serializeBigInt);
    }

    if (typeof value === "object") {
        const result = {};
        for (const [key, val] of Object.entries(value)) {
            result[key] = serializeBigInt(val);
        }
        return result;
    }

    return value;
}
