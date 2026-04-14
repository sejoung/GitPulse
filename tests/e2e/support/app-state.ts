import type { Page } from "@playwright/test";

export type PartialUiState = {
  activeItem?: "overview" | "hotspots" | "ownership" | "activity" | "delivery-risk" | "settings";
  language?: "en" | "ko";
  developerMode?: boolean;
  workspacePath?: string;
  selectedBranch?: string;
  analysisPeriod?: "3m" | "6m" | "1y";
  excludedPaths?: string;
  defaultBranch?: string;
  bugKeywords?: string;
  emergencyPatterns?: { pattern: string; signal: string }[];
  rememberLastRepository?: boolean;
  repositoryOverrides?: Record<
    string,
    {
      excludedPaths: string;
      bugKeywords: string;
      emergencyPatterns: { pattern: string; signal: string }[];
    }
  >;
  dismissedUpdateVersion?: string;
  analysisRuns?: {
    workspacePath: string;
    branch: string;
    period: "3m" | "6m" | "1y";
    headSha: string;
    shortHeadSha: string;
    recordedAt: string;
    totalCommits: number;
    hotspotCount: number;
    contributorCount: number;
    deliveryRiskLevel: "low" | "medium" | "high";
  }[];
};

const defaultState = {
  activeItem: "overview",
  language: "en",
  developerMode: false,
  workspacePath: "",
  selectedBranch: "",
  analysisPeriod: "1y",
  excludedPaths: "dist/, node_modules/, target/",
  defaultBranch: "main",
  bugKeywords: "fix, bug, broken",
  emergencyPatterns: [
    { pattern: "revert", signal: "Normal recovery" },
    { pattern: "hotfix", signal: "Watch release pressure" },
    { pattern: "emergency", signal: "Emergency response" },
    { pattern: "rollback", signal: "Rollback pattern" },
  ],
  rememberLastRepository: true,
  repositoryOverrides: {},
  analysisRuns: [],
  dismissedUpdateVersion: "",
  riskThresholds: {
    hotspotRiskyChanges: 20,
    hotspotRiskyFixes: 5,
    hotspotWatchChanges: 10,
    hotspotWatchFixes: 3,
    deliveryRiskyCount: 6,
    deliveryWatchCount: 2,
    ownershipWatchPercent: 60,
  },
} as const;

export async function seedAppState(page: Page, overrides: PartialUiState = {}) {
  const state = {
    ...defaultState,
    ...overrides,
  };

  await page.addInitScript((value) => {
    window.localStorage.setItem(
      "gitpulse.ui",
      JSON.stringify({
        state: value,
        version: 7,
      })
    );
    window.localStorage.setItem("gitpulse.language", value.language);
  }, state);
}
