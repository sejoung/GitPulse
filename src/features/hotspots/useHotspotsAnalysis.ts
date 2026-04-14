import { useQuery } from "@tanstack/react-query";
import type { AnalysisPeriod, RiskThresholds } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import { getHotspotCommitDetails, getHotspotsAnalysis } from "../../services/tauri/analysis-api";

export function useHotspotsAnalysis(
  workspacePath: string,
  branch: string,
  period: AnalysisPeriod,
  excludedPaths: string,
  bugKeywords: string,
  riskThresholds: RiskThresholds
) {
  const riskThresholdsKey = JSON.stringify(riskThresholds);

  return useQuery({
    queryKey: queryKeys.hotspots(
      workspacePath,
      branch,
      period,
      excludedPaths,
      bugKeywords,
      riskThresholdsKey
    ),
    queryFn: () =>
      getHotspotsAnalysis({ workspacePath, period, excludedPaths, bugKeywords, riskThresholds }),
  });
}

export function useHotspotCommitDetails(
  workspacePath: string,
  branch: string,
  period: AnalysisPeriod,
  bugKeywords: string,
  path: string
) {
  return useQuery({
    queryKey: queryKeys.hotspotCommits(workspacePath, branch, period, bugKeywords, path),
    queryFn: () => getHotspotCommitDetails({ workspacePath, period, bugKeywords, filePath: path }),
    enabled: Boolean(workspacePath && path),
  });
}
