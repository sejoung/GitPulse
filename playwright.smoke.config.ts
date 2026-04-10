import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

export default defineConfig({
  ...baseConfig,
  testMatch: [
    "tests/e2e/app-shell.spec.ts",
    "tests/e2e/settings.spec.ts",
    "tests/e2e/inspection.spec.ts",
  ],
});
