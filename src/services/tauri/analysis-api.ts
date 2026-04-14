import { invoke } from "@tauri-apps/api/core";
import type {
  ActivityPoint,
  DeliveryEvent,
  GitBranch,
  GitRepositoryState,
  GitRemoteStatus,
  HotspotCommit,
  HotspotFile,
  OverviewAnalysis,
  OwnershipContributor,
  SettingsMatchPreview,
  AppUpdateInfo,
} from "../../domains/metrics/overview";
import type { AnalysisPeriod, EmergencyPattern, RiskThresholds } from "../../app/store/ui-store";
import { appendAppLog } from "./app-log";

type AnalysisParams = {
  workspacePath: string;
  period?: AnalysisPeriod;
  excludedPaths?: string;
  bugKeywords?: string;
  emergencyPatterns?: EmergencyPattern[];
  riskThresholds?: RiskThresholds;
};

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

async function invokeLogged<T>(
  command: string,
  payload: Record<string, unknown>,
  options?: { logSuccess?: boolean }
) {
  try {
    const result = await invoke<T>(command, payload);
    if (options?.logSuccess) {
      void appendAppLog("info", `tauri:${command}`, "Command completed", payload).catch(
        () => undefined
      );
    }
    return result;
  } catch (error) {
    void appendAppLog("error", `tauri:${command}`, "Command failed", {
      payload,
      error: error instanceof Error ? error.message : String(error),
    }).catch(() => undefined);
    throw error;
  }
}

export function getOverviewAnalysis({
  workspacePath,
  period = "1y",
  excludedPaths,
  bugKeywords,
  emergencyPatterns,
  riskThresholds,
}: AnalysisParams) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<OverviewAnalysis>({
      repositoryName: workspacePath || "No workspace selected",
      totalCommits: 0,
      hotspotCount: 0,
      contributorCount: 0,
      deliveryRiskLevel: "low",
    });
  }

  return invokeLogged<OverviewAnalysis>("get_overview_analysis", {
    workspacePath,
    period,
    excludedPaths,
    bugKeywords,
    emergencyPatterns,
    riskThresholds,
  });
}

export function getHotspotsAnalysis({
  workspacePath,
  period = "1y",
  excludedPaths,
  bugKeywords,
  riskThresholds,
}: AnalysisParams) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<HotspotFile[]>([]);
  }

  return invokeLogged<HotspotFile[]>("get_hotspots_analysis", {
    workspacePath,
    period,
    excludedPaths,
    bugKeywords,
    riskThresholds,
  });
}

export function getHotspotCommitDetails({
  workspacePath,
  period = "1y",
  bugKeywords,
  filePath,
}: AnalysisParams & { filePath: string }) {
  if (!isTauriRuntime() || !workspacePath || !filePath) {
    return Promise.resolve<HotspotCommit[]>([]);
  }

  return invokeLogged<HotspotCommit[]>("get_hotspot_commit_details", {
    workspacePath,
    period,
    bugKeywords,
    filePath,
  });
}

export function getOwnershipAnalysis(workspacePath: string, riskThresholds?: RiskThresholds) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<OwnershipContributor[]>([]);
  }

  return invokeLogged<OwnershipContributor[]>("get_ownership_analysis", {
    workspacePath,
    riskThresholds,
  });
}

export function getActivityAnalysis(workspacePath: string, period: AnalysisPeriod = "1y") {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<ActivityPoint[]>([]);
  }

  return invokeLogged<ActivityPoint[]>("get_activity_analysis", { workspacePath, period });
}

export function getDeliveryRiskAnalysis(
  workspacePath: string,
  emergencyPatterns?: EmergencyPattern[],
  riskThresholds?: RiskThresholds
) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<DeliveryEvent[]>([]);
  }

  return invokeLogged<DeliveryEvent[]>("get_delivery_risk_analysis", {
    workspacePath,
    emergencyPatterns,
    riskThresholds,
  });
}

export function getSettingsMatchPreview({
  workspacePath,
  period = "1y",
  excludedPaths,
  bugKeywords,
  emergencyPatterns,
  riskThresholds,
}: AnalysisParams) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<SettingsMatchPreview>({
      analyzedCommitCount: 0,
      bugKeywordCommitCount: 0,
      excludedFileCount: 0,
      excludedFiles: [],
      emergencyMatches: [],
      bugKeywordCommits: [],
      emergencyCommitSamples: [],
    });
  }

  return invokeLogged<SettingsMatchPreview>("get_settings_match_preview", {
    workspacePath,
    period,
    excludedPaths,
    bugKeywords,
    emergencyPatterns,
    riskThresholds,
  });
}

export function getGitBranches(workspacePath: string) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<GitBranch[]>([]);
  }

  return invokeLogged<GitBranch[]>("list_git_branches", { workspacePath });
}

export function getGitRepositoryState(workspacePath: string) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<GitRepositoryState>({
      branch: null,
      headSha: null,
      shortHeadSha: null,
      dirty: false,
    });
  }

  return invokeLogged<GitRepositoryState>("get_git_repository_state", { workspacePath });
}

export function checkoutGitBranch(workspacePath: string, branchName: string) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve(branchName);
  }

  return invokeLogged<string>(
    "checkout_git_branch",
    { workspacePath, branchName },
    { logSuccess: true }
  );
}

export function checkGitRemoteStatus(workspacePath: string) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<GitRemoteStatus>({
      status: workspacePath ? "up_to_date" : "no_upstream",
      upstream: null,
      ahead: 0,
      behind: 0,
      message: null,
    });
  }

  return invokeLogged<GitRemoteStatus>(
    "check_git_remote_status",
    { workspacePath },
    { logSuccess: true }
  );
}

export function pullGitRemoteUpdates(workspacePath: string) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<GitRemoteStatus>({
      status: "up_to_date",
      upstream: null,
      ahead: 0,
      behind: 0,
      message: null,
    });
  }

  return invokeLogged<GitRemoteStatus>(
    "pull_git_remote_updates",
    { workspacePath },
    { logSuccess: true }
  );
}

export function checkAppUpdate() {
  if (!isTauriRuntime()) {
    return Promise.resolve<AppUpdateInfo>({
      currentVersion: "0.0.0",
      latestVersion: "0.0.0",
      hasUpdate: false,
      downloadUrl: "",
    });
  }

  return invokeLogged<AppUpdateInfo>("check_app_update", {});
}
