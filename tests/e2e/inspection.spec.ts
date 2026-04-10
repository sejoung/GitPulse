import { expect, test } from "./support/fixtures";

test.use({
  uiState: {
    workspacePath: "/mock/repository",
    selectedBranch: "main",
  },
  tauriMocks: {},
});

test("inspects hotspot, ownership, and delivery risk rows", async ({ appPage }) => {
  await appPage.getByRole("button", { name: "Hotspots", exact: true }).click();
  await appPage
    .getByRole("row", { name: /src\/lib\/report\.ts/ })
    .getByRole("button", { name: "Inspect" })
    .click();
  await expect(appPage.getByRole("heading", { name: "Hotspot details" })).toBeVisible();
  await expect(
    appPage.getByText("Review the selected file signal for src/lib/report.ts.")
  ).toBeVisible();
  await expect(appPage.getByRole("button", { name: "Show filters" })).toBeVisible();

  await appPage.getByRole("button", { name: "Ownership", exact: true }).click();
  await appPage.getByRole("button", { name: "Inspect" }).first().click();
  await expect(appPage.getByRole("heading", { name: "Contributor details" })).toBeVisible();
  await expect(
    appPage.getByText("Review the selected ownership signal for Alex Kim.")
  ).toBeVisible();

  await appPage.getByRole("button", { name: "Delivery Risk", exact: true }).click();
  await appPage.getByRole("button", { name: "Inspect" }).first().click();
  await expect(appPage.getByRole("heading", { name: "Pattern details" })).toBeVisible();
  await expect(
    appPage.getByText("Review the selected emergency pattern for revert.")
  ).toBeVisible();
});
