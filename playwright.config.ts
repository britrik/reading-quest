import { defineConfig, devices } from "@playwright/test";

// Must match tests/e2e/helpers.ts. A reused (already running) api-server must
// be started with the same GROWNUPS_PASSCODE for the grown-ups specs to pass.
const E2E_GROWNUPS_PASSCODE = process.env.E2E_GROWNUPS_PASSCODE || "rq-e2e-grownups-7193";
// Grown-ups bearer-token secret for the E2E api-server; tests/e2e/helpers.ts
// derives the same token. Passed via webServer.env, never shell-interpolated.
const E2E_GROWNUPS_TOKEN_SECRET =
  process.env.E2E_GROWNUPS_TOKEN_SECRET || "rq-e2e-grownups-token-5821";
const WEB_URL = process.env.E2E_BASE_URL || "http://localhost:80";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  retries: 0,
  // The Replit dev proxy on :80 fans out to the api-server (/api/*) and the
  // reading-quest dev server (/) workflows. With `reuseExistingServer: true`,
  // Playwright reuses already-running workflows; otherwise it boots both via
  // the workspace dev scripts (which export ENABLE_E2E_TEST_ROUTES=true and
  // E2E_TEST_SECRET=rq-dev-e2e-secret — matched by tests/e2e/helpers.ts).
  webServer: [
    {
      command: "pnpm --filter @workspace/api-server run dev",
      // Values go through the environment, not the shell, so passcodes with
      // spaces or shell metacharacters stay a single value.
      env: {
        PORT: "5051",
        ENABLE_E2E_TEST_ROUTES: "true",
        E2E_TEST_SECRET: "rq-dev-e2e-secret",
        GROWNUPS_PASSCODE: E2E_GROWNUPS_PASSCODE,
        GROWNUPS_TOKEN_SECRET: E2E_GROWNUPS_TOKEN_SECRET,
      },
      url: "http://localhost:80/api/healthz",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "PORT=5052 pnpm --filter @workspace/reading-quest run dev",
      url: WEB_URL,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
  use: {
    baseURL: WEB_URL,
    trace: "retain-on-failure",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
});
