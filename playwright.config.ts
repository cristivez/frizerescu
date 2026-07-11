import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // One retry: a known flake (two WebGL contexts occasionally slowing a test)
  // must not block the predeploy gate or CI; real failures still fail twice.
  retries: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:3003", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3003",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
