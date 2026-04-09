import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../services/cache/query-keys";
import { getActivityAnalysis } from "../../services/tauri/analysis-api";

export function useActivityAnalysis(workspacePath: string) {
  return useQuery({
    queryKey: queryKeys.activity(workspacePath),
    queryFn: () => getActivityAnalysis(workspacePath),
  });
}
