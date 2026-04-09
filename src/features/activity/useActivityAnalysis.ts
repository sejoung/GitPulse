import { useQuery } from "@tanstack/react-query";
import type { AnalysisPeriod } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import { getActivityAnalysis } from "../../services/tauri/analysis-api";

export function useActivityAnalysis(workspacePath: string, period: AnalysisPeriod) {
  return useQuery({
    queryKey: queryKeys.activity(workspacePath, period),
    queryFn: () => getActivityAnalysis(workspacePath, period),
  });
}
