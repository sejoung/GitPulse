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

export type HotspotCommit = {
  sha: string;
  shortSha: string;
  date: string;
  author: string;
  subject: string;
  matchesBugKeyword: boolean;
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

export type SettingsPatternMatch = {
  pattern: string;
  signal: string;
  count: number;
};

export type SettingsPreviewCommit = {
  shortSha: string;
  date: string;
  author: string;
  subject: string;
};

export type SettingsPatternCommitSample = {
  pattern: string;
  signal: string;
  commits: SettingsPreviewCommit[];
};

export type SettingsMatchPreview = {
  analyzedCommitCount: number;
  bugKeywordCommitCount: number;
  excludedFileCount: number;
  excludedFiles: string[];
  emergencyMatches: SettingsPatternMatch[];
  bugKeywordCommits: SettingsPreviewCommit[];
  emergencyCommitSamples: SettingsPatternCommitSample[];
};

export type GitBranch = {
  name: string;
  label: string;
  kind: "local" | "remote";
  current: boolean;
};

export type GitRemoteStatus = {
  status:
    | "up_to_date"
    | "behind"
    | "ahead"
    | "diverged"
    | "no_upstream"
    | "fetch_failed"
    | "dirty"
    | "pull_failed";
  upstream: string | null;
  ahead: number;
  behind: number;
  message: string | null;
};

export type GitRepositoryState = {
  branch: string | null;
  headSha: string | null;
  shortHeadSha: string | null;
  dirty: boolean;
};

export type AppUpdateInfo = {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  downloadUrl: string;
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

export type CoChangePair = {
  fileA: string;
  fileB: string;
  coChangeCount: number;
  couplingRatio: number;
  signal: "tight" | "moderate" | "loose";
};

export type CoChangeAnalysis = {
  pairs: CoChangePair[];
  analyzedCommitCount: number;
  uniqueFileCount: number;
};
