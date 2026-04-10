import { expect, test } from "@playwright/test";
import { seedAppState } from "./support/app-state";

test("switches settings groups and enables developer mode", async ({ page }) => {
  await seedAppState(page, {
    activeItem: "settings",
    workspacePath: "/mock/repository",
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Analysis settings" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "General", selected: true })).toBeVisible();

  await page.getByRole("tab", { name: "Advanced" }).click();

  await expect(page.getByRole("heading", { name: "Developer mode" })).toBeVisible();
  await expect(
    page.getByText("Turn on Developer mode to view recent log lines here.")
  ).toBeVisible();

  await page.getByRole("tab", { name: "On" }).last().click();

  await expect(page.getByRole("button", { name: "Copy debug summary" })).toBeVisible();

  await page.getByRole("tab", { name: "Repository" }).click();

  await expect(page.getByRole("heading", { name: "Repository override" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enable override" })).toBeVisible();
});
