import { expect, test } from "@playwright/test";
import { seedAppState } from "./support/app-state";
import { seedTauriMocks } from "./support/tauri-mock";

test("inspects hotspot, ownership, and delivery risk rows", async ({ page }) => {
  await seedAppState(page, {
    workspacePath: "/mock/repository",
    selectedBranch: "main",
  });
  await seedTauriMocks(page);

  await page.goto("/");

  await page.getByRole("button", { name: "Hotspots", exact: true }).click();
  await page
    .getByRole("row", { name: /src\/lib\/report\.ts/ })
    .getByRole("button", { name: "Inspect" })
    .click();
  await expect(page.getByRole("heading", { name: "Hotspot details" })).toBeVisible();
  await expect(
    page.getByText("Review the selected file signal for src/lib/report.ts.")
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Show filters" })).toBeVisible();

  await page.getByRole("button", { name: "Ownership", exact: true }).click();
  await page.getByRole("button", { name: "Inspect" }).first().click();
  await expect(page.getByRole("heading", { name: "Contributor details" })).toBeVisible();
  await expect(page.getByText("Review the selected ownership signal for Alex Kim.")).toBeVisible();

  await page.getByRole("button", { name: "Delivery Risk", exact: true }).click();
  await page.getByRole("button", { name: "Inspect" }).first().click();
  await expect(page.getByRole("heading", { name: "Pattern details" })).toBeVisible();
  await expect(page.getByText("Review the selected emergency pattern for revert.")).toBeVisible();
});
