import { useQuery } from "@tanstack/react-query";
import type { AnalysisPeriod, EmergencyPattern } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import { getOverviewAnalysis } from "../../services/tauri/analysis-api";

export function useOverviewAnalysis(
  workspacePath: string,
  period: AnalysisPeriod,
  bugKeywords: string,
  emergencyPatterns: EmergencyPattern[],
) {
  const emergencyPatternKey = JSON.stringify(emergencyPatterns);

  return useQuery({
    queryKey: queryKeys.overview(workspacePath, period, bugKeywords, emergencyPatternKey),
    queryFn: () => getOverviewAnalysis({ workspacePath, period, bugKeywords, emergencyPatterns }),
  });
}
