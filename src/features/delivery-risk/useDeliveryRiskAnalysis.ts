import { useQuery } from "@tanstack/react-query";
import type { EmergencyPattern } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import { getDeliveryRiskAnalysis } from "../../services/tauri/analysis-api";

export function useDeliveryRiskAnalysis(workspacePath: string, branch: string, emergencyPatterns: EmergencyPattern[]) {
  const emergencyPatternKey = JSON.stringify(emergencyPatterns);

  return useQuery({
    queryKey: queryKeys.deliveryRisk(workspacePath, branch, emergencyPatternKey),
    queryFn: () => getDeliveryRiskAnalysis(workspacePath, emergencyPatterns),
  });
}
