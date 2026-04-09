import { useQuery } from "@tanstack/react-query";
import type { AnalysisPeriod } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import { getHotspotsAnalysis } from "../../services/tauri/analysis-api";

export function useHotspotsAnalysis(workspacePath: string, period: AnalysisPeriod, bugKeywords: string) {
  return useQuery({
    queryKey: queryKeys.hotspots(workspacePath, period, bugKeywords),
    queryFn: () => getHotspotsAnalysis({ workspacePath, period, bugKeywords }),
  });
}
