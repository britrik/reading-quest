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
  // reading-quest dev server (/) workflows. Both are managed by the platform
  // workflow runner — Playwright reuses them rather than spawning duplicates.
  webServer: {
    command:
      "echo '[playwright] Reusing existing api-server + reading-quest workflows on http://localhost:80'",
    url: WEB_URL,
    reuseExistingServer: true,
    timeout: 5_000,
  },
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
