import type { AnalysisPeriod, EmergencyPattern } from "../../app/store/ui-store";
import type {
  ActivityPoint,
  DeliveryEvent,
  GitRemoteStatus,
  HotspotFile,
  OverviewAnalysis,
  OwnershipContributor,
} from "../../domains/metrics/overview";

type AnalysisReportInput = {
  generatedAt: string;
  workspacePath: string;
  repositoryName: string;
  branch: string;
  headSha: string | null;
  shortHeadSha: string | null;
  period: AnalysisPeriod;
  remoteStatus: GitRemoteStatus | null;
  excludedPaths: string;
  bugKeywords: string;
  emergencyPatterns: EmergencyPattern[];
  overview: OverviewAnalysis;
  hotspots: HotspotFile[];
  ownership: OwnershipContributor[];
  activity: ActivityPoint[];
  deliveryRisk: DeliveryEvent[];
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function reportBaseName(repositoryName: string, branch: string) {
  const repositorySlug = slugify(repositoryName) || "gitpulse";
  const branchSlug = slugify(branch) || "head";
  return `${repositorySlug}-${branchSlug}-report`;
}

function remoteFreshnessLine(remoteStatus: GitRemoteStatus | null) {
  if (!remoteStatus) {
    return "Not verified";
  }

  switch (remoteStatus.status) {
    case "up_to_date":
      return remoteStatus.upstream
        ? `Verified current against ${remoteStatus.upstream}`
        : "Verified current";
    case "behind":
      return remoteStatus.upstream
        ? `Stale by ${remoteStatus.behind} commits against ${remoteStatus.upstream}`
        : `Stale by ${remoteStatus.behind} commits`;
    case "ahead":
      return remoteStatus.upstream
        ? `Ahead of ${remoteStatus.upstream} by ${remoteStatus.ahead} commits`
        : `Ahead locally by ${remoteStatus.ahead} commits`;
    case "diverged":
      return remoteStatus.upstream
        ? `Diverged from ${remoteStatus.upstream} (+${remoteStatus.ahead}/-${remoteStatus.behind})`
        : `Diverged (+${remoteStatus.ahead}/-${remoteStatus.behind})`;
    case "no_upstream":
      return "No upstream configured";
    case "dirty":
      return "Local changes present";
    case "fetch_failed":
      return remoteStatus.message ?? "Remote verification failed";
    case "pull_failed":
      return remoteStatus.message ?? "Remote pull failed";
    default:
      return "Not verified";
  }
}

export function buildAnalysisReportJson(input: AnalysisReportInput) {
  return JSON.stringify(
    {
      generatedAt: input.generatedAt,
      repository: {
        name: input.repositoryName,
        workspacePath: input.workspacePath,
        branch: input.branch,
        headSha: input.headSha,
        shortHeadSha: input.shortHeadSha,
        analysisWindow: input.period,
        remoteStatus: input.remoteStatus,
        freshness: remoteFreshnessLine(input.remoteStatus),
      },
      settings: {
        excludedPaths: input.excludedPaths,
        bugKeywords: input.bugKeywords,
        emergencyPatterns: input.emergencyPatterns,
      },
      overview: input.overview,
      hotspots: input.hotspots,
      ownership: input.ownership,
      activity: input.activity,
      deliveryRisk: input.deliveryRisk,
    },
    null,
    2
  );
}

export function buildAnalysisReportMarkdown(input: AnalysisReportInput) {
  const hotspotLines =
    input.hotspots.length > 0
      ? input.hotspots
          .slice(0, 10)
          .map(
            (row) =>
              `- ${row.path} | changes: ${row.changes} | fixes: ${row.fixes} | risk: ${row.risk}`
          )
          .join("\n")
      : "- No hotspot rows";
  const ownershipLines =
    input.ownership.length > 0
      ? input.ownership
          .slice(0, 10)
          .map(
            (row) =>
              `- ${row.name} | commits: ${row.commits} | share: ${row.share} | signal: ${row.risk}`
          )
          .join("\n")
      : "- No ownership rows";
  const activityLines =
    input.activity.length > 0
      ? input.activity.map((row) => `- ${row.month}: ${row.commits}`).join("\n")
      : "- No activity rows";
  const deliveryLines =
    input.deliveryRisk.length > 0
      ? input.deliveryRisk
          .map(
            (row) =>
              `- ${row.event} | count: ${row.count} | signal: ${row.signal} | risk: ${row.risk}`
          )
          .join("\n")
      : "- No delivery risk rows";
  const emergencyPatternLines =
    input.emergencyPatterns.length > 0
      ? input.emergencyPatterns.map((row) => `- ${row.pattern} -> ${row.signal}`).join("\n")
      : "- No emergency patterns";

  return [
    "# GitPulse Analysis Report",
    "",
    "## Repository",
    `- Generated at: ${input.generatedAt}`,
    `- Repository: ${input.repositoryName}`,
    `- Workspace: ${input.workspacePath}`,
    `- Branch: ${input.branch}`,
    `- HEAD: ${input.shortHeadSha ?? "Not analyzed"}`,
    `- Analysis window: ${input.period}`,
    `- Analysis freshness: ${remoteFreshnessLine(input.remoteStatus)}`,
    "",
    "## Signal Summary",
    `- Commits: ${input.overview.totalCommits}`,
    `- Hotspots: ${input.overview.hotspotCount}`,
    `- Contributors: ${input.overview.contributorCount}`,
    `- Delivery risk: ${input.overview.deliveryRiskLevel}`,
    "",
    "## Current Settings",
    `- Excluded paths: ${input.excludedPaths || "None"}`,
    `- Bug keywords: ${input.bugKeywords || "None"}`,
    "- Emergency patterns:",
    emergencyPatternLines,
    "",
    "## Hotspots",
    hotspotLines,
    "",
    "## Ownership",
    ownershipLines,
    "",
    "## Activity",
    activityLines,
    "",
    "## Delivery Risk",
    deliveryLines,
    "",
  ].join("\n");
}

export function downloadAnalysisReport(
  repositoryName: string,
  branch: string,
  format: "json" | "md",
  contents: string
) {
  const extension = format === "json" ? "json" : "md";
  const mimeType = format === "json" ? "application/json" : "text/markdown";
  const filename = `${reportBaseName(repositoryName, branch)}.${extension}`;
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
