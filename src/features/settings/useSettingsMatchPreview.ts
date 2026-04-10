import { useQuery } from "@tanstack/react-query";
import type { AnalysisPeriod, EmergencyPattern } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import { getSettingsMatchPreview } from "../../services/tauri/analysis-api";

export function useSettingsMatchPreview(
  workspacePath: string,
  period: AnalysisPeriod,
  excludedPaths: string,
  bugKeywords: string,
  emergencyPatterns: EmergencyPattern[]
) {
  const emergencyPatternKey = JSON.stringify(emergencyPatterns);

  return useQuery({
    queryKey: queryKeys.settingsMatchPreview(
      workspacePath,
      period,
      excludedPaths,
      bugKeywords,
      emergencyPatternKey
    ),
    queryFn: () =>
      getSettingsMatchPreview({
        workspacePath,
        period,
        excludedPaths,
        bugKeywords,
        emergencyPatterns,
      }),
  });
}
