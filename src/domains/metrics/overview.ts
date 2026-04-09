export type OverviewAnalysis = {
  repositoryName: string;
  totalCommits: number;
  hotspotCount: number;
  contributorCount: number;
  deliveryRiskLevel: "low" | "medium" | "high";
};

export type HotspotFile = {
  path: string;
  changes: number;
  fixes: number;
  risk: "healthy" | "watch" | "risky";
};

export type OwnershipContributor = {
  name: string;
  commits: number;
  share: string;
  recentKey: string;
  risk: "healthy" | "watch";
};

export type ActivityPoint = {
  month: string;
  commits: number;
};

export type DeliveryEvent = {
  event: string;
  count: number;
  signal: string;
  signalKey: string;
  risk: "healthy" | "watch" | "risky";
};

export type GitBranch = {
  name: string;
  label: string;
  kind: "local" | "remote";
  current: boolean;
};
