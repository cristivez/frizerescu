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
    // CI serves the PRODUCTION build (created by the workflow's build step):
    // dev-mode compiles routes on demand, which stalled client-side
    // navigations long past their timeouts on CI runners — and prod is what
    // ships anyway. Locally, dev + reuse keeps iteration fast.
    command: process.env.CI ? "npx next start --port 3003" : "npm run dev",
    url: "http://localhost:3003",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
