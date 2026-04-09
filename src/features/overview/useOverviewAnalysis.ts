import { useQuery } from "@tanstack/react-query";
import type { AnalysisPeriod } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import { getOverviewAnalysis } from "../../services/tauri/analysis-api";

export function useOverviewAnalysis(
  workspacePath: string,
  period: AnalysisPeriod,
  bugKeywords: string,
  emergencyKeywords: string,
) {
  return useQuery({
    queryKey: queryKeys.overview(workspacePath, period, bugKeywords, emergencyKeywords),
    queryFn: () => getOverviewAnalysis({ workspacePath, period, bugKeywords, emergencyKeywords }),
  });
}
