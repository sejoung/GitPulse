import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AnalysisPeriod = "3m" | "6m" | "1y";
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
  analysisPeriod: AnalysisPeriod;
  excludedPaths: string;
  defaultBranch: string;
  bugKeywords: string;
  emergencyKeywords: string;
  setActiveItem: (item: NavigationItem) => void;
  setWorkspacePath: (path: string) => void;
  setAnalysisPeriod: (period: UiState["analysisPeriod"]) => void;
  setExcludedPaths: (paths: string) => void;
  setDefaultBranch: (branch: string) => void;
  setBugKeywords: (keywords: string) => void;
  setEmergencyKeywords: (keywords: string) => void;
};

type PersistedUiSettings = {
  workspacePath: string;
  analysisPeriod: AnalysisPeriod;
  excludedPaths: string;
  defaultBranch: string;
  bugKeywords: string;
  emergencyKeywords: string;
};

type PersistedUiState = Partial<Omit<PersistedUiSettings, "analysisPeriod">> & {
  analysisPeriod?: AnalysisPeriod | "30d" | "90d" | "all";
};

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

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeItem: "overview",
      workspacePath: "",
      analysisPeriod: "1y",
      excludedPaths: "dist/, node_modules/, target/",
      defaultBranch: "main",
      bugKeywords: "fix, bug, broken",
      emergencyKeywords: "revert, hotfix, emergency, rollback",
      setActiveItem: (activeItem) => set({ activeItem }),
      setWorkspacePath: (workspacePath) => set({ workspacePath }),
      setAnalysisPeriod: (analysisPeriod) => set({ analysisPeriod }),
      setExcludedPaths: (excludedPaths) => set({ excludedPaths }),
      setDefaultBranch: (defaultBranch) => set({ defaultBranch }),
      setBugKeywords: (bugKeywords) => set({ bugKeywords }),
      setEmergencyKeywords: (emergencyKeywords) => set({ emergencyKeywords }),
    }),
    {
      name: "gitpulse.ui",
      version: 2,
      partialize: ({ workspacePath, analysisPeriod, excludedPaths, defaultBranch, bugKeywords, emergencyKeywords }) => ({
        workspacePath,
        analysisPeriod,
        excludedPaths,
        defaultBranch,
        bugKeywords,
        emergencyKeywords,
      }),
      migrate: (persistedState) => {
        const state = persistedState as PersistedUiState;

        return {
          workspacePath: state.workspacePath ?? "",
          analysisPeriod: normalizeAnalysisPeriod(state.analysisPeriod),
          excludedPaths: state.excludedPaths ?? "dist/, node_modules/, target/",
          defaultBranch: state.defaultBranch ?? "main",
          bugKeywords: state.bugKeywords ?? "fix, bug, broken",
          emergencyKeywords: state.emergencyKeywords ?? "revert, hotfix, emergency, rollback",
        };
      },
    },
  ),
);
