import { expect, test } from "./support/fixtures";

test.use({
  uiState: {
    activeItem: "settings",
    workspacePath: "/mock/repository",
  },
});

test("switches settings groups and enables developer mode", async ({ appPage }) => {
  await expect(appPage.getByRole("heading", { name: "Analysis settings" })).toBeVisible();
  await expect(appPage.getByRole("tab", { name: "General", selected: true })).toBeVisible();

  await appPage.getByRole("tab", { name: "Advanced" }).click();

  await expect(appPage.getByRole("heading", { name: "Developer mode" })).toBeVisible();
  await expect(
    appPage.getByText("Turn on Developer mode to view recent log lines here.")
  ).toBeVisible();

  await appPage.getByRole("tab", { name: "On" }).last().click();

  await expect(appPage.getByRole("button", { name: "Copy debug summary" })).toBeVisible();

  await appPage.getByRole("tab", { name: "Repository" }).click();

  await expect(appPage.getByRole("heading", { name: "Repository override" })).toBeVisible();
  await expect(appPage.getByRole("button", { name: "Enable override" })).toBeVisible();
});
