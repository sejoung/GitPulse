import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../services/cache/query-keys";
import { getOwnershipAnalysis } from "../../services/tauri/analysis-api";

export function useOwnershipAnalysis(workspacePath: string, branch: string) {
  return useQuery({
    queryKey: queryKeys.ownership(workspacePath, branch),
    queryFn: () => getOwnershipAnalysis(workspacePath),
  });
}
