import type { AnalysisPeriod, EmergencyPattern } from "../../app/store/ui-store";
import type {
  ActivityPoint,
  DeliveryEvent,
  GitRemoteStatus,
  HotspotFile,
  OverviewAnalysis,
  OwnershipContributor,
} from "../../domains/metrics/overview";

export type ReportDetailLevel = "summary" | "full";
export type ReportScope = "current" | "compare";

type AnalysisReportComparison = {
  current: {
    branch: string;
    period: AnalysisPeriod;
    shortHeadSha: string;
    deliveryRiskLevel: "low" | "medium" | "high";
  };
  baseline: {
    branch: string;
    period: AnalysisPeriod;
    shortHeadSha: string;
    recordedAt: string;
    totalCommits: number;
    hotspotCount: number;
    contributorCount: number;
    deliveryRiskLevel: "low" | "medium" | "high";
  };
  deltas: {
    commits: number | null;
    hotspots: number | null;
    contributors: number | null;
    riskChanged: boolean;
  };
  scopeChanged: {
    branch: boolean;
    period: boolean;
  };
};

type AnalysisReportInput = {
  generatedAt: string;
  workspacePath: string;
  repositoryName: string;
  branch: string;
  headSha: string | null;
  shortHeadSha: string | null;
  period: AnalysisPeriod;
  detailLevel: ReportDetailLevel;
  scope: ReportScope;
  remoteStatus: GitRemoteStatus | null;
  excludedPaths: string;
  bugKeywords: string;
  emergencyPatterns: EmergencyPattern[];
  overview: OverviewAnalysis;
  hotspots: HotspotFile[];
  ownership: OwnershipContributor[];
  activity: ActivityPoint[];
  deliveryRisk: DeliveryEvent[];
  comparison: AnalysisReportComparison | null;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function formatTimestampForFilename(generatedAt: string) {
  return generatedAt.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildAnalysisReportFilename(
  repositoryName: string,
  branch: string,
  generatedAt: string,
  detailLevel: ReportDetailLevel,
  scope: ReportScope,
  format: "json" | "md"
) {
  const repositorySlug = slugify(repositoryName) || "gitpulse";
  const branchSlug = slugify(branch) || "head";
  const timestamp = formatTimestampForFilename(generatedAt);
  const extension = format === "json" ? "json" : "md";

  return `${repositorySlug}-${branchSlug}-${timestamp}-${detailLevel}-${scope}-report.${extension}`;
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
  const basePayload = {
    generatedAt: input.generatedAt,
    report: {
      detailLevel: input.detailLevel,
      scope: input.scope,
    },
    repository: {
      name: input.repositoryName,
      repositoryPath: input.workspacePath,
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
    comparison: input.comparison,
  };

  if (input.detailLevel === "summary") {
    return JSON.stringify(basePayload, null, 2);
  }

  return JSON.stringify(
    {
      ...basePayload,
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
  const comparisonLines = input.comparison
    ? [
        "## Snapshot Compare",
        `- Current snapshot: ${input.comparison.current.shortHeadSha} | branch: ${input.comparison.current.branch} | window: ${input.comparison.current.period} | risk: ${input.comparison.current.deliveryRiskLevel}`,
        `- Baseline snapshot: ${input.comparison.baseline.shortHeadSha} | branch: ${input.comparison.baseline.branch} | window: ${input.comparison.baseline.period} | risk: ${input.comparison.baseline.deliveryRiskLevel}`,
        `- Baseline recorded at: ${input.comparison.baseline.recordedAt}`,
        `- Commit delta: ${input.comparison.deltas.commits ?? "Not enough history"}`,
        `- Hotspot delta: ${input.comparison.deltas.hotspots ?? "Not enough history"}`,
        `- Contributor delta: ${input.comparison.deltas.contributors ?? "Not enough history"}`,
        `- Risk changed: ${input.comparison.deltas.riskChanged ? "Yes" : "No"}`,
        `- Branch changed: ${input.comparison.scopeChanged.branch ? "Yes" : "No"}`,
        `- Analysis window changed: ${input.comparison.scopeChanged.period ? "Yes" : "No"}`,
        "",
      ].join("\n")
    : "";
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
  const summaryLines = [
    "# GitPulse Analysis Report",
    "",
    "## Report Scope",
    `- Generated at: ${input.generatedAt}`,
    `- Detail level: ${input.detailLevel}`,
    `- Scope: ${input.scope}`,
    "",
    "## Repository",
    `- Repository: ${input.repositoryName}`,
    `- Repository path: ${input.workspacePath}`,
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
  ];

  if (input.comparison) {
    summaryLines.push(comparisonLines);
  }

  if (input.detailLevel === "summary") {
    return summaryLines.join("\n");
  }

  return [
    ...summaryLines,
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
  generatedAt: string,
  detailLevel: ReportDetailLevel,
  scope: ReportScope,
  format: "json" | "md",
  contents: string
) {
  const mimeType = format === "json" ? "application/json" : "text/markdown";
  const filename = buildAnalysisReportFilename(
    repositoryName,
    branch,
    generatedAt,
    detailLevel,
    scope,
    format
  );
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
