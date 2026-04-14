import { useQuery } from "@tanstack/react-query";
import type { AnalysisPeriod } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import { getCollaborationAnalysis } from "../../services/tauri/analysis-api";

export function useCollaborationAnalysis(
  workspacePath: string,
  branch: string,
  headSha: string | null,
  period: AnalysisPeriod,
  excludedPaths: string
) {
  return useQuery({
    queryKey: queryKeys.collaboration(workspacePath, branch, headSha ?? "", period, excludedPaths),
    queryFn: () => getCollaborationAnalysis({ workspacePath, period, excludedPaths }),
    enabled: Boolean(workspacePath && headSha),
  });
}
