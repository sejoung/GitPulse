import { useQuery } from "@tanstack/react-query";
import type { AnalysisPeriod, RiskThresholds } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import { getHotspotCommitDetails, getHotspotsAnalysis } from "../../services/tauri/analysis-api";

export function useHotspotsAnalysis(
  workspacePath: string,
  branch: string,
  headSha: string | null,
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
      headSha ?? "",
      period,
      excludedPaths,
      bugKeywords,
      riskThresholdsKey
    ),
    queryFn: () =>
      getHotspotsAnalysis({ workspacePath, period, excludedPaths, bugKeywords, riskThresholds }),
    enabled: Boolean(workspacePath && headSha),
  });
}

export function useHotspotCommitDetails(
  workspacePath: string,
  branch: string,
  headSha: string | null,
  period: AnalysisPeriod,
  bugKeywords: string,
  path: string
) {
  return useQuery({
    queryKey: queryKeys.hotspotCommits(
      workspacePath,
      branch,
      headSha ?? "",
      period,
      bugKeywords,
      path
    ),
    queryFn: () => getHotspotCommitDetails({ workspacePath, period, bugKeywords, filePath: path }),
    enabled: Boolean(workspacePath && headSha && path),
  });
}
