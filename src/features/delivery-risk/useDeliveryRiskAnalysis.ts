import { useQuery } from "@tanstack/react-query";
import type { EmergencyPattern, RiskThresholds } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import { getDeliveryRiskAnalysis } from "../../services/tauri/analysis-api";

export function useDeliveryRiskAnalysis(
  workspacePath: string,
  branch: string,
  headSha: string | null,
  emergencyPatterns: EmergencyPattern[],
  riskThresholds: RiskThresholds
) {
  const emergencyPatternKey = JSON.stringify(emergencyPatterns);
  const riskThresholdsKey = JSON.stringify(riskThresholds);

  return useQuery({
    queryKey: queryKeys.deliveryRisk(
      workspacePath,
      branch,
      headSha ?? "",
      emergencyPatternKey,
      riskThresholdsKey
    ),
    queryFn: () => getDeliveryRiskAnalysis(workspacePath, emergencyPatterns, riskThresholds),
    enabled: Boolean(workspacePath && headSha),
  });
}
