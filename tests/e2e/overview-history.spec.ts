import { expect, test } from "./support/fixtures";

test.use({
  uiState: {
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
  },
});

test("switches between overview history and export tools", async ({ appPage }) => {
  await expect(appPage.getByRole("heading", { name: "Analysis history" })).toBeVisible();
  await expect(appPage.getByText("Latest HEAD")).toBeVisible();
  await expect(appPage.getByText("Snapshot compare")).toBeVisible();
  await expect(appPage.getByText("Commit delta vs baseline")).toBeVisible();

  await appPage.getByRole("tab", { name: "Analysis report export" }).click();

  await expect(appPage.getByRole("heading", { name: "Analysis report export" })).toBeVisible();
  await expect(appPage.getByRole("button", { name: "Export Markdown" })).toBeVisible();
  await expect(appPage.getByRole("button", { name: "Export JSON" })).toBeVisible();
  await expect(appPage.getByText("Current snapshot only", { exact: true })).toBeVisible();
});
