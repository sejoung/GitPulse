import { defineConfig, devices } from "@playwright/test";
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: ["**/readme-screenshots.spec.ts"],
  fullyParallel: true,
  workers: isCi ? 2 : undefined,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  reporter: isCi ? "list" : "dot",
  expect: {
    timeout: 3_000,
  },
  use: {
    baseURL: "http://127.0.0.1:1420",
    trace: "on-first-retry",
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },
  webServer: {
    command: "npm run dev:vite",
    url: "http://127.0.0.1:1420",
    reuseExistingServer: !isCi,
    timeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
