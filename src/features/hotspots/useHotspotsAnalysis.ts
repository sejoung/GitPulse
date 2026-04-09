import { useQuery } from "@tanstack/react-query";
import type { AnalysisPeriod } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import { getHotspotsAnalysis } from "../../services/tauri/analysis-api";

export function useHotspotsAnalysis(workspacePath: string, branch: string, period: AnalysisPeriod, excludedPaths: string, bugKeywords: string) {
  return useQuery({
    queryKey: queryKeys.hotspots(workspacePath, branch, period, excludedPaths, bugKeywords),
    queryFn: () => getHotspotsAnalysis({ workspacePath, period, excludedPaths, bugKeywords }),
  });
}
