import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AnalysisPeriod = "3m" | "6m" | "1y";
export type AppLanguage = "ko" | "en";
export type EmergencyPattern = {
  pattern: string;
  signal: string;
};
export type RepositoryOverrideSettings = {
  excludedPaths: string;
  bugKeywords: string;
  emergencyPatterns: EmergencyPattern[];
};
export type AnalysisRunRecord = {
  workspacePath: string;
  branch: string;
  period: AnalysisPeriod;
  headSha: string;
  shortHeadSha: string;
  recordedAt: string;
  totalCommits: number;
  hotspotCount: number;
  contributorCount: number;
  deliveryRiskLevel: "low" | "medium" | "high";
};
export type RiskThresholds = {
  hotspotRiskyChanges: number;
  hotspotRiskyFixes: number;
  hotspotWatchChanges: number;
  hotspotWatchFixes: number;
  deliveryRiskyCount: number;
  deliveryWatchCount: number;
  ownershipWatchPercent: number;
};

const defaultRiskThresholds: RiskThresholds = {
  hotspotRiskyChanges: 20,
  hotspotRiskyFixes: 5,
  hotspotWatchChanges: 10,
  hotspotWatchFixes: 3,
  deliveryRiskyCount: 6,
  deliveryWatchCount: 2,
  ownershipWatchPercent: 60,
};

export type NavigationItem =
  | "overview"
  | "hotspots"
  | "ownership"
  | "activity"
  | "delivery-risk"
  | "cochange"
  | "collaboration"
  | "settings";

type UiState = {
  activeItem: NavigationItem;
  language: AppLanguage;
  developerMode: boolean;
  workspacePath: string;
  selectedBranch: string;
  analysisPeriod: AnalysisPeriod;
  excludedPaths: string;
  defaultBranch: string;
  bugKeywords: string;
  emergencyPatterns: EmergencyPattern[];
  rememberLastRepository: boolean;
  repositoryOverrides: Record<string, RepositoryOverrideSettings>;
  analysisRuns: AnalysisRunRecord[];
  riskThresholds: RiskThresholds;
  dismissedUpdateVersion: string;
  setRiskThresholds: (thresholds: RiskThresholds) => void;
  setDismissedUpdateVersion: (version: string) => void;
  setActiveItem: (item: NavigationItem) => void;
  setLanguage: (language: AppLanguage) => void;
  setDeveloperMode: (enabled: boolean) => void;
  setWorkspacePath: (path: string) => void;
  setSelectedBranch: (branch: string) => void;
  setAnalysisPeriod: (period: UiState["analysisPeriod"]) => void;
  setExcludedPaths: (paths: string) => void;
  setDefaultBranch: (branch: string) => void;
  setBugKeywords: (keywords: string) => void;
  setEmergencyPatterns: (patterns: EmergencyPattern[]) => void;
  setEmergencyPattern: (index: number, pattern: EmergencyPattern) => void;
  setRememberLastRepository: (remember: boolean) => void;
  setRepositoryOverride: (workspacePath: string, settings: RepositoryOverrideSettings) => void;
  setRepositoryOverridePattern: (
    workspacePath: string,
    index: number,
    pattern: EmergencyPattern
  ) => void;
  clearRepositoryOverride: (workspacePath: string) => void;
  addAnalysisRun: (run: AnalysisRunRecord) => void;
  hydrateFromDatabase: (payload: Partial<PersistedUiSettings>) => void;
};

export type PersistedUiSettings = {
  language: AppLanguage;
  developerMode: boolean;
  workspacePath: string;
  selectedBranch: string;
  analysisPeriod: AnalysisPeriod;
  excludedPaths: string;
  defaultBranch: string;
  bugKeywords: string;
  emergencyPatterns: EmergencyPattern[];
  rememberLastRepository: boolean;
  repositoryOverrides: Record<string, RepositoryOverrideSettings>;
  analysisRuns: AnalysisRunRecord[];
  dismissedUpdateVersion: string;
  riskThresholds: RiskThresholds;
};

type PersistedUiState = Partial<Omit<PersistedUiSettings, "analysisPeriod">> & {
  analysisPeriod?: AnalysisPeriod | "30d" | "90d" | "all";
  emergencyKeywords?: string;
  language?: AppLanguage;
  dismissedUpdateVersion?: string;
  riskThresholds?: RiskThresholds;
};

const defaultEmergencyPatterns: EmergencyPattern[] = [
  { pattern: "revert", signal: "Normal recovery" },
  { pattern: "hotfix", signal: "Watch release pressure" },
  { pattern: "emergency", signal: "Emergency response" },
  { pattern: "rollback", signal: "Rollback pattern" },
];

function normalizeAnalysisPeriod(period: unknown): AnalysisPeriod {
  switch (period) {
    case "3m":
    case "30d":
      return "3m";
    case "6m":
    case "90d":
      return "6m";
    case "1y":
    case "all":
      return "1y";
    default:
      return "1y";
  }
}

function emergencyPatternsFromKeywords(keywords?: string): EmergencyPattern[] {
  const patterns = keywords
    ?.split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  if (!patterns?.length) {
    return defaultEmergencyPatterns;
  }

  return patterns.map((pattern) => ({
    pattern,
    signal:
      defaultEmergencyPatterns.find((item) => item.pattern === pattern)?.signal ??
      `${pattern} signal`,
  }));
}

export function getEffectiveRepositorySettings(
  state: Pick<
    UiState,
    "excludedPaths" | "bugKeywords" | "emergencyPatterns" | "repositoryOverrides"
  >,
  workspacePath: string
): RepositoryOverrideSettings {
  const repositoryOverride = workspacePath ? state.repositoryOverrides[workspacePath] : undefined;

  return {
    excludedPaths: repositoryOverride?.excludedPaths ?? state.excludedPaths,
    bugKeywords: repositoryOverride?.bugKeywords ?? state.bugKeywords,
    emergencyPatterns: repositoryOverride?.emergencyPatterns ?? state.emergencyPatterns,
  };
}

export function selectPersistedUiSettings(state: Pick<UiState, keyof PersistedUiSettings>) {
  return {
    language: state.language,
    developerMode: state.developerMode,
    workspacePath: state.rememberLastRepository ? state.workspacePath : "",
    selectedBranch: state.rememberLastRepository ? state.selectedBranch : "",
    analysisPeriod: state.analysisPeriod,
    excludedPaths: state.excludedPaths,
    defaultBranch: state.defaultBranch,
    bugKeywords: state.bugKeywords,
    emergencyPatterns: state.emergencyPatterns,
    rememberLastRepository: state.rememberLastRepository,
    repositoryOverrides: state.repositoryOverrides,
    analysisRuns: state.analysisRuns,
    dismissedUpdateVersion: state.dismissedUpdateVersion,
    riskThresholds: state.riskThresholds,
  };
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeItem: "overview",
      language: "en",
      developerMode: false,
      workspacePath: "",
      selectedBranch: "",
      analysisPeriod: "1y",
      excludedPaths: "dist/, node_modules/, target/",
      defaultBranch: "main",
      bugKeywords: "fix, bug, broken",
      emergencyPatterns: defaultEmergencyPatterns,
      rememberLastRepository: true,
      repositoryOverrides: {},
      analysisRuns: [],
      riskThresholds: defaultRiskThresholds,
      dismissedUpdateVersion: "",
      setRiskThresholds: (riskThresholds) => set({ riskThresholds }),
      setDismissedUpdateVersion: (dismissedUpdateVersion) => set({ dismissedUpdateVersion }),
      setActiveItem: (activeItem) => set({ activeItem }),
      setLanguage: (language) => set({ language }),
      setDeveloperMode: (developerMode) => set({ developerMode }),
      setWorkspacePath: (workspacePath) => set({ workspacePath }),
      setSelectedBranch: (selectedBranch) => set({ selectedBranch }),
      setAnalysisPeriod: (analysisPeriod) => set({ analysisPeriod }),
      setExcludedPaths: (excludedPaths) => set({ excludedPaths }),
      setDefaultBranch: (defaultBranch) => set({ defaultBranch }),
      setBugKeywords: (bugKeywords) => set({ bugKeywords }),
      setEmergencyPatterns: (emergencyPatterns) => set({ emergencyPatterns }),
      setEmergencyPattern: (index, pattern) =>
        set((state) => ({
          emergencyPatterns: state.emergencyPatterns.map((item, itemIndex) =>
            itemIndex === index ? pattern : item
          ),
        })),
      setRememberLastRepository: (rememberLastRepository) =>
        set((state) => ({
          rememberLastRepository,
          workspacePath: rememberLastRepository ? state.workspacePath : "",
          selectedBranch: rememberLastRepository ? state.selectedBranch : "",
        })),
      setRepositoryOverride: (workspacePath, settings) =>
        set((state) => ({
          repositoryOverrides: {
            ...state.repositoryOverrides,
            [workspacePath]: settings,
          },
        })),
      setRepositoryOverridePattern: (workspacePath, index, pattern) =>
        set((state) => ({
          repositoryOverrides: {
            ...state.repositoryOverrides,
            [workspacePath]: {
              ...state.repositoryOverrides[workspacePath],
              emergencyPatterns:
                state.repositoryOverrides[workspacePath]?.emergencyPatterns.map(
                  (item, itemIndex) => (itemIndex === index ? pattern : item)
                ) ?? defaultEmergencyPatterns,
            },
          },
        })),
      clearRepositoryOverride: (workspacePath) =>
        set((state) => {
          const repositoryOverrides = { ...state.repositoryOverrides };
          delete repositoryOverrides[workspacePath];

          return { repositoryOverrides };
        }),
      addAnalysisRun: (run) =>
        set((state) => {
          const duplicateIndex = state.analysisRuns.findIndex(
            (item) =>
              item.workspacePath === run.workspacePath &&
              item.branch === run.branch &&
              item.period === run.period &&
              item.headSha === run.headSha
          );
          const nextRuns =
            duplicateIndex >= 0 ? state.analysisRuns : [run, ...state.analysisRuns].slice(0, 20);

          return {
            analysisRuns: nextRuns,
          };
        }),
      hydrateFromDatabase: (payload) =>
        set((state) => ({
          language: payload.language ?? state.language,
          developerMode: payload.developerMode ?? state.developerMode,
          workspacePath: payload.workspacePath ?? state.workspacePath,
          selectedBranch: payload.selectedBranch ?? state.selectedBranch,
          analysisPeriod: normalizeAnalysisPeriod(payload.analysisPeriod ?? state.analysisPeriod),
          excludedPaths: payload.excludedPaths ?? state.excludedPaths,
          defaultBranch: payload.defaultBranch ?? state.defaultBranch,
          bugKeywords: payload.bugKeywords ?? state.bugKeywords,
          emergencyPatterns: payload.emergencyPatterns ?? state.emergencyPatterns,
          rememberLastRepository: payload.rememberLastRepository ?? state.rememberLastRepository,
          repositoryOverrides: payload.repositoryOverrides ?? state.repositoryOverrides,
          analysisRuns: payload.analysisRuns ?? state.analysisRuns,
          dismissedUpdateVersion: payload.dismissedUpdateVersion ?? state.dismissedUpdateVersion,
          riskThresholds: payload.riskThresholds ?? state.riskThresholds,
        })),
    }),
    {
      name: "gitpulse.ui",
      version: 7,
      partialize: (state) => selectPersistedUiSettings(state),
      migrate: (persistedState) => {
        const state = persistedState as PersistedUiState;

        return {
          language: state.language ?? "en",
          workspacePath: state.workspacePath ?? "",
          selectedBranch: state.selectedBranch ?? "",
          analysisPeriod: normalizeAnalysisPeriod(state.analysisPeriod),
          excludedPaths: state.excludedPaths ?? "dist/, node_modules/, target/",
          defaultBranch: state.defaultBranch ?? "main",
          bugKeywords: state.bugKeywords ?? "fix, bug, broken",
          emergencyPatterns:
            state.emergencyPatterns ?? emergencyPatternsFromKeywords(state.emergencyKeywords),
          rememberLastRepository: state.rememberLastRepository ?? true,
          repositoryOverrides: state.repositoryOverrides ?? {},
          analysisRuns: state.analysisRuns ?? [],
          dismissedUpdateVersion: state.dismissedUpdateVersion ?? "",
          riskThresholds: state.riskThresholds ?? defaultRiskThresholds,
        };
      },
    }
  )
);
