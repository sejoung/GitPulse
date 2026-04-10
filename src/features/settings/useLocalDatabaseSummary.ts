import { useQuery } from "@tanstack/react-query";
import { getLocalDatabaseSummary } from "../../services/tauri/local-database";

export function useLocalDatabaseSummary() {
  return useQuery({
    queryKey: ["local-database-summary"],
    queryFn: () => getLocalDatabaseSummary(),
  });
}
