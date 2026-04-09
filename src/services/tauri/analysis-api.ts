import { invoke } from "@tauri-apps/api/core";
import type { OverviewAnalysis } from "../../domains/metrics/overview";

export function getOverviewAnalysis() {
  if (!("__TAURI_INTERNALS__" in window)) {
    return Promise.resolve<OverviewAnalysis>({
      repositoryName: "Browser preview",
      totalCommits: 0,
      hotspotCount: 0,
      contributorCount: 0,
      deliveryRiskLevel: "low",
    });
  }

  return invoke<OverviewAnalysis>("get_overview_analysis");
}
