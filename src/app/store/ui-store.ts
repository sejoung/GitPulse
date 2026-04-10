import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AnalysisPeriod = "3m" | "6m" | "1y";
export type EmergencyPattern = {
  pattern: string;
  signal: string;
};
export type RepositoryOverrideSettings = {
  excludedPaths: string;
  bugKeywords: string;
  emergencyPatterns: EmergencyPattern[];
};
export type NavigationItem =
  | "overview"
  | "hotspots"
  | "ownership"
  | "activity"
  | "delivery-risk"
  | "settings";

type UiState = {
  activeItem: NavigationItem;
  workspacePath: string;
  selectedBranch: string;
  analysisPeriod: AnalysisPeriod;
  excludedPaths: string;
  defaultBranch: string;
  bugKeywords: string;
  emergencyPatterns: EmergencyPattern[];
  rememberLastRepository: boolean;
  repositoryOverrides: Record<string, RepositoryOverrideSettings>;
  setActiveItem: (item: NavigationItem) => void;
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
};

type PersistedUiSettings = {
  workspacePath: string;
  selectedBranch: string;
  analysisPeriod: AnalysisPeriod;
  excludedPaths: string;
  defaultBranch: string;
  bugKeywords: string;
  emergencyPatterns: EmergencyPattern[];
  rememberLastRepository: boolean;
  repositoryOverrides: Record<string, RepositoryOverrideSettings>;
};

type PersistedUiState = Partial<Omit<PersistedUiSettings, "analysisPeriod">> & {
  analysisPeriod?: AnalysisPeriod | "30d" | "90d" | "all";
  emergencyKeywords?: string;
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

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeItem: "overview",
      workspacePath: "",
      selectedBranch: "",
      analysisPeriod: "1y",
      excludedPaths: "dist/, node_modules/, target/",
      defaultBranch: "main",
      bugKeywords: "fix, bug, broken",
      emergencyPatterns: defaultEmergencyPatterns,
      rememberLastRepository: true,
      repositoryOverrides: {},
      setActiveItem: (activeItem) => set({ activeItem }),
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
    }),
    {
      name: "gitpulse.ui",
      version: 5,
      partialize: ({
        workspacePath,
        selectedBranch,
        analysisPeriod,
        excludedPaths,
        defaultBranch,
        bugKeywords,
        emergencyPatterns,
        rememberLastRepository,
        repositoryOverrides,
      }) => ({
        workspacePath: rememberLastRepository ? workspacePath : "",
        selectedBranch: rememberLastRepository ? selectedBranch : "",
        analysisPeriod,
        excludedPaths,
        defaultBranch,
        bugKeywords,
        emergencyPatterns,
        rememberLastRepository,
        repositoryOverrides,
      }),
      migrate: (persistedState) => {
        const state = persistedState as PersistedUiState;

        return {
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
        };
      },
    }
  )
);
