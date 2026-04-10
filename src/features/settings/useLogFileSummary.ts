import { useQuery } from "@tanstack/react-query";
import { getLogFileSummary } from "../../services/tauri/app-log";

export function useLogFileSummary() {
  return useQuery({
    queryKey: ["log-file-summary"],
    queryFn: () => getLogFileSummary(),
  });
}
