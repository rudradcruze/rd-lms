/**
 * Jest configuration for ESM (ES Modules) + Node.js 18+
 * Uses --experimental-vm-modules to handle import/export syntax.
 */
export default {
    testEnvironment: "node",
    transform: {}, // No Babel — native ESM
    testMatch: ["**/tests/**/*.test.js"],
    coverageDirectory: "coverage",
    collectCoverageFrom: ["src/**/*.js", "!src/configurations/**"],
    testTimeout: 30000, // 30s per test (DB + Redis round trips)
    verbose: true,
};
