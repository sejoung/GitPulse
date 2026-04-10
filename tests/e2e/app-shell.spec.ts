import { expect, test } from "@playwright/test";

test("renders the overview empty state on first load", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Signals behind your code" })).toBeVisible();
  await expect(page.getByText("Start with a repository")).toBeVisible();
  await expect(page.getByRole("button", { name: "Select repository" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Overview", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeVisible();
});
