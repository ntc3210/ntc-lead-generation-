import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 30_000,
    teardownTimeout: 5_000,
    include: ["src/__tests__/**/*.test.ts"],
    // Every test file gets its own temporary data home, so no test can
    // read or write the user's real my-company/ folder.
    setupFiles: ["src/__tests__/leads/setup.ts"],
  },
});
