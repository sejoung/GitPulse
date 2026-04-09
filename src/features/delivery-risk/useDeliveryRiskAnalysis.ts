import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../services/cache/query-keys";
import { getDeliveryRiskAnalysis } from "../../services/tauri/analysis-api";

export function useDeliveryRiskAnalysis(workspacePath: string, emergencyKeywords: string) {
  return useQuery({
    queryKey: queryKeys.deliveryRisk(workspacePath, emergencyKeywords),
    queryFn: () => getDeliveryRiskAnalysis(workspacePath, emergencyKeywords),
  });
}
