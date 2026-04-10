import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUiStore } from "../../app/store/ui-store";
import { queryKeys } from "../../services/cache/query-keys";
import {
  checkoutGitBranch,
  checkGitRemoteStatus,
  getGitBranches,
  getGitRepositoryState,
  pullGitRemoteUpdates,
} from "../../services/tauri/analysis-api";

export function useGitBranches(workspacePath: string) {
  return useQuery({
    queryKey: queryKeys.branches(workspacePath),
    queryFn: () => getGitBranches(workspacePath),
    enabled: Boolean(workspacePath),
  });
}

export function useGitRepositoryState(workspacePath: string) {
  return useQuery({
    queryKey: queryKeys.repositoryState(workspacePath),
    queryFn: () => getGitRepositoryState(workspacePath),
    enabled: Boolean(workspacePath),
  });
}

export function useCheckoutGitBranch(workspacePath: string) {
  const queryClient = useQueryClient();
  const setSelectedBranch = useUiStore((state) => state.setSelectedBranch);

  return useMutation({
    mutationFn: (branchName: string) => checkoutGitBranch(workspacePath, branchName),
    onSuccess: (branchName) => {
      setSelectedBranch(branchName);
      void queryClient.invalidateQueries({ queryKey: queryKeys.branches(workspacePath) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.repositoryState(workspacePath) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.remoteStatus(workspacePath) });
      void queryClient.invalidateQueries({ queryKey: ["overview"] });
      void queryClient.invalidateQueries({ queryKey: ["hotspots"] });
      void queryClient.invalidateQueries({ queryKey: ["ownership"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
      void queryClient.invalidateQueries({ queryKey: ["delivery-risk"] });
    },
  });
}

export function useCheckGitRemoteStatus(
  workspacePath: string,
  options?: { onSuccess?: () => void }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => checkGitRemoteStatus(workspacePath),
    onSuccess: (remoteStatus) => {
      queryClient.setQueryData(queryKeys.remoteStatus(workspacePath), remoteStatus);
      options?.onSuccess?.();
    },
  });
}

export function usePullGitRemoteUpdates(
  workspacePath: string,
  options?: { onSuccess?: () => void }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => pullGitRemoteUpdates(workspacePath),
    onSuccess: (remoteStatus) => {
      queryClient.setQueryData(queryKeys.remoteStatus(workspacePath), remoteStatus);
      options?.onSuccess?.();
      void queryClient.invalidateQueries({ queryKey: queryKeys.branches(workspacePath) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.repositoryState(workspacePath) });
      void queryClient.invalidateQueries({ queryKey: ["overview"] });
      void queryClient.invalidateQueries({ queryKey: ["hotspots"] });
      void queryClient.invalidateQueries({ queryKey: ["ownership"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
      void queryClient.invalidateQueries({ queryKey: ["delivery-risk"] });
    },
  });
}
