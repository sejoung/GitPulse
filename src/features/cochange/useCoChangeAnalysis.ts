import { useQuery } from "@tanstack/react-query";
import type { AnalysisPeriod } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import { getCoChangeAnalysis } from "../../services/tauri/analysis-api";

export function useCoChangeAnalysis(
  workspacePath: string,
  branch: string,
  headSha: string | null,
  period: AnalysisPeriod,
  excludedPaths: string
) {
  return useQuery({
    queryKey: queryKeys.cochange(workspacePath, branch, headSha ?? "", period, excludedPaths),
    queryFn: () => getCoChangeAnalysis({ workspacePath, period, excludedPaths }),
    enabled: Boolean(workspacePath && headSha),
  });
}
