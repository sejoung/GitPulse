import { invoke } from "@tauri-apps/api/core";
import type {
  ActivityPoint,
  DeliveryEvent,
  HotspotFile,
  OverviewAnalysis,
  OwnershipContributor,
} from "../../domains/metrics/overview";
import type { AnalysisPeriod } from "../../app/store/ui-store";

type AnalysisParams = {
  workspacePath: string;
  period?: AnalysisPeriod;
  bugKeywords?: string;
  emergencyKeywords?: string;
};

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

export function getOverviewAnalysis({ workspacePath, period = "1y", bugKeywords, emergencyKeywords }: AnalysisParams) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<OverviewAnalysis>({
      repositoryName: workspacePath || "No workspace selected",
      totalCommits: 0,
      hotspotCount: 0,
      contributorCount: 0,
      deliveryRiskLevel: "low",
    });
  }

  return invoke<OverviewAnalysis>("get_overview_analysis", { workspacePath, period, bugKeywords, emergencyKeywords });
}

export function getHotspotsAnalysis({ workspacePath, period = "1y", bugKeywords }: AnalysisParams) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<HotspotFile[]>([]);
  }

  return invoke<HotspotFile[]>("get_hotspots_analysis", { workspacePath, period, bugKeywords });
}

export function getOwnershipAnalysis(workspacePath: string) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<OwnershipContributor[]>([]);
  }

  return invoke<OwnershipContributor[]>("get_ownership_analysis", { workspacePath });
}

export function getActivityAnalysis(workspacePath: string) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<ActivityPoint[]>([]);
  }

  return invoke<ActivityPoint[]>("get_activity_analysis", { workspacePath });
}

export function getDeliveryRiskAnalysis(workspacePath: string, emergencyKeywords?: string) {
  if (!isTauriRuntime() || !workspacePath) {
    return Promise.resolve<DeliveryEvent[]>([]);
  }

  return invoke<DeliveryEvent[]>("get_delivery_risk_analysis", { workspacePath, emergencyKeywords });
}
