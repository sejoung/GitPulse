export const queryKeys = {
  overview: (workspacePath: string, period: string, excludedPaths: string, bugKeywords: string, emergencyPatterns: string) =>
    ["overview", workspacePath, period, excludedPaths, bugKeywords, emergencyPatterns] as const,
  hotspots: (workspacePath: string, period: string, excludedPaths: string, bugKeywords: string) =>
    ["hotspots", workspacePath, period, excludedPaths, bugKeywords] as const,
  ownership: (workspacePath: string) => ["ownership", workspacePath] as const,
  activity: (workspacePath: string, period: string) => ["activity", workspacePath, period] as const,
  deliveryRisk: (workspacePath: string, emergencyPatterns: string) =>
    ["delivery-risk", workspacePath, emergencyPatterns] as const,
};
