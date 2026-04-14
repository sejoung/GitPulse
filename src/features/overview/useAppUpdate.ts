import { useQuery } from "@tanstack/react-query";
import { checkAppUpdate } from "../../services/tauri/analysis-api";
import { queryKeys } from "../../services/cache/query-keys";

const SIX_HOURS = 6 * 60 * 60 * 1000;

export function useAppUpdate() {
  return useQuery({
    queryKey: queryKeys.appUpdate(),
    queryFn: checkAppUpdate,
    staleTime: SIX_HOURS,
    refetchOnWindowFocus: false,
  });
}
