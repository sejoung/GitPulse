import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useUiStore } from "../../app/store/ui-store";
import { ChartCard } from "../../components/charts";
import {
  Badge,
  Button,
  DetailPanel,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  Tabs,
  TruncatedCell,
} from "../../components/ui";
import { formatCount } from "../../lib/format";
import { useOverviewAnalysis } from "./useOverviewAnalysis";
import { useActivityAnalysis } from "../activity/useActivityAnalysis";
import { useDeliveryRiskAnalysis } from "../delivery-risk/useDeliveryRiskAnalysis";
import { useHotspotsAnalysis } from "../hotspots/useHotspotsAnalysis";
import { useOwnershipAnalysis } from "../ownership/useOwnershipAnalysis";
import { useWorkspacePrompt } from "../workspace/useWorkspacePrompt";
import {
  useCheckoutGitBranch,
  useCheckGitRemoteStatus,
  useGitBranches,
  useGitRepositoryState,
  usePullGitRemoteUpdates,
} from "./useGitBranches";
import type { GitRemoteStatus } from "../../domains/metrics/overview";
import {
  buildAnalysisReportHtml,
  buildAnalysisReportJson,
  buildAnalysisReportMarkdown,
  saveReportFile,
  type ReportDetailLevel,
  type ReportScope,
} from "./report-export";
import { upsertLocalDatabaseAnalysisCache } from "../../services/tauri/local-database";

const periodTabs = [
  { id: "1y", labelKey: "settings:defaults.analysisWindows.1y" },
  { id: "6m", labelKey: "settings:defaults.analysisWindows.6m" },
  { id: "3m", labelKey: "settings:defaults.analysisWindows.3m" },
] as const;

const REMOTE_CHECK_STALE_MS = 5 * 60 * 1000;
const REMOTE_CHECK_TICK_MS = 60 * 1000;

function remoteStatusTone(status?: GitRemoteStatus["status"]) {
  switch (status) {
    case "up_to_date":
      return "healthy";
    case "behind":
    case "diverged":
      return "watch";
    case "fetch_failed":
    case "dirty":
    case "pull_failed":
      return "critical";
    case "ahead":
      return "brand";
    default:
      return "neutral";
  }
}

function freshnessTone(status?: GitRemoteStatus["status"]) {
  switch (status) {
    case "up_to_date":
      return "healthy";
    case "behind":
    case "diverged":
      return "watch";
    case "fetch_failed":
    case "pull_failed":
    case "dirty":
      return "critical";
    case "ahead":
      return "brand";
    default:
      return "neutral";
  }
}

export function OverviewPage() {
  const { t } = useTranslation(["overview", "common", "settings"]);
  const queryClient = useQueryClient();
  const [exportMessage, setExportMessage] = useState("");
  const [secondarySection, setSecondarySection] = useState<"history" | "export">("history");
  const [comparisonHeadSha, setComparisonHeadSha] = useState("");
  const [exportDetailLevel, setExportDetailLevel] = useState<ReportDetailLevel>("full");
  const [exportScope, setExportScope] = useState<ReportScope>("current");
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());
  const [remoteCheckState, setRemoteCheckState] = useState<{
    contextKey: string;
    checkedAt: number | null;
  }>({
    contextKey: "",
    checkedAt: null,
  });
  const workspacePath = useUiStore((state) => state.workspacePath);
  const selectedBranch = useUiStore((state) => state.selectedBranch);
  const analysisPeriod = useUiStore((state) => state.analysisPeriod);
  const globalExcludedPaths = useUiStore((state) => state.excludedPaths);
  const globalBugKeywords = useUiStore((state) => state.bugKeywords);
  const globalEmergencyPatterns = useUiStore((state) => state.emergencyPatterns);
  const riskThresholds = useUiStore((state) => state.riskThresholds);
  const repositoryOverride = useUiStore((state) => state.repositoryOverrides[workspacePath]);
  const excludedPaths = repositoryOverride?.excludedPaths ?? globalExcludedPaths;
  const bugKeywords = repositoryOverride?.bugKeywords ?? globalBugKeywords;
  const emergencyPatterns = repositoryOverride?.emergencyPatterns ?? globalEmergencyPatterns;
  const setAnalysisPeriod = useUiStore((state) => state.setAnalysisPeriod);
  const setSelectedBranch = useUiStore((state) => state.setSelectedBranch);
  const setWorkspacePath = useUiStore((state) => state.setWorkspacePath);
  const setActiveItem = useUiStore((state) => state.setActiveItem);
  const analysisRuns = useUiStore((state) => state.analysisRuns);
  const addAnalysisRun = useUiStore((state) => state.addAnalysisRun);
  const selectWorkspace = useWorkspacePrompt();
  const { data: branches = [], isLoading: isBranchLoading } = useGitBranches(workspacePath);
  const { data: repositoryState, isError: isRepositoryStateError } =
    useGitRepositoryState(workspacePath);
  const checkoutBranch = useCheckoutGitBranch(workspacePath);
  const pullRemoteUpdates = usePullGitRemoteUpdates(workspacePath, {
    onSuccess: () =>
      setRemoteCheckState({
        contextKey: `${workspacePath}:${repositoryState?.branch ?? selectedBranch}`,
        checkedAt: Date.now(),
      }),
  });
  const resetPullRemoteUpdates = pullRemoteUpdates.reset;
  const {
    data: checkedRemoteStatus,
    error: remoteStatusError,
    isError: isRemoteStatusError,
    isPending: isRemoteStatusPending,
    mutate: checkRemoteStatus,
    reset: resetRemoteStatus,
  } = useCheckGitRemoteStatus(workspacePath, {
    onSuccess: () =>
      setRemoteCheckState({
        contextKey: `${workspacePath}:${repositoryState?.branch ?? selectedBranch}`,
        checkedAt: Date.now(),
      }),
  });
  const remoteStatus = pullRemoteUpdates.data ?? checkedRemoteStatus;
  const currentBranch = branches.find((branch) => branch.current)?.name ?? "";
  const activeBranch = selectedBranch || currentBranch || (repositoryState?.branch ?? "");
  const remoteCheckContextKey = `${workspacePath}:${activeBranch}`;
  const lastRemoteCheckedAt =
    remoteCheckState.contextKey === remoteCheckContextKey ? remoteCheckState.checkedAt : null;
  const headSha = repositoryState?.headSha ?? null;
  const { data, isLoading, isError } = useOverviewAnalysis(
    workspacePath,
    activeBranch,
    headSha,
    analysisPeriod,
    excludedPaths,
    bugKeywords,
    emergencyPatterns,
    riskThresholds
  );
  const { data: hotspotRows = [] } = useHotspotsAnalysis(
    workspacePath,
    activeBranch,
    headSha,
    analysisPeriod,
    excludedPaths,
    bugKeywords,
    riskThresholds
  );
  const { data: activityRows = [] } = useActivityAnalysis(
    workspacePath,
    activeBranch,
    headSha,
    analysisPeriod
  );
  const { data: ownershipRows = [] } = useOwnershipAnalysis(
    workspacePath,
    activeBranch,
    headSha,
    riskThresholds
  );
  const { data: deliveryRows = [] } = useDeliveryRiskAnalysis(
    workspacePath,
    activeBranch,
    headSha,
    emergencyPatterns,
    riskThresholds
  );
  const translatedPeriodTabs = periodTabs.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
  }));
  const repositoryHistory = analysisRuns.filter((run) => run.workspacePath === workspacePath);
  const latestRecordedRun = repositoryHistory[0];
  const previousRecordedRun = repositoryHistory[1];
  const effectiveComparisonHeadSha =
    comparisonHeadSha && repositoryHistory.some((run) => run.headSha === comparisonHeadSha)
      ? comparisonHeadSha
      : (previousRecordedRun?.headSha ?? "");
  const comparisonRun =
    repositoryHistory.find((run) => run.headSha === effectiveComparisonHeadSha) ??
    previousRecordedRun ??
    null;
  const commitDelta =
    latestRecordedRun && previousRecordedRun
      ? latestRecordedRun.totalCommits - previousRecordedRun.totalCommits
      : null;
  const hotspotDelta =
    latestRecordedRun && previousRecordedRun
      ? latestRecordedRun.hotspotCount - previousRecordedRun.hotspotCount
      : null;
  const hasWorkspace = Boolean(workspacePath);
  const maxActivityCommits = Math.max(1, ...activityRows.map((row) => row.commits));
  const initialValue = t("common:status.notAnalyzed");
  const initialEmptyText = t("common:empty.selectWorkspace");
  const remoteStatusLabel = remoteStatus
    ? t(`workspaceDetails.remoteStatus.${remoteStatus.status}`, {
        ahead: remoteStatus.ahead,
        behind: remoteStatus.behind,
      })
    : t("workspaceDetails.remoteStatus.notChecked");
  const remoteStatusDescription = remoteStatus?.upstream
    ? t("workspaceDetails.remoteStatus.upstream", { upstream: remoteStatus.upstream })
    : remoteStatus?.status === "no_upstream"
      ? t("workspaceDetails.remoteStatus.noUpstreamDescription")
      : remoteStatus?.status === "dirty"
        ? t("workspaceDetails.remoteStatus.dirtyDescription")
        : (remoteStatus?.message ?? t("workspaceDetails.remoteStatus.description"));
  const freshnessLabel = remoteStatus
    ? t(`freshness.status.${remoteStatus.status}`, {
        ahead: remoteStatus.ahead,
        behind: remoteStatus.behind,
      })
    : t("freshness.status.notChecked");
  const freshnessDescription = remoteStatus?.upstream
    ? t(`freshness.description.${remoteStatus.status}`, {
        upstream: remoteStatus.upstream,
        ahead: remoteStatus.ahead,
        behind: remoteStatus.behind,
      })
    : remoteStatus?.status === "fetch_failed" || remoteStatus?.status === "pull_failed"
      ? (remoteStatus.message ?? t("freshness.description.fetch_failed"))
      : remoteStatus?.status === "dirty"
        ? t("freshness.description.dirty")
        : remoteStatus?.status === "no_upstream"
          ? t("freshness.description.no_upstream")
          : t("freshness.description.notChecked");
  const remoteCheckAgeMs = lastRemoteCheckedAt ? nowTimestamp - lastRemoteCheckedAt : null;
  const isRemoteCheckStale = Boolean(
    remoteStatus && remoteCheckAgeMs !== null && remoteCheckAgeMs >= REMOTE_CHECK_STALE_MS
  );
  const freshnessCheckLabel = !lastRemoteCheckedAt
    ? t("freshness.check.notChecked")
    : isRemoteCheckStale
      ? t("freshness.check.stale")
      : t("freshness.check.fresh");
  const freshnessCheckDescription = !lastRemoteCheckedAt
    ? t("freshness.check.description.notChecked")
    : t(
        isRemoteCheckStale
          ? "freshness.check.description.stale"
          : "freshness.check.description.fresh",
        {
          checkedAt: new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(lastRemoteCheckedAt)),
        }
      );
  const freshnessCheckTone = !lastRemoteCheckedAt
    ? "neutral"
    : isRemoteCheckStale
      ? "watch"
      : "healthy";
  const lastAnalyzedAt = data
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date())
    : t("common:status.notAnalyzed");
  const canPullRemoteUpdates = Boolean(hasWorkspace && remoteStatus?.status === "behind");
  const isRepositoryActionPending =
    checkoutBranch.isPending || isRemoteStatusPending || pullRemoteUpdates.isPending;
  const selectedComparisonHeadSha = comparisonRun?.headSha ?? "";
  const comparisonSummary = latestRecordedRun
    ? {
        periodChanged: comparisonRun ? latestRecordedRun.period !== comparisonRun.period : false,
        branchChanged: comparisonRun ? latestRecordedRun.branch !== comparisonRun.branch : false,
        commitDelta: comparisonRun
          ? latestRecordedRun.totalCommits - comparisonRun.totalCommits
          : null,
        hotspotDelta: comparisonRun
          ? latestRecordedRun.hotspotCount - comparisonRun.hotspotCount
          : null,
        contributorDelta: comparisonRun
          ? latestRecordedRun.contributorCount - comparisonRun.contributorCount
          : null,
        riskChanged: comparisonRun
          ? latestRecordedRun.deliveryRiskLevel !== comparisonRun.deliveryRiskLevel
          : false,
      }
    : null;
  const comparisonCommitDeltaText =
    comparisonSummary?.commitDelta === null || comparisonSummary?.commitDelta === undefined
      ? t("history.compare.notEnough")
      : `${comparisonSummary.commitDelta > 0 ? "+" : ""}${comparisonSummary.commitDelta}`;
  const comparisonHotspotDeltaText =
    comparisonSummary?.hotspotDelta === null || comparisonSummary?.hotspotDelta === undefined
      ? t("history.compare.notEnough")
      : `${comparisonSummary.hotspotDelta > 0 ? "+" : ""}${comparisonSummary.hotspotDelta}`;
  const comparisonContributorDeltaText =
    comparisonSummary?.contributorDelta === null ||
    comparisonSummary?.contributorDelta === undefined
      ? t("history.compare.notEnough")
      : `${comparisonSummary.contributorDelta > 0 ? "+" : ""}${comparisonSummary.contributorDelta}`;
  const canExportComparison = Boolean(latestRecordedRun && comparisonRun);
  const exportIncludesValue = t(
    exportDetailLevel === "summary" ? "export.includesValueSummary" : "export.includesValueFull"
  );
  const exportFormatValue = t(
    exportScope === "compare" ? "export.formatValueCompare" : "export.formatValueCurrent"
  );
  const exportScopeValue =
    exportScope === "compare"
      ? canExportComparison
        ? `${comparisonRun?.shortHeadSha ?? ""} -> ${latestRecordedRun?.shortHeadSha ?? ""}`
        : t("export.scopeUnavailable")
      : t("export.scopeCurrent");

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, REMOTE_CHECK_TICK_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  function refreshAnalysis() {
    void queryClient.invalidateQueries({ queryKey: ["repository-state"] });
    void queryClient.invalidateQueries({ queryKey: ["overview"] });
    void queryClient.invalidateQueries({ queryKey: ["hotspots"] });
    void queryClient.invalidateQueries({ queryKey: ["ownership"] });
    void queryClient.invalidateQueries({ queryKey: ["activity"] });
    void queryClient.invalidateQueries({ queryKey: ["delivery-risk"] });
    void queryClient.invalidateQueries({ queryKey: ["cochange"] });
    void queryClient.invalidateQueries({ queryKey: ["collaboration"] });
    void queryClient.invalidateQueries({ queryKey: ["staleness"] });
  }

  function buildReportInput() {
    const generatedAt = new Date().toISOString();
    const comparison =
      exportScope === "compare" && latestRecordedRun && comparisonRun
        ? {
            current: {
              branch: latestRecordedRun.branch,
              period: latestRecordedRun.period,
              shortHeadSha: latestRecordedRun.shortHeadSha,
              deliveryRiskLevel: latestRecordedRun.deliveryRiskLevel,
            },
            baseline: {
              branch: comparisonRun.branch,
              period: comparisonRun.period,
              shortHeadSha: comparisonRun.shortHeadSha,
              recordedAt: comparisonRun.recordedAt,
              totalCommits: comparisonRun.totalCommits,
              hotspotCount: comparisonRun.hotspotCount,
              contributorCount: comparisonRun.contributorCount,
              deliveryRiskLevel: comparisonRun.deliveryRiskLevel,
            },
            deltas: {
              commits: comparisonSummary?.commitDelta ?? null,
              hotspots: comparisonSummary?.hotspotDelta ?? null,
              contributors: comparisonSummary?.contributorDelta ?? null,
              riskChanged: comparisonSummary?.riskChanged ?? false,
            },
            scopeChanged: {
              branch: comparisonSummary?.branchChanged ?? false,
              period: comparisonSummary?.periodChanged ?? false,
            },
          }
        : null;

    return {
      generatedAt,
      workspacePath,
      repositoryName: data!.repositoryName,
      branch: activeBranch,
      headSha: repositoryState?.headSha ?? null,
      shortHeadSha: repositoryState?.shortHeadSha ?? null,
      period: analysisPeriod,
      detailLevel: exportDetailLevel,
      scope: exportScope,
      remoteStatus: remoteStatus ?? null,
      excludedPaths,
      bugKeywords,
      emergencyPatterns,
      overview: data!,
      hotspots: hotspotRows,
      ownership: ownershipRows,
      activity: activityRows,
      deliveryRisk: deliveryRows,
      comparison,
    };
  }

  function exportReport(format: "json" | "md") {
    if (!workspacePath || !activeBranch || !data) {
      setExportMessage(t("export.empty"));
      return;
    }
    if (exportScope === "compare" && !canExportComparison) {
      setExportMessage(t("export.compareUnavailable"));
      return;
    }

    const reportInput = buildReportInput();
    const contents =
      format === "json"
        ? buildAnalysisReportJson(reportInput)
        : buildAnalysisReportMarkdown(reportInput);

    void saveReportFile(
      data.repositoryName,
      activeBranch,
      reportInput.generatedAt,
      exportDetailLevel,
      exportScope,
      format,
      contents
    ).then((saved) => {
      if (saved) setExportMessage(t(`export.success.${format}`));
    });
  }

  function exportHtml() {
    if (!workspacePath || !activeBranch || !data) {
      setExportMessage(t("export.empty"));
      return;
    }

    const reportInput = buildReportInput();
    const html = buildAnalysisReportHtml(reportInput);

    void saveReportFile(
      data.repositoryName,
      activeBranch,
      reportInput.generatedAt,
      exportDetailLevel,
      exportScope,
      "html",
      html
    ).then((saved) => {
      if (saved) setExportMessage(t("export.success.html"));
    });
  }

  useEffect(() => {
    if (!selectedBranch && currentBranch) {
      setSelectedBranch(currentBranch);
    }
  }, [currentBranch, selectedBranch, setSelectedBranch]);

  useEffect(() => {
    resetRemoteStatus();
    resetPullRemoteUpdates();
  }, [activeBranch, resetPullRemoteUpdates, resetRemoteStatus, workspacePath]);

  useEffect(() => {
    if (workspacePath && isRepositoryStateError) {
      setWorkspacePath("");
      setSelectedBranch("");
    }
  }, [isRepositoryStateError, setSelectedBranch, setWorkspacePath, workspacePath]);

  useEffect(() => {
    if (
      !workspacePath ||
      !activeBranch ||
      !data ||
      !repositoryState?.headSha ||
      !repositoryState.shortHeadSha
    ) {
      return;
    }

    addAnalysisRun({
      workspacePath,
      branch: activeBranch,
      period: analysisPeriod,
      headSha: repositoryState.headSha,
      shortHeadSha: repositoryState.shortHeadSha,
      recordedAt: new Date().toISOString(),
      totalCommits: data.totalCommits,
      hotspotCount: data.hotspotCount,
      contributorCount: data.contributorCount,
      deliveryRiskLevel: data.deliveryRiskLevel,
    });
  }, [
    activeBranch,
    addAnalysisRun,
    analysisPeriod,
    data,
    repositoryState?.headSha,
    repositoryState?.shortHeadSha,
    workspacePath,
  ]);

  useEffect(() => {
    if (!workspacePath || !activeBranch || !data || !repositoryState?.headSha) {
      return;
    }

    void upsertLocalDatabaseAnalysisCache({
      workspacePath,
      repositoryName: data.repositoryName,
      branch: activeBranch,
      period: analysisPeriod,
      headSha: repositoryState.headSha,
      recordedAt: new Date().toISOString(),
      totalCommits: data.totalCommits,
      hotspotCount: data.hotspotCount,
      contributorCount: data.contributorCount,
      deliveryRiskLevel: data.deliveryRiskLevel,
    })
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ["local-database-summary"] });
      })
      .catch(() => undefined);
  }, [activeBranch, analysisPeriod, data, queryClient, repositoryState?.headSha, workspacePath]);

  return (
    <div className="space-y-6">
      {isRepositoryActionPending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gp-bg-primary/70 px-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-gp-border bg-gp-bg-secondary p-5 shadow-xl">
            <p className="gp-kicker">
              {checkoutBranch.isPending
                ? t("workspaceDetails.switchingBranch")
                : pullRemoteUpdates.isPending
                  ? t("workspaceDetails.pullingRemote")
                  : t("workspaceDetails.checkingRemote")}
            </p>
            <h2 className="gp-heading mt-2 text-lg font-semibold">
              {checkoutBranch.isPending
                ? String(checkoutBranch.variables ?? activeBranch)
                : (activeBranch ?? t("common:status.notSelected"))}
            </h2>
            <p className="gp-text-secondary mt-2 text-sm">
              {checkoutBranch.isPending
                ? t("workspaceDetails.switchingBranchDescription")
                : pullRemoteUpdates.isPending
                  ? t("workspaceDetails.pullingRemoteDescription")
                  : t("workspaceDetails.checkingRemoteDescription")}
            </p>
          </div>
        </div>
      ) : null}

      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Badge tone={hasWorkspace ? "healthy" : "neutral"} className="max-w-full truncate">
              {hasWorkspace ? workspacePath : t("common:status.notSelected")}
            </Badge>
            <Button variant="secondary" onClick={() => setActiveItem("settings")}>
              {t("common:actions.openSettings")}
            </Button>
            <Button variant={hasWorkspace ? "secondary" : "primary"} onClick={selectWorkspace}>
              {hasWorkspace
                ? t("common:actions.changeWorkspace")
                : t("common:actions.selectWorkspace")}
            </Button>
          </>
        }
      />

      {!hasWorkspace ? (
        <DetailPanel title={t("onboarding.title")} description={t("onboarding.description")}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="gp-text-secondary text-sm">{t("onboarding.body")}</p>
            <Button variant="primary" onClick={selectWorkspace}>
              {t("common:actions.selectWorkspace")}
            </Button>
          </div>
        </DetailPanel>
      ) : null}

      {isError ? <p className="gp-alert-critical">{t("error")}</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("stats.repository")}
          value={
            isLoading
              ? "..."
              : workspacePath || (data?.repositoryName ?? t("common:status.notSelected"))
          }
          detail={t("common:time.currentWorkspace")}
          valueSize="md"
        />
        <StatCard
          label={t("stats.commits")}
          value={
            !hasWorkspace ? initialValue : isLoading ? "..." : formatCount(data?.totalCommits ?? 0)
          }
          detail={t("stats.analyzedHistory")}
          tone={hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.hotspots")}
          value={
            !hasWorkspace ? initialValue : isLoading ? "..." : formatCount(data?.hotspotCount ?? 0)
          }
          detail={t("stats.highChangeFiles")}
          tone={hasWorkspace ? "watch" : "neutral"}
        />
        <StatCard
          label={t("stats.risk")}
          value={
            !hasWorkspace
              ? initialValue
              : isLoading
                ? "..."
                : (data?.deliveryRiskLevel ?? t("common:status.low"))
          }
          detail={t("stats.deliverySignal")}
          tone={hasWorkspace ? "healthy" : "neutral"}
        />
      </section>

      <DetailPanel
        title={t("workspaceDetails.title")}
        description={t("workspaceDetails.description")}
        loading={isLoading}
        actions={
          <div className="gp-header-actions">
            <Button variant="secondary" onClick={() => setActiveItem("settings")}>
              {t("workspaceDetails.adjustSettings")}
            </Button>
            <Tabs
              items={translatedPeriodTabs}
              value={analysisPeriod}
              onChange={setAnalysisPeriod}
            />
          </div>
        }
      >
        <div className="gp-control-grid mb-4">
          <Input
            readOnly
            value={workspacePath || t("common:status.notSelected")}
            aria-label={t("stats.repository")}
          />
          <Button
            variant={hasWorkspace ? "secondary" : "primary"}
            className="gp-control-action"
            onClick={selectWorkspace}
          >
            {hasWorkspace
              ? t("common:actions.changeWorkspace")
              : t("common:actions.selectWorkspace")}
          </Button>
          <Select
            value={activeBranch}
            disabled={
              !hasWorkspace || isBranchLoading || checkoutBranch.isPending || branches.length === 0
            }
            aria-label={t("workspaceDetails.branch")}
            onChange={(event) => checkoutBranch.mutate(event.target.value)}
          >
            <option value="" disabled>
              {hasWorkspace ? t("workspaceDetails.noBranches") : t("common:status.notSelected")}
            </option>
            {branches.map((branch) => (
              <option key={`${branch.kind}:${branch.name}`} value={branch.name}>
                {branch.label}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            className="gp-control-action"
            disabled={!hasWorkspace || isRemoteStatusPending || pullRemoteUpdates.isPending}
            onClick={() => checkRemoteStatus()}
          >
            {isRemoteStatusPending
              ? t("workspaceDetails.checkingRemote")
              : t("workspaceDetails.checkRemote")}
          </Button>
          <Button
            variant={canPullRemoteUpdates ? "primary" : "secondary"}
            className="gp-control-action"
            disabled={!canPullRemoteUpdates || pullRemoteUpdates.isPending}
            onClick={() => pullRemoteUpdates.mutate()}
          >
            {pullRemoteUpdates.isPending
              ? t("workspaceDetails.pullingRemote")
              : t("workspaceDetails.pullRemote")}
          </Button>
          <Button
            variant="secondary"
            className="gp-control-action"
            disabled={!hasWorkspace}
            onClick={refreshAnalysis}
          >
            {t("workspaceDetails.refreshAnalysis")}
          </Button>
        </div>
        {checkoutBranch.isError ? (
          <p className="gp-alert-critical mb-4">{String(checkoutBranch.error)}</p>
        ) : null}
        {isRemoteStatusError ? (
          <p className="gp-alert-critical mb-4">{String(remoteStatusError)}</p>
        ) : null}
        {pullRemoteUpdates.isError ? (
          <p className="gp-alert-critical mb-4">{String(pullRemoteUpdates.error)}</p>
        ) : null}
        {hasWorkspace && isRemoteCheckStale ? (
          <div className="gp-alert-critical mb-4">
            {t("freshness.warning", {
              checkedAt: lastRemoteCheckedAt
                ? new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(lastRemoteCheckedAt))
                : t("freshness.check.notChecked"),
            })}
          </div>
        ) : null}
        <div className="gp-status-row mb-4">
          <div className="min-w-0">
            <p className="gp-kicker">{t("workspaceDetails.remoteStatus.title")}</p>
            <p className="gp-text-secondary mt-1 break-words text-sm">{remoteStatusDescription}</p>
          </div>
          <Badge tone={remoteStatusTone(remoteStatus?.status)} className="w-fit">
            {remoteStatusLabel}
          </Badge>
        </div>
        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("workspaceDetails.analysisBasis.branch")}</p>
            <p className="gp-text-secondary mt-1 truncate text-sm">
              {activeBranch || t("common:status.notSelected")}
            </p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("workspaceDetails.analysisBasis.head")}</p>
            <p className="gp-text-secondary mt-1 truncate text-sm">
              {repositoryState?.shortHeadSha ?? t("common:status.notAnalyzed")}
            </p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("workspaceDetails.analysisBasis.window")}</p>
            <p className="gp-text-secondary mt-1 truncate text-sm">
              {t(`settings:defaults.analysisWindows.${analysisPeriod}`)}
            </p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("workspaceDetails.analysisBasis.lastAnalyzed")}</p>
            <p className="gp-text-secondary mt-1 truncate text-sm">{lastAnalyzedAt}</p>
          </div>
        </div>
        <div className="gp-status-row mb-4">
          <div className="min-w-0">
            <p className="gp-kicker">{t("freshness.title")}</p>
            <p className="gp-text-secondary mt-1 break-words text-sm">{freshnessDescription}</p>
          </div>
          <Badge tone={freshnessTone(remoteStatus?.status)} className="w-fit">
            {freshnessLabel}
          </Badge>
        </div>
        <div className="gp-status-row mb-4">
          <div className="min-w-0">
            <p className="gp-kicker">{t("freshness.check.title")}</p>
            <p className="gp-text-secondary mt-1 break-words text-sm">
              {freshnessCheckDescription}
            </p>
          </div>
          <Badge tone={freshnessCheckTone} className="w-fit">
            {freshnessCheckLabel}
          </Badge>
        </div>
        <Table
          columns={[
            {
              key: "path",
              header: t("common:table.file"),
              className: "w-[50%]",
              render: (row) => <TruncatedCell value={row.path} workspacePath={workspacePath} />,
            },
            {
              key: "changes",
              header: t("common:table.changes"),
              align: "right",
              render: (row) => row.changes,
            },
            {
              key: "risk",
              header: t("common:table.risk"),
              align: "right",
              render: (row) => (
                <Badge
                  tone={row.risk === "risky" ? "risky" : row.risk === "watch" ? "watch" : "healthy"}
                >
                  {t(`common:status.${row.risk}`)}
                </Badge>
              ),
            },
          ]}
          rows={hotspotRows.slice(0, 5)}
          getRowKey={(row) => row.path}
          emptyText={hasWorkspace ? t("common:empty.hotspots") : initialEmptyText}
        />
      </DetailPanel>

      <ChartCard
        title={t("chart.activityTrend")}
        emptyText={hasWorkspace ? t("common:empty.activity") : initialEmptyText}
      >
        {activityRows.length > 0 ? (
          <div className="flex h-56 gap-3">
            {activityRows.map((row) => (
              <div key={row.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-48 w-full items-end">
                  <div
                    className="w-full rounded-t-md bg-gp-brand-cyan"
                    style={{
                      height: `${row.commits === 0 ? 0 : Math.max(12, (row.commits / maxActivityCommits) * 100)}%`,
                    }}
                  />
                </div>
                <span className="gp-text-muted text-xs">{row.month.slice(5)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </ChartCard>

      <DetailPanel
        title={t("secondary.title")}
        description={t("secondary.description")}
        actions={
          <Tabs
            items={[
              { id: "history", label: t("history.title") },
              { id: "export", label: t("export.title") },
            ]}
            value={secondarySection}
            onChange={(value) => setSecondarySection(value)}
          />
        }
      >
        <div className="gp-status-row">
          <div className="min-w-0">
            <p className="gp-kicker">{t(`secondary.items.${secondarySection}.title`)}</p>
            <p className="gp-text-secondary mt-1 text-sm">
              {t(`secondary.items.${secondarySection}.description`)}
            </p>
          </div>
          <Badge tone="neutral" className="w-fit">
            {secondarySection === "history"
              ? formatCount(repositoryHistory.length)
              : exportScope === "compare"
                ? t("export.scopeCompareTab")
                : t("export.scopeCurrentTab")}
          </Badge>
        </div>
      </DetailPanel>

      {secondarySection === "history" ? (
        <DetailPanel title={t("history.title")} description={t("history.description")}>
          <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("history.latestRun")}</p>
              <p className="gp-text-secondary mt-1 truncate text-sm">
                {latestRecordedRun
                  ? new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(latestRecordedRun.recordedAt))
                  : t("common:status.notAnalyzed")}
              </p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("history.latestHead")}</p>
              <p className="gp-text-secondary mt-1 truncate text-sm">
                {latestRecordedRun?.shortHeadSha ?? t("common:status.notAnalyzed")}
              </p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("history.commitDelta")}</p>
              <p className="gp-text-secondary mt-1 text-sm">
                {commitDelta === null
                  ? t("history.noPreviousRun")
                  : `${commitDelta > 0 ? "+" : ""}${commitDelta}`}
              </p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("history.hotspotDelta")}</p>
              <p className="gp-text-secondary mt-1 text-sm">
                {hotspotDelta === null
                  ? t("history.noPreviousRun")
                  : `${hotspotDelta > 0 ? "+" : ""}${hotspotDelta}`}
              </p>
            </div>
          </div>
          <div className="mb-4 space-y-3">
            <div className="gp-status-row">
              <div className="min-w-0">
                <p className="gp-kicker">{t("history.compare.title")}</p>
                <p className="gp-text-secondary mt-1 text-sm">{t("history.compare.description")}</p>
              </div>
              <div className="w-full max-w-xs">
                <Select
                  value={selectedComparisonHeadSha}
                  disabled={repositoryHistory.length < 2}
                  aria-label={t("history.compare.select")}
                  onChange={(event) => setComparisonHeadSha(event.target.value)}
                >
                  <option value="" disabled>
                    {repositoryHistory.length < 2
                      ? t("history.compare.notEnough")
                      : t("history.compare.select")}
                  </option>
                  {repositoryHistory.slice(1).map((run) => (
                    <option key={`${run.headSha}:${run.recordedAt}`} value={run.headSha}>
                      {`${run.shortHeadSha} - ${run.branch} - ${new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(run.recordedAt))}`}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="gp-panel min-w-0 p-3">
                <p className="gp-kicker">{t("history.compare.commitDelta")}</p>
                <p className="gp-text-secondary mt-1 text-sm">{comparisonCommitDeltaText}</p>
              </div>
              <div className="gp-panel min-w-0 p-3">
                <p className="gp-kicker">{t("history.compare.hotspotDelta")}</p>
                <p className="gp-text-secondary mt-1 text-sm">{comparisonHotspotDeltaText}</p>
              </div>
              <div className="gp-panel min-w-0 p-3">
                <p className="gp-kicker">{t("history.compare.contributorDelta")}</p>
                <p className="gp-text-secondary mt-1 text-sm">{comparisonContributorDeltaText}</p>
              </div>
              <div className="gp-panel min-w-0 p-3">
                <p className="gp-kicker">{t("history.compare.riskChange")}</p>
                <p className="gp-text-secondary mt-1 text-sm">
                  {!comparisonRun || !latestRecordedRun
                    ? t("history.compare.notEnough")
                    : comparisonSummary?.riskChanged
                      ? `${comparisonRun.deliveryRiskLevel} -> ${latestRecordedRun.deliveryRiskLevel}`
                      : t("history.compare.noRiskChange")}
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="gp-panel min-w-0 p-3">
                <p className="gp-kicker">{t("history.compare.currentSnapshot")}</p>
                <p className="gp-text-secondary mt-1 text-sm">
                  {latestRecordedRun
                    ? `${latestRecordedRun.shortHeadSha} - ${latestRecordedRun.branch}`
                    : t("common:status.notAnalyzed")}
                </p>
              </div>
              <div className="gp-panel min-w-0 p-3">
                <p className="gp-kicker">{t("history.compare.baselineSnapshot")}</p>
                <p className="gp-text-secondary mt-1 text-sm">
                  {comparisonRun
                    ? `${comparisonRun.shortHeadSha} - ${comparisonRun.branch}`
                    : t("history.compare.notEnough")}
                </p>
                {comparisonSummary?.branchChanged || comparisonSummary?.periodChanged ? (
                  <p className="gp-text-muted mt-2 text-xs">
                    {comparisonSummary.branchChanged && comparisonSummary.periodChanged
                      ? t("history.compare.scopeChangedBoth")
                      : comparisonSummary.branchChanged
                        ? t("history.compare.scopeChangedBranch")
                        : t("history.compare.scopeChangedWindow")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <Table
            columns={[
              {
                key: "recordedAt",
                header: t("history.recordedAt"),
                render: (row) =>
                  new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(row.recordedAt)),
              },
              {
                key: "branch",
                header: t("workspaceDetails.analysisBasis.branch"),
                className: "w-[15%]",
                render: (row) => <TruncatedCell value={row.branch} />,
              },
              {
                key: "head",
                header: t("workspaceDetails.analysisBasis.head"),
                render: (row) => row.shortHeadSha,
              },
              {
                key: "commits",
                header: t("stats.commits"),
                align: "right",
                render: (row) => row.totalCommits,
              },
              {
                key: "hotspots",
                header: t("stats.hotspots"),
                align: "right",
                render: (row) => row.hotspotCount,
              },
              {
                key: "risk",
                header: t("stats.risk"),
                align: "right",
                render: (row) => (
                  <Badge
                    tone={
                      row.deliveryRiskLevel === "high"
                        ? "risky"
                        : row.deliveryRiskLevel === "medium"
                          ? "watch"
                          : "healthy"
                    }
                  >
                    {row.deliveryRiskLevel}
                  </Badge>
                ),
              },
              {
                key: "compare",
                header: t("history.compare.action"),
                align: "right",
                render: (row) =>
                  latestRecordedRun && row.headSha !== latestRecordedRun.headSha ? (
                    <Button
                      variant={selectedComparisonHeadSha === row.headSha ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setComparisonHeadSha(row.headSha)}
                    >
                      {selectedComparisonHeadSha === row.headSha
                        ? t("history.compare.selected")
                        : t("history.compare.action")}
                    </Button>
                  ) : (
                    <Badge tone="neutral">{t("history.compare.current")}</Badge>
                  ),
              },
            ]}
            rows={repositoryHistory}
            getRowKey={(row) => `${row.workspacePath}:${row.branch}:${row.headSha}:${row.period}`}
            emptyText={hasWorkspace ? t("history.empty") : initialEmptyText}
          />
        </DetailPanel>
      ) : null}

      {secondarySection === "export" ? (
        <DetailPanel
          title={t("export.title")}
          description={t("export.description")}
          actions={
            <div className="gp-header-actions">
              <Button variant="primary" disabled={!data || !hasWorkspace} onClick={exportHtml}>
                {t("export.html")}
              </Button>
              <Button
                variant="secondary"
                disabled={!data || !hasWorkspace}
                onClick={() => exportReport("md")}
              >
                {t("export.markdown")}
              </Button>
              <Button
                variant="secondary"
                disabled={!data || !hasWorkspace}
                onClick={() => exportReport("json")}
              >
                {t("export.json")}
              </Button>
            </div>
          }
        >
          <div className="mb-4 grid gap-3 xl:grid-cols-2">
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("export.detailLevel")}</p>
              <p className="gp-text-secondary mt-1 text-sm">{t("export.detailLevelDescription")}</p>
              <div className="mt-3">
                <Tabs
                  items={[
                    { id: "summary", label: t("export.summary") },
                    { id: "full", label: t("export.full") },
                  ]}
                  value={exportDetailLevel}
                  onChange={(value) => setExportDetailLevel(value)}
                />
              </div>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("export.scope")}</p>
              <p className="gp-text-secondary mt-1 text-sm">{t("export.scopeDescription")}</p>
              <div className="mt-3">
                <Tabs
                  items={[
                    { id: "current", label: t("export.scopeCurrentTab") },
                    { id: "compare", label: t("export.scopeCompareTab") },
                  ]}
                  value={exportScope}
                  onChange={(value) => setExportScope(value)}
                />
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("export.includes")}</p>
              <p className="gp-text-secondary mt-1 text-sm">{exportIncludesValue}</p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("export.format")}</p>
              <p className="gp-text-secondary mt-1 text-sm">{exportFormatValue}</p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("export.scopeTarget")}</p>
              <p className="gp-text-secondary mt-1 truncate text-sm">
                {hasWorkspace ? exportScopeValue : t("common:status.notSelected")}
              </p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("export.status")}</p>
              <p className="gp-text-secondary mt-1 text-sm">
                {exportMessage || t("export.statusIdle")}
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("export.repository")}</p>
              <p className="gp-text-secondary mt-1 truncate text-sm">
                {hasWorkspace
                  ? (data?.repositoryName ?? workspacePath)
                  : t("common:status.notSelected")}
              </p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("export.filename")}</p>
              <p className="gp-text-secondary mt-1 break-all text-sm">
                {hasWorkspace && data
                  ? `${data.repositoryName}-${activeBranch}-${exportDetailLevel}-${exportScope}-report.*`
                  : t("common:status.notSelected")}
              </p>
            </div>
          </div>
        </DetailPanel>
      ) : null}
    </div>
  );
}
