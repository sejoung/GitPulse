import { useQuery } from "@tanstack/react-query";
import type { AnalysisPeriod } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import { getHotspotCommitDetails, getHotspotsAnalysis } from "../../services/tauri/analysis-api";

export function useHotspotsAnalysis(
  workspacePath: string,
  branch: string,
  period: AnalysisPeriod,
  excludedPaths: string,
  bugKeywords: string
) {
  return useQuery({
    queryKey: queryKeys.hotspots(workspacePath, branch, period, excludedPaths, bugKeywords),
    queryFn: () => getHotspotsAnalysis({ workspacePath, period, excludedPaths, bugKeywords }),
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
