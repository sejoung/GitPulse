import { invoke } from "@tauri-apps/api/core";
import type {
  ActivityPoint,
  CoChangeAnalysis,
  CollaborationAnalysis,
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

function tauriQuery<T>(
  command: string,
  fallback: T,
  payload: Record<string, unknown>,
  options?: { guard?: boolean; logSuccess?: boolean }
): Promise<T> {
  if (!isTauriRuntime() || options?.guard === false) {
    return Promise.resolve(fallback);
  }

  return invokeLogged<T>(command, payload, options);
}

export function getOverviewAnalysis({
  workspacePath,
  period = "1y",
  excludedPaths,
  bugKeywords,
  emergencyPatterns,
  riskThresholds,
}: AnalysisParams) {
  return tauriQuery(
    "get_overview_analysis",
    {
      repositoryName: workspacePath || "No workspace selected",
      totalCommits: 0,
      hotspotCount: 0,
      contributorCount: 0,
      deliveryRiskLevel: "low",
    } as OverviewAnalysis,
    { workspacePath, period, excludedPaths, bugKeywords, emergencyPatterns, riskThresholds },
    { guard: Boolean(workspacePath) }
  );
}

export function getHotspotsAnalysis({
  workspacePath,
  period = "1y",
  excludedPaths,
  bugKeywords,
  riskThresholds,
}: AnalysisParams) {
  return tauriQuery<HotspotFile[]>(
    "get_hotspots_analysis",
    [],
    { workspacePath, period, excludedPaths, bugKeywords, riskThresholds },
    { guard: Boolean(workspacePath) }
  );
}

export function getHotspotCommitDetails({
  workspacePath,
  period = "1y",
  bugKeywords,
  filePath,
}: AnalysisParams & { filePath: string }) {
  return tauriQuery<HotspotCommit[]>(
    "get_hotspot_commit_details",
    [],
    { workspacePath, period, bugKeywords, filePath },
    { guard: Boolean(workspacePath && filePath) }
  );
}

export function getOwnershipAnalysis(workspacePath: string, riskThresholds?: RiskThresholds) {
  return tauriQuery<OwnershipContributor[]>(
    "get_ownership_analysis",
    [],
    { workspacePath, riskThresholds },
    { guard: Boolean(workspacePath) }
  );
}

export function getActivityAnalysis(workspacePath: string, period: AnalysisPeriod = "1y") {
  return tauriQuery<ActivityPoint[]>(
    "get_activity_analysis",
    [],
    { workspacePath, period },
    { guard: Boolean(workspacePath) }
  );
}

export function getDeliveryRiskAnalysis(
  workspacePath: string,
  emergencyPatterns?: EmergencyPattern[],
  riskThresholds?: RiskThresholds
) {
  return tauriQuery<DeliveryEvent[]>(
    "get_delivery_risk_analysis",
    [],
    { workspacePath, emergencyPatterns, riskThresholds },
    { guard: Boolean(workspacePath) }
  );
}

export function getSettingsMatchPreview({
  workspacePath,
  period = "1y",
  excludedPaths,
  bugKeywords,
  emergencyPatterns,
  riskThresholds,
}: AnalysisParams) {
  return tauriQuery(
    "get_settings_match_preview",
    {
      analyzedCommitCount: 0,
      bugKeywordCommitCount: 0,
      excludedFileCount: 0,
      excludedFiles: [],
      emergencyMatches: [],
      bugKeywordCommits: [],
      emergencyCommitSamples: [],
    } as SettingsMatchPreview,
    { workspacePath, period, excludedPaths, bugKeywords, emergencyPatterns, riskThresholds },
    { guard: Boolean(workspacePath) }
  );
}

export function getGitBranches(workspacePath: string) {
  return tauriQuery<GitBranch[]>(
    "list_git_branches",
    [],
    { workspacePath },
    { guard: Boolean(workspacePath) }
  );
}

export function getGitRepositoryState(workspacePath: string) {
  return tauriQuery(
    "get_git_repository_state",
    { branch: null, headSha: null, shortHeadSha: null, dirty: false } as GitRepositoryState,
    { workspacePath },
    { guard: Boolean(workspacePath) }
  );
}

export function checkoutGitBranch(workspacePath: string, branchName: string) {
  return tauriQuery(
    "checkout_git_branch",
    branchName,
    { workspacePath, branchName },
    { guard: Boolean(workspacePath), logSuccess: true }
  );
}

export function checkGitRemoteStatus(workspacePath: string) {
  return tauriQuery(
    "check_git_remote_status",
    {
      status: workspacePath ? "up_to_date" : "no_upstream",
      upstream: null,
      ahead: 0,
      behind: 0,
      message: null,
    } as GitRemoteStatus,
    { workspacePath },
    { guard: Boolean(workspacePath), logSuccess: true }
  );
}

export function pullGitRemoteUpdates(workspacePath: string) {
  return tauriQuery(
    "pull_git_remote_updates",
    { status: "up_to_date", upstream: null, ahead: 0, behind: 0, message: null } as GitRemoteStatus,
    { workspacePath },
    { guard: Boolean(workspacePath), logSuccess: true }
  );
}

export function getCoChangeAnalysis({
  workspacePath,
  period = "1y",
  excludedPaths,
  minCoupling,
}: AnalysisParams & { minCoupling?: number }) {
  return tauriQuery(
    "get_cochange_analysis",
    { pairs: [], analyzedCommitCount: 0, uniqueFileCount: 0 } as CoChangeAnalysis,
    { workspacePath, period, excludedPaths, minCoupling },
    { guard: Boolean(workspacePath) }
  );
}

export function getCollaborationAnalysis({
  workspacePath,
  period = "1y",
  excludedPaths,
}: AnalysisParams) {
  return tauriQuery(
    "get_collaboration_analysis",
    { pairs: [], contributorCount: 0, analyzedFileCount: 0 } as CollaborationAnalysis,
    { workspacePath, period, excludedPaths },
    { guard: Boolean(workspacePath) }
  );
}

export function checkAppUpdate() {
  return tauriQuery(
    "check_app_update",
    {
      currentVersion: "0.0.0",
      latestVersion: "0.0.0",
      hasUpdate: false,
      downloadUrl: "",
    } as AppUpdateInfo,
    {}
  );
}
