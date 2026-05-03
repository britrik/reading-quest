import { defineConfig, devices } from "@playwright/test";

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
      command:
        "PORT=5051 ENABLE_E2E_TEST_ROUTES=true E2E_TEST_SECRET=rq-dev-e2e-secret pnpm --filter @workspace/api-server run dev",
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
