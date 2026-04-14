import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../services/cache/query-keys";
import { getStalenessAnalysis } from "../../services/tauri/analysis-api";

export function useStalenessAnalysis(
  workspacePath: string,
  headSha: string | null,
  excludedPaths: string,
  staleThresholdDays: number
) {
  return useQuery({
    queryKey: queryKeys.staleness(workspacePath, headSha ?? "", excludedPaths, staleThresholdDays),
    queryFn: () => getStalenessAnalysis({ workspacePath, excludedPaths, staleThresholdDays }),
    enabled: Boolean(workspacePath && headSha),
  });
}
