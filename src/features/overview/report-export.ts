import { invoke } from "@tauri-apps/api/core";
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

export type AnalysisReportInput = {
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
  format: "json" | "md" | "html"
) {
  const repositorySlug = slugify(repositoryName) || "gitpulse";
  const branchSlug = slugify(branch) || "head";
  const timestamp = formatTimestampForFilename(generatedAt);

  return `${repositorySlug}-${branchSlug}-${timestamp}-${detailLevel}-${scope}-report.${format}`;
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

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function htmlTable(headers: string[], rows: string[][]) {
  const ths = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const trs = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");

  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

export function buildAnalysisReportHtml(input: AnalysisReportInput) {
  const hotspotTable =
    input.hotspots.length > 0
      ? htmlTable(
          ["File", "Changes", "Fixes", "Risk"],
          input.hotspots
            .slice(0, 10)
            .map((r) => [r.path, String(r.changes), String(r.fixes), r.risk])
        )
      : "<p>No hotspot data.</p>";

  const ownershipTable =
    input.ownership.length > 0
      ? htmlTable(
          ["Contributor", "Commits", "Share", "Signal"],
          input.ownership.slice(0, 10).map((r) => [r.name, String(r.commits), r.share, r.risk])
        )
      : "<p>No ownership data.</p>";

  const activityTable =
    input.activity.length > 0
      ? htmlTable(
          ["Month", "Commits", "Anomaly"],
          input.activity.map((r) => [r.month, String(r.commits), r.anomaly ?? "-"])
        )
      : "<p>No activity data.</p>";

  const deliveryTable =
    input.deliveryRisk.length > 0
      ? htmlTable(
          ["Pattern", "Count", "Signal", "Risk"],
          input.deliveryRisk.map((r) => [r.event, String(r.count), r.signal, r.risk])
        )
      : "<p>No delivery risk data.</p>";

  const comparisonSection = input.comparison
    ? `<h2>Snapshot Compare</h2>
       <table>
         <tr><td>Current</td><td>${escapeHtml(input.comparison.current.shortHeadSha)} (${escapeHtml(input.comparison.current.branch)})</td></tr>
         <tr><td>Baseline</td><td>${escapeHtml(input.comparison.baseline.shortHeadSha)} (${escapeHtml(input.comparison.baseline.branch)})</td></tr>
         <tr><td>Commit delta</td><td>${input.comparison.deltas.commits ?? "N/A"}</td></tr>
         <tr><td>Hotspot delta</td><td>${input.comparison.deltas.hotspots ?? "N/A"}</td></tr>
         <tr><td>Risk changed</td><td>${input.comparison.deltas.riskChanged ? "Yes" : "No"}</td></tr>
       </table>`
    : "";

  const fullDetail =
    input.detailLevel === "full"
      ? `<h2>Hotspots</h2>${hotspotTable}
         <h2>Ownership</h2>${ownershipTable}
         <h2>Activity</h2>${activityTable}
         <h2>Delivery Risk</h2>${deliveryTable}`
      : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>GitPulse Report — ${escapeHtml(input.repositoryName)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 32px 24px; font-size: 13px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 15px; margin-top: 24px; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; }
  .meta { color: #666; font-size: 11px; margin-bottom: 16px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
  .summary-card { background: #f7f7f8; border-radius: 6px; padding: 12px; }
  .summary-card .label { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
  .summary-card .value { font-size: 18px; font-weight: 600; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 12px; }
  th { text-align: left; font-weight: 600; border-bottom: 2px solid #e5e5e5; padding: 6px 8px; font-size: 11px; text-transform: uppercase; color: #666; }
  td { border-bottom: 1px solid #f0f0f0; padding: 6px 8px; }
  tr:last-child td { border-bottom: none; }
  @media print { body { padding: 0; } }
</style></head><body>
  <h1>GitPulse Analysis Report</h1>
  <p class="meta">${escapeHtml(input.repositoryName)} &middot; ${escapeHtml(input.branch)} &middot; ${escapeHtml(input.shortHeadSha ?? "N/A")} &middot; ${escapeHtml(input.period)} &middot; ${escapeHtml(input.generatedAt)}</p>

  <div class="summary">
    <div class="summary-card"><div class="label">Commits</div><div class="value">${input.overview.totalCommits}</div></div>
    <div class="summary-card"><div class="label">Hotspots</div><div class="value">${input.overview.hotspotCount}</div></div>
    <div class="summary-card"><div class="label">Contributors</div><div class="value">${input.overview.contributorCount}</div></div>
    <div class="summary-card"><div class="label">Delivery Risk</div><div class="value">${escapeHtml(input.overview.deliveryRiskLevel)}</div></div>
  </div>

  <h2>Repository</h2>
  <table>
    <tr><td>Path</td><td>${escapeHtml(input.workspacePath)}</td></tr>
    <tr><td>Branch</td><td>${escapeHtml(input.branch)}</td></tr>
    <tr><td>HEAD</td><td>${escapeHtml(input.shortHeadSha ?? "N/A")}</td></tr>
    <tr><td>Analysis window</td><td>${escapeHtml(input.period)}</td></tr>
    <tr><td>Freshness</td><td>${escapeHtml(remoteFreshnessLine(input.remoteStatus))}</td></tr>
  </table>

  <h2>Settings</h2>
  <table>
    <tr><td>Excluded paths</td><td>${escapeHtml(input.excludedPaths || "None")}</td></tr>
    <tr><td>Bug keywords</td><td>${escapeHtml(input.bugKeywords || "None")}</td></tr>
    <tr><td>Emergency patterns</td><td>${escapeHtml(input.emergencyPatterns.map((p) => p.pattern).join(", ") || "None")}</td></tr>
  </table>

  ${comparisonSection}
  ${fullDetail}
</body></html>`;
}

export async function saveReportFile(
  repositoryName: string,
  branch: string,
  generatedAt: string,
  detailLevel: ReportDetailLevel,
  scope: ReportScope,
  format: "json" | "md" | "html",
  contents: string
): Promise<boolean> {
  const filename = buildAnalysisReportFilename(
    repositoryName,
    branch,
    generatedAt,
    detailLevel,
    scope,
    format
  );

  if ("__TAURI_INTERNALS__" in window) {
    return invoke<boolean>("save_export_file", { defaultName: filename, contents });
  }

  const mimeType =
    format === "json" ? "application/json" : format === "html" ? "text/html" : "text/markdown";
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);

  return true;
}
