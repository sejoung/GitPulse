export const queryKeys = {
  overview: (workspacePath: string, period: string, bugKeywords: string, emergencyKeywords: string) =>
    ["overview", workspacePath, period, bugKeywords, emergencyKeywords] as const,
  hotspots: (workspacePath: string, period: string, bugKeywords: string) =>
    ["hotspots", workspacePath, period, bugKeywords] as const,
  ownership: (workspacePath: string) => ["ownership", workspacePath] as const,
  activity: (workspacePath: string) => ["activity", workspacePath] as const,
  deliveryRisk: (workspacePath: string, emergencyKeywords: string) =>
    ["delivery-risk", workspacePath, emergencyKeywords] as const,
};
