import { useQuery } from "@tanstack/react-query";
import type { RiskThresholds } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import { getOwnershipAnalysis } from "../../services/tauri/analysis-api";

export function useOwnershipAnalysis(
  workspacePath: string,
  branch: string,
  riskThresholds: RiskThresholds
) {
  const riskThresholdsKey = JSON.stringify(riskThresholds);

  return useQuery({
    queryKey: queryKeys.ownership(workspacePath, branch, riskThresholdsKey),
    queryFn: () => getOwnershipAnalysis(workspacePath, riskThresholds),
  });
}
