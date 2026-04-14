import type { Page } from "@playwright/test";

export type TauriMockPayload = {
  loadLocalDatabase?: {
    settings: Record<string, unknown> | null;
    analysisRuns: unknown[];
  };
  overview?: Record<string, unknown>;
  activity?: Record<string, unknown>[];
  hotspots?: Record<string, unknown>[];
  hotspotCommits?: Record<string, unknown>[];
  ownership?: Record<string, unknown>[];
  deliveryRisk?: Record<string, unknown>[];
  settingsPreview?: Record<string, unknown>;
  logSummary?: {
    logPath: string;
    logDirectory: string;
    latestEntries: string[];
  };
  databaseSummary?: {
    settingsStored: boolean;
    analysisRunCount: number;
    analysisCacheCount: number;
    cachedRepositoryCount: number;
    databasePath: string;
    analysisRunLimit: number;
    analysisCacheLimit: number;
  };
};

const defaultPayload: Required<TauriMockPayload> = {
  loadLocalDatabase: {
    settings: null,
    analysisRuns: [],
  },
  overview: {
    repositoryName: "Mock repository",
    totalCommits: 18,
    hotspotCount: 2,
    contributorCount: 3,
    deliveryRiskLevel: "medium",
  },
  hotspots: [
    { path: "src/App.tsx", changes: 18, fixes: 4, risk: "risky" },
    { path: "src/lib/report.ts", changes: 9, fixes: 1, risk: "watch" },
  ],
  activity: [
    { month: "2026-01", commits: 8 },
    { month: "2026-02", commits: 12 },
    { month: "2026-03", commits: 15 },
    { month: "2026-04", commits: 18 },
    { month: "2026-05", commits: 14 },
    { month: "2026-06", commits: 20 },
  ],
  hotspotCommits: [
    {
      shortSha: "abc1234",
      author: "Alex Kim",
      subject: "fix: stabilize overview refresh",
      date: "2026-04-09",
      matchesBugKeyword: true,
    },
    {
      shortSha: "def5678",
      author: "Beni Lee",
      subject: "refactor: simplify overview cards",
      date: "2026-04-08",
      matchesBugKeyword: false,
    },
  ],
  ownership: [
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
  ],
  deliveryRisk: [
    {
      pattern: "revert",
      event: "revert",
      count: 3,
      risk: "watch",
      signal: "Normal recovery",
      signalKey: "signals.normalRecovery",
    },
    {
      pattern: "hotfix",
      event: "hotfix",
      count: 1,
      risk: "healthy",
      signal: "Watch release pressure",
      signalKey: "signals.watchReleasePressure",
    },
  ],
  settingsPreview: {
    analyzedCommitCount: 0,
    bugKeywordCommitCount: 0,
    excludedFileCount: 0,
    excludedFiles: [],
    emergencyMatches: [],
    bugKeywordCommits: [],
    emergencyCommitSamples: [],
  },
  logSummary: {
    logPath: "/mock/logs/gitpulse.log",
    logDirectory: "/mock/logs",
    latestEntries: [],
  },
  databaseSummary: {
    settingsStored: true,
    analysisRunCount: 2,
    analysisCacheCount: 3,
    cachedRepositoryCount: 1,
    databasePath: "/mock/gitpulse-db.json",
    analysisRunLimit: 20,
    analysisCacheLimit: 50,
  },
};

export async function seedTauriMocks(page: Page, overrides: TauriMockPayload = {}) {
  const payload = {
    ...defaultPayload,
    ...overrides,
  };

  await page.addInitScript((mockPayload) => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: {
        invoke: (command: string) => {
          switch (command) {
            case "load_local_database":
              return mockPayload.loadLocalDatabase;
            case "save_local_database_settings":
            case "save_local_database_analysis_runs":
            case "upsert_local_database_analysis_cache":
            case "append_log_entry":
            case "open_log_file":
            case "open_local_database_directory":
              return null;
            case "get_overview_analysis":
              return mockPayload.overview;
            case "get_hotspots_analysis":
              return mockPayload.hotspots;
            case "get_activity_analysis":
              return mockPayload.activity;
            case "get_hotspot_commit_details":
              return mockPayload.hotspotCommits;
            case "get_ownership_analysis":
              return mockPayload.ownership;
            case "get_delivery_risk_analysis":
              return mockPayload.deliveryRisk;
            case "get_settings_match_preview":
              return mockPayload.settingsPreview;
            case "get_local_database_summary":
              return mockPayload.databaseSummary;
            case "get_log_file_summary":
              return mockPayload.logSummary;
            case "list_git_branches":
              return [];
            case "get_git_repository_state":
              return {
                branch: "main",
                headSha: "mock-head",
                shortHeadSha: "mock123",
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
            case "checkout_git_branch":
              return "main";
            case "check_app_update":
              return {
                currentVersion: "0.1.4",
                latestVersion: "0.1.4",
                hasUpdate: false,
                downloadUrl: "https://sejoung.github.io/GitPulse/",
              };
            default:
              throw new Error(`Unhandled mock invoke command: ${command}`);
          }
        },
      },
    });
  }, payload);
}
