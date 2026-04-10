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
} from "../../domains/metrics/overview";
import type { AnalysisPeriod, EmergencyPattern } from "../../app/store/ui-store";

type AnalysisParams = {
  workspacePath: string;
  period?: AnalysisPeriod;
  excludedPaths?: string;
  bugKeywords?: string;
  emergencyPatterns?: EmergencyPattern[];
};

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

export function getOverviewAnalysis({
  workspacePath,
  period = "1y",
  excludedPaths,
  bugKeywords,
  emergencyPatterns,
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

  return invoke<OverviewAnalysis>("get_overview_analysis", {
    workspacePath,
    period,
    excludedPaths,
    bugKeywords,
    emergencyPatterns,
  });
}

export function getHotspotsAnalysis({
  workspacePath,
  period = "1y",
  excludedPaths,
  bugKeywords,
}: AnalysisParams) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<HotspotFile[]>([]);
  }

  return invoke<HotspotFile[]>("get_hotspots_analysis", {
    workspacePath,
    period,
    excludedPaths,
    bugKeywords,
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

  return invoke<HotspotCommit[]>("get_hotspot_commit_details", {
    workspacePath,
    period,
    bugKeywords,
    filePath,
  });
}

export function getOwnershipAnalysis(workspacePath: string) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<OwnershipContributor[]>([]);
  }

  return invoke<OwnershipContributor[]>("get_ownership_analysis", { workspacePath });
}

export function getActivityAnalysis(workspacePath: string, period: AnalysisPeriod = "1y") {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<ActivityPoint[]>([]);
  }

  return invoke<ActivityPoint[]>("get_activity_analysis", { workspacePath, period });
}

export function getDeliveryRiskAnalysis(
  workspacePath: string,
  emergencyPatterns?: EmergencyPattern[]
) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<DeliveryEvent[]>([]);
  }

  return invoke<DeliveryEvent[]>("get_delivery_risk_analysis", {
    workspacePath,
    emergencyPatterns,
  });
}

export function getGitBranches(workspacePath: string) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<GitBranch[]>([]);
  }

  return invoke<GitBranch[]>("list_git_branches", { workspacePath });
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

  return invoke<GitRepositoryState>("get_git_repository_state", { workspacePath });
}

export function checkoutGitBranch(workspacePath: string, branchName: string) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve(branchName);
  }

  return invoke<string>("checkout_git_branch", { workspacePath, branchName });
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

  return invoke<GitRemoteStatus>("check_git_remote_status", { workspacePath });
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

  return invoke<GitRemoteStatus>("pull_git_remote_updates", { workspacePath });
}
