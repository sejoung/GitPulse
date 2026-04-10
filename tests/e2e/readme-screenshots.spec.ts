import path from "node:path";
import { test } from "./support/fixtures";

const assetDir = path.resolve("docs/assets");

test.describe.configure({ mode: "serial" });
test.use({
  viewport: { width: 1440, height: 1100 },
});

test("captures overview screenshot", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "gitpulse.ui",
      JSON.stringify({
        state: {
          activeItem: "overview",
          language: "en",
          developerMode: false,
          workspacePath: "/mock/repository",
          selectedBranch: "main",
          analysisPeriod: "6m",
          excludedPaths: "dist/, node_modules/, target/",
          defaultBranch: "main",
          bugKeywords: "fix, bug, broken",
          emergencyPatterns: [
            { pattern: "revert", signal: "Normal recovery" },
            { pattern: "hotfix", signal: "Watch release pressure" },
            { pattern: "emergency", signal: "Emergency response" },
            { pattern: "rollback", signal: "Rollback pattern" },
          ],
          rememberLastRepository: true,
          repositoryOverrides: {},
          analysisRuns: [
            {
              workspacePath: "/mock/repository",
              branch: "main",
              period: "6m",
              headSha: "head-current",
              shortHeadSha: "cur1234",
              recordedAt: "2026-04-10T10:00:00.000Z",
              totalCommits: 84,
              hotspotCount: 12,
              contributorCount: 6,
              deliveryRiskLevel: "medium",
            },
            {
              workspacePath: "/mock/repository",
              branch: "main",
              period: "6m",
              headSha: "head-prev",
              shortHeadSha: "prev123",
              recordedAt: "2026-04-08T10:00:00.000Z",
              totalCommits: 76,
              hotspotCount: 9,
              contributorCount: 5,
              deliveryRiskLevel: "low",
            },
          ],
        },
        version: 5,
      })
    );
    window.localStorage.setItem("gitpulse.language", "en");
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: {
        invoke: (command: string) => {
          switch (command) {
            case "load_local_database":
              return { settings: null, analysisRuns: [] };
            case "save_local_database_settings":
            case "save_local_database_analysis_runs":
            case "upsert_local_database_analysis_cache":
            case "append_log_entry":
              return null;
            case "get_overview_analysis":
              return {
                repositoryName: "Mock repository",
                totalCommits: 84,
                hotspotCount: 12,
                contributorCount: 6,
                deliveryRiskLevel: "medium",
              };
            case "get_hotspots_analysis":
              return [
                { path: "src/App.tsx", changes: 18, fixes: 4, risk: "risky" },
                { path: "src/lib/report.ts", changes: 9, fixes: 1, risk: "watch" },
              ];
            case "get_activity_analysis":
              return [
                { month: "2026-01", commits: 8 },
                { month: "2026-02", commits: 12 },
                { month: "2026-03", commits: 15 },
                { month: "2026-04", commits: 18 },
                { month: "2026-05", commits: 14 },
                { month: "2026-06", commits: 20 },
              ];
            case "get_ownership_analysis":
              return [
                {
                  name: "Alex Kim",
                  commits: 14,
                  share: "58%",
                  recentKey: "status.active",
                  risk: "watch",
                },
                {
                  name: "Beni Lee",
                  commits: 10,
                  share: "42%",
                  recentKey: "status.active",
                  risk: "healthy",
                },
              ];
            case "get_delivery_risk_analysis":
              return [
                {
                  pattern: "revert",
                  event: "revert",
                  count: 3,
                  risk: "watch",
                  signal: "Normal recovery",
                  signalKey: "signals.normalRecovery",
                },
              ];
            case "list_git_branches":
              return [
                { name: "main", current: true, source: "local" },
                { name: "release/1.0", current: false, source: "remote" },
              ];
            case "get_git_repository_state":
              return {
                branch: "main",
                headSha: "head-current",
                shortHeadSha: "cur1234",
                dirty: false,
              };
            case "check_git_remote_status":
            case "pull_git_remote_updates":
              return {
                status: "up_to_date",
                upstream: "origin/main",
                ahead: 0,
                behind: 0,
                message: null,
              };
            case "get_local_database_summary":
              return {
                settingsStored: true,
                analysisRunCount: 2,
                analysisCacheCount: 3,
                cachedRepositoryCount: 1,
                databasePath: "/mock/gitpulse-db.json",
                analysisRunLimit: 20,
                analysisCacheLimit: 50,
              };
            case "get_log_file_summary":
              return {
                logPath: "/mock/logs/gitpulse.log",
                logDirectory: "/mock/logs",
                latestEntries: [],
              };
            default:
              return [];
          }
        },
      },
    });
  });

  await page.goto("/");
  await page.screenshot({
    path: path.join(assetDir, "overview.png"),
    type: "png",
  });
});

test.describe("hotspots screenshot", () => {
  test.use({
    uiState: {
      activeItem: "hotspots",
      workspacePath: "/mock/repository",
      selectedBranch: "main",
    },
    tauriMocks: {},
  });

  test("captures hotspots screenshot", async ({ appPage }) => {
    await appPage
      .getByRole("row", { name: /src\/lib\/report\.ts/ })
      .getByRole("button", { name: "Inspect" })
      .click();
    await appPage.screenshot({
      path: path.join(assetDir, "hotspots.png"),
      type: "png",
    });
  });
});

test.describe("settings screenshot", () => {
  test.use({
    uiState: {
      activeItem: "settings",
      workspacePath: "/mock/repository",
      developerMode: true,
    },
    tauriMocks: {},
  });

  test("captures settings screenshot", async ({ appPage }) => {
    await appPage.getByRole("tab", { name: "Repository" }).click();
    await appPage.screenshot({
      path: path.join(assetDir, "settings.png"),
      type: "png",
    });
  });
});
