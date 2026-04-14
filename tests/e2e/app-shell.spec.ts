import { expect, test } from "./support/fixtures";

test("renders the overview empty state on first load", async ({ appPage }) => {
  await expect(appPage.getByRole("heading", { name: "Signals behind your code" })).toBeVisible();
  await expect(appPage.getByText("Start with a repository")).toBeVisible();
  await expect(appPage.getByRole("button", { name: "Select repository" }).first()).toBeVisible();
  await expect(appPage.getByRole("button", { name: "Overview", exact: true })).toBeVisible();
  await expect(appPage.getByRole("button", { name: "Settings", exact: true })).toBeVisible();
});

test("shows current version in sidebar", async ({ appPage }) => {
  await expect(appPage.getByText(/^v\d+\.\d+\.\d+$/)).toBeVisible();
});
