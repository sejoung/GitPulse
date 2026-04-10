import { expect, test } from "@playwright/test";
import { seedAppState } from "./support/app-state";

test("switches between overview history and export tools", async ({ page }) => {
  await seedAppState(page, {
    activeItem: "overview",
    workspacePath: "/mock/repository",
    selectedBranch: "main",
    analysisRuns: [
      {
        workspacePath: "/mock/repository",
        branch: "main",
        period: "1y",
        headSha: "head-current",
        shortHeadSha: "cur1234",
        recordedAt: "2026-04-10T10:00:00.000Z",
        totalCommits: 30,
        hotspotCount: 6,
        contributorCount: 4,
        deliveryRiskLevel: "medium",
      },
      {
        workspacePath: "/mock/repository",
        branch: "main",
        period: "1y",
        headSha: "head-prev",
        shortHeadSha: "prev123",
        recordedAt: "2026-04-09T10:00:00.000Z",
        totalCommits: 24,
        hotspotCount: 5,
        contributorCount: 3,
        deliveryRiskLevel: "low",
      },
    ],
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Analysis history" })).toBeVisible();
  await expect(page.getByText("Latest HEAD")).toBeVisible();
  await expect(page.getByText("Snapshot compare")).toBeVisible();
  await expect(page.getByText("Commit delta vs baseline")).toBeVisible();

  await page.getByRole("tab", { name: "Analysis report export" }).click();

  await expect(page.getByRole("heading", { name: "Analysis report export" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export Markdown" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export JSON" })).toBeVisible();
  await expect(page.getByText("Current snapshot only", { exact: true })).toBeVisible();
});
