import { describe, expect, it } from "vitest";
import {
  buildAnalysisReportJson,
  buildAnalysisReportMarkdown,
} from "../../src/features/overview/report-export";

const baseInput = {
  generatedAt: "2026-04-10T01:02:03.000Z",
  workspacePath: "/repo",
  repositoryName: "career-ops",
  branch: "main",
  headSha: "1234567890abcdef",
  shortHeadSha: "1234567",
  period: "3m" as const,
  remoteStatus: {
    status: "behind" as const,
    upstream: "origin/main",
    ahead: 0,
    behind: 2,
    message: null,
  },
  excludedPaths: "dist/, target/",
  bugKeywords: "fix, bug",
  emergencyPatterns: [{ pattern: "revert, reverted", signal: "Rollback activity" }],
  overview: {
    repositoryName: "career-ops",
    totalCommits: 18,
    hotspotCount: 4,
    contributorCount: 3,
    deliveryRiskLevel: "medium" as const,
  },
  hotspots: [{ path: "src/app.tsx", changes: 12, fixes: 3, risk: "watch" as const }],
  ownership: [
    { name: "Beni", commits: 12, share: "67%", recentKey: "status.active", risk: "watch" as const },
  ],
  activity: [{ month: "2026-04", commits: 6 }],
  deliveryRisk: [
    {
      event: "revert, reverted",
      count: 2,
      signal: "Rollback activity",
      signalKey: "signals.normalRecovery",
      risk: "watch" as const,
    },
  ],
};

describe("report-export", () => {
  it("builds a structured JSON report", () => {
    const report = buildAnalysisReportJson(baseInput);
    const parsed = JSON.parse(report) as {
      repository: { branch: string; freshness: string };
      settings: { excludedPaths: string };
      hotspots: { path: string }[];
    };

    expect(parsed.repository.branch).toBe("main");
    expect(parsed.repository.freshness).toContain("Stale by 2");
    expect(parsed.settings.excludedPaths).toBe("dist/, target/");
    expect(parsed.hotspots[0]?.path).toBe("src/app.tsx");
  });

  it("builds a readable Markdown report", () => {
    const report = buildAnalysisReportMarkdown(baseInput);

    expect(report).toContain("# GitPulse Analysis Report");
    expect(report).toContain("- Repository: career-ops");
    expect(report).toContain("- Analysis freshness: Stale by 2 commits against origin/main");
    expect(report).toContain("## Hotspots");
    expect(report).toContain("src/app.tsx | changes: 12 | fixes: 3 | risk: watch");
  });
});
