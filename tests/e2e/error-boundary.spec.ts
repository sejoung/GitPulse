import { expect, test } from "./support/fixtures";

test.use({
  uiState: {
    activeItem: "overview",
    developerMode: true,
  },
});

test("shows the error fallback for an unhandled promise rejection", async ({ appPage }) => {
  await appPage.evaluate(() => {
    window.dispatchEvent(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.reject(new Error("E2E rejection")),
        reason: new Error("E2E rejection"),
      })
    );
  });

  await expect(
    appPage.getByRole("heading", { name: "GitPulse hit an unexpected error" })
  ).toBeVisible();
  await expect(appPage.locator("p", { hasText: "E2E rejection" })).toBeVisible();
  await expect(appPage.getByRole("button", { name: "Show log file" })).toBeVisible();
  await expect(appPage.getByText("Error stack")).toBeVisible();
});
