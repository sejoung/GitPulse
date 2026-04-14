import { useQuery } from "@tanstack/react-query";
import type { AnalysisPeriod, EmergencyPattern, RiskThresholds } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import { getSettingsMatchPreview } from "../../services/tauri/analysis-api";

export function useSettingsMatchPreview(
  workspacePath: string,
  period: AnalysisPeriod,
  excludedPaths: string,
  bugKeywords: string,
  emergencyPatterns: EmergencyPattern[],
  riskThresholds: RiskThresholds
) {
  const emergencyPatternKey = JSON.stringify(emergencyPatterns);
  const riskThresholdsKey = JSON.stringify(riskThresholds);

  return useQuery({
    queryKey: queryKeys.settingsMatchPreview(
      workspacePath,
      period,
      excludedPaths,
      bugKeywords,
      emergencyPatternKey,
      riskThresholdsKey
    ),
    queryFn: () =>
      getSettingsMatchPreview({
        workspacePath,
        period,
        excludedPaths,
        bugKeywords,
        emergencyPatterns,
        riskThresholds,
      }),
  });
}
