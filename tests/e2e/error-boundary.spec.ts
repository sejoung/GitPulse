import { expect, test } from "@playwright/test";
import { seedAppState } from "./support/app-state";

test("shows the error fallback for an unhandled promise rejection", async ({ page }) => {
  await seedAppState(page, {
    activeItem: "overview",
    developerMode: true,
  });

  await page.goto("/");
  await page.evaluate(() => {
    window.dispatchEvent(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.reject(new Error("E2E rejection")),
        reason: new Error("E2E rejection"),
      })
    );
  });

  await expect(
    page.getByRole("heading", { name: "GitPulse hit an unexpected error" })
  ).toBeVisible();
  await expect(page.locator("p", { hasText: "E2E rejection" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Show log file" })).toBeVisible();
  await expect(page.getByText("Error stack")).toBeVisible();
});
