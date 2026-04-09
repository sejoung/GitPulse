import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../services/cache/query-keys";
import { getOverviewAnalysis } from "../../services/tauri/analysis-api";

export function useOverviewAnalysis() {
  return useQuery({
    queryKey: queryKeys.overview,
    queryFn: getOverviewAnalysis,
  });
}
