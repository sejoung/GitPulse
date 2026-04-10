import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLocalDatabaseSummary,
  loadLocalDatabase,
  openLocalDatabaseDirectory,
  saveLocalDatabaseAnalysisRuns,
  saveLocalDatabaseSettings,
  upsertLocalDatabaseAnalysisCache,
} from "../../src/services/tauri/local-database";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const invokeMock = vi.mocked(invoke);

function setTauriRuntime(enabled: boolean) {
  if (enabled) {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: {},
    });
  } else {
    Reflect.deleteProperty(window, "__TAURI_INTERNALS__");
  }
}

describe("local-database api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTauriRuntime(false);
  });

  it("returns safe fallback data outside the native runtime", async () => {
    await expect(loadLocalDatabase()).resolves.toEqual({
      settings: null,
      analysisRuns: [],
    });
    await expect(getLocalDatabaseSummary()).resolves.toEqual({
      settingsStored: false,
      analysisRunCount: 0,
      analysisCacheCount: 0,
      cachedRepositoryCount: 0,
      databasePath: "",
      analysisRunLimit: 20,
      analysisCacheLimit: 50,
    });
    await expect(
      saveLocalDatabaseSettings({ language: "en", workspacePath: "/repo" })
    ).resolves.toBeUndefined();
    await expect(saveLocalDatabaseAnalysisRuns([])).resolves.toBeUndefined();
    await expect(
      upsertLocalDatabaseAnalysisCache({
        workspacePath: "/repo",
        repositoryName: "repo",
        branch: "main",
        period: "3m",
        headSha: "abc123",
        recordedAt: "2026-04-10T00:00:00Z",
        totalCommits: 12,
        hotspotCount: 3,
        contributorCount: 2,
        deliveryRiskLevel: "medium",
      })
    ).resolves.toBeUndefined();
    await expect(openLocalDatabaseDirectory()).resolves.toBeUndefined();

    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("passes local database requests through to native commands", async () => {
    setTauriRuntime(true);
    invokeMock.mockResolvedValue(undefined);

    await loadLocalDatabase();
    await saveLocalDatabaseSettings({
      language: "en",
      workspacePath: "/repo",
      analysisPeriod: "3m",
    });
    await saveLocalDatabaseAnalysisRuns([
      {
        workspacePath: "/repo",
        branch: "main",
        period: "3m",
        headSha: "abc123",
        shortHeadSha: "abc123",
        recordedAt: "2026-04-10T00:00:00Z",
        totalCommits: 12,
        hotspotCount: 3,
        contributorCount: 2,
        deliveryRiskLevel: "medium",
      },
    ]);
    await upsertLocalDatabaseAnalysisCache({
      workspacePath: "/repo",
      repositoryName: "repo",
      branch: "main",
      period: "3m",
      headSha: "abc123",
      recordedAt: "2026-04-10T00:00:00Z",
      totalCommits: 12,
      hotspotCount: 3,
      contributorCount: 2,
      deliveryRiskLevel: "medium",
    });
    await getLocalDatabaseSummary();
    await openLocalDatabaseDirectory();

    expect(invokeMock).toHaveBeenCalledWith("load_local_database", undefined);
    expect(invokeMock).toHaveBeenCalledWith("save_local_database_settings", {
      settings: { language: "en", workspacePath: "/repo", analysisPeriod: "3m" },
    });
    expect(invokeMock).toHaveBeenCalledWith("save_local_database_analysis_runs", {
      runs: [
        {
          workspacePath: "/repo",
          branch: "main",
          period: "3m",
          headSha: "abc123",
          shortHeadSha: "abc123",
          recordedAt: "2026-04-10T00:00:00Z",
          totalCommits: 12,
          hotspotCount: 3,
          contributorCount: 2,
          deliveryRiskLevel: "medium",
        },
      ],
    });
    expect(invokeMock).toHaveBeenCalledWith("upsert_local_database_analysis_cache", {
      entry: {
        workspacePath: "/repo",
        repositoryName: "repo",
        branch: "main",
        period: "3m",
        headSha: "abc123",
        recordedAt: "2026-04-10T00:00:00Z",
        totalCommits: 12,
        hotspotCount: 3,
        contributorCount: 2,
        deliveryRiskLevel: "medium",
      },
    });
    expect(invokeMock).toHaveBeenCalledWith("get_local_database_summary", undefined);
    expect(invokeMock).toHaveBeenCalledWith("open_local_database_directory", undefined);
    expect(invokeMock).toHaveBeenCalledWith("append_log_entry", {
      entry: {
        level: "info",
        source: "tauri:save_local_database_settings",
        message: "Command completed",
        context: JSON.stringify({
          settings: { language: "en", workspacePath: "/repo", analysisPeriod: "3m" },
        }),
      },
    });
  });
});
