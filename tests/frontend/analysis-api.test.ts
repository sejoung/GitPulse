import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkGitRemoteStatus,
  getActivityAnalysis,
  getHotspotCommitDetails,
  getOverviewAnalysis,
  getSettingsMatchPreview,
  pullGitRemoteUpdates,
} from "../../src/services/tauri/analysis-api";

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

describe("analysis-api runtime guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTauriRuntime(false);
  });

  it("returns empty fallback data without invoking Tauri outside the native runtime", async () => {
    await expect(getActivityAnalysis("/repo", "3m")).resolves.toEqual([]);
    await expect(
      getHotspotCommitDetails({
        workspacePath: "/repo",
        period: "3m",
        bugKeywords: "fix,bug",
        filePath: "",
      })
    ).resolves.toEqual([]);
    await expect(checkGitRemoteStatus("")).resolves.toEqual({
      status: "no_upstream",
      upstream: null,
      ahead: 0,
      behind: 0,
      message: null,
    });
    await expect(pullGitRemoteUpdates("/repo")).resolves.toEqual({
      status: "up_to_date",
      upstream: null,
      ahead: 0,
      behind: 0,
      message: null,
    });
    await expect(
      getSettingsMatchPreview({
        workspacePath: "/repo",
        period: "3m",
        excludedPaths: "dist/",
        bugKeywords: "fix,bug",
        emergencyPatterns: [],
      })
    ).resolves.toEqual({
      analyzedCommitCount: 0,
      bugKeywordCommitCount: 0,
      bugKeywordCommits: [],
      emergencyCommitSamples: [],
      excludedFileCount: 0,
      excludedFiles: [],
      emergencyMatches: [],
    });

    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("passes analysis settings through to the native overview command", async () => {
    setTauriRuntime(true);
    invokeMock.mockResolvedValue({
      repositoryName: "repo",
      totalCommits: 1,
      hotspotCount: 2,
      contributorCount: 3,
      deliveryRiskLevel: "medium",
    });

    await getOverviewAnalysis({
      workspacePath: "/repo",
      period: "3m",
      excludedPaths: "dist/",
      bugKeywords: "fix,bug",
      emergencyPatterns: [{ pattern: "revert, reverted", signal: "Rollback activity" }],
    });

    expect(invokeMock).toHaveBeenCalledWith("get_overview_analysis", {
      workspacePath: "/repo",
      period: "3m",
      excludedPaths: "dist/",
      bugKeywords: "fix,bug",
      emergencyPatterns: [{ pattern: "revert, reverted", signal: "Rollback activity" }],
    });
  });

  it("passes hotspot commit detail settings through to the native command", async () => {
    setTauriRuntime(true);
    invokeMock.mockResolvedValue([]);

    await getHotspotCommitDetails({
      workspacePath: "/repo",
      period: "6m",
      bugKeywords: "fix,bug",
      filePath: "src/app.tsx",
    });

    expect(invokeMock).toHaveBeenCalledWith("get_hotspot_commit_details", {
      workspacePath: "/repo",
      period: "6m",
      bugKeywords: "fix,bug",
      filePath: "src/app.tsx",
    });
  });

  it("passes settings preview inputs through to the native command", async () => {
    setTauriRuntime(true);
    invokeMock.mockResolvedValue({
      analyzedCommitCount: 8,
      bugKeywordCommitCount: 2,
      excludedFileCount: 1,
      excludedFiles: ["dist/index.js"],
      emergencyMatches: [{ pattern: "revert", signal: "Normal recovery", count: 1 }],
      bugKeywordCommits: [],
      emergencyCommitSamples: [],
    });

    await getSettingsMatchPreview({
      workspacePath: "/repo",
      period: "6m",
      excludedPaths: "dist/",
      bugKeywords: "fix,bug",
      emergencyPatterns: [{ pattern: "revert, reverted", signal: "Rollback activity" }],
    });

    expect(invokeMock).toHaveBeenCalledWith("get_settings_match_preview", {
      workspacePath: "/repo",
      period: "6m",
      excludedPaths: "dist/",
      bugKeywords: "fix,bug",
      emergencyPatterns: [{ pattern: "revert, reverted", signal: "Rollback activity" }],
    });
  });
});
