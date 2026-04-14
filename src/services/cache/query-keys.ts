export const queryKeys = {
  appUpdate: () => ["app-update"] as const,
  branches: (workspacePath: string) => ["branches", workspacePath] as const,
  repositoryState: (workspacePath: string) => ["repository-state", workspacePath] as const,
  remoteStatus: (workspacePath: string) => ["remote-status", workspacePath] as const,
  overview: (
    workspacePath: string,
    branch: string,
    period: string,
    excludedPaths: string,
    bugKeywords: string,
    emergencyPatterns: string
  ) =>
    [
      "overview",
      workspacePath,
      branch,
      period,
      excludedPaths,
      bugKeywords,
      emergencyPatterns,
    ] as const,
  hotspots: (
    workspacePath: string,
    branch: string,
    period: string,
    excludedPaths: string,
    bugKeywords: string
  ) => ["hotspots", workspacePath, branch, period, excludedPaths, bugKeywords] as const,
  hotspotCommits: (
    workspacePath: string,
    branch: string,
    period: string,
    bugKeywords: string,
    path: string
  ) => ["hotspot-commits", workspacePath, branch, period, bugKeywords, path] as const,
  ownership: (workspacePath: string, branch: string) =>
    ["ownership", workspacePath, branch] as const,
  activity: (workspacePath: string, branch: string, period: string) =>
    ["activity", workspacePath, branch, period] as const,
  deliveryRisk: (workspacePath: string, branch: string, emergencyPatterns: string) =>
    ["delivery-risk", workspacePath, branch, emergencyPatterns] as const,
  settingsMatchPreview: (
    workspacePath: string,
    period: string,
    excludedPaths: string,
    bugKeywords: string,
    emergencyPatterns: string
  ) =>
    [
      "settings-match-preview",
      workspacePath,
      period,
      excludedPaths,
      bugKeywords,
      emergencyPatterns,
    ] as const,
};
