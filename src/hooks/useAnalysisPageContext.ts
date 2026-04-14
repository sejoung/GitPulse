import { useUiStore } from "../app/store/ui-store";
import { useGitRepositoryState } from "../features/overview/useGitBranches";

export function useAnalysisPageContext() {
  const workspacePath = useUiStore((state) => state.workspacePath);
  const selectedBranch = useUiStore((state) => state.selectedBranch);
  const analysisPeriod = useUiStore((state) => state.analysisPeriod);
  const setActiveItem = useUiStore((state) => state.setActiveItem);
  const globalExcludedPaths = useUiStore((state) => state.excludedPaths);
  const globalBugKeywords = useUiStore((state) => state.bugKeywords);
  const globalEmergencyPatterns = useUiStore((state) => state.emergencyPatterns);
  const riskThresholds = useUiStore((state) => state.riskThresholds);
  const repositoryOverride = useUiStore((state) => state.repositoryOverrides[workspacePath]);

  const excludedPaths = repositoryOverride?.excludedPaths ?? globalExcludedPaths;
  const bugKeywords = repositoryOverride?.bugKeywords ?? globalBugKeywords;
  const emergencyPatterns = repositoryOverride?.emergencyPatterns ?? globalEmergencyPatterns;

  const { data: repositoryState } = useGitRepositoryState(workspacePath);
  const headSha = repositoryState?.headSha ?? null;
  const hasWorkspace = Boolean(workspacePath);

  return {
    workspacePath,
    selectedBranch,
    analysisPeriod,
    setActiveItem,
    excludedPaths,
    bugKeywords,
    emergencyPatterns,
    riskThresholds,
    headSha,
    hasWorkspace,
  };
}
