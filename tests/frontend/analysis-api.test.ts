import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkGitRemoteStatus,
  getActivityAnalysis,
  getOverviewAnalysis,
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
});
