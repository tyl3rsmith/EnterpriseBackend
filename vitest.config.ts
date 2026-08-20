import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        globalSetup: "./tests/globalSetup.ts",
        setupFiles: ["./tests/setup.ts"],
        fileParallelism: false, // important since i'm only using one test database and multiple test files running at the same time will cause concurrency issues
    },
});