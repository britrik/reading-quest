import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Explicit test passcode: the server has no built-in default.
    env: { GROWNUPS_PASSCODE: "rq-test-grownups-2468" },
  },
});
