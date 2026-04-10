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
  buildAnalysisReportJson,
  buildAnalysisReportMarkdown,
  downloadAnalysisReport,
} from "./report-export";
import { upsertLocalDatabaseAnalysisCache } from "../../services/tauri/local-database";

const periodTabs = [
  { id: "1y", labelKey: "settings:defaults.analysisWindows.1y" },
  { id: "6m", labelKey: "settings:defaults.analysisWindows.6m" },
  { id: "3m", labelKey: "settings:defaults.analysisWindows.3m" },
] as const;

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
  const workspacePath = useUiStore((state) => state.workspacePath);
  const selectedBranch = useUiStore((state) => state.selectedBranch);
  const analysisPeriod = useUiStore((state) => state.analysisPeriod);
  const globalExcludedPaths = useUiStore((state) => state.excludedPaths);
  const globalBugKeywords = useUiStore((state) => state.bugKeywords);
  const globalEmergencyPatterns = useUiStore((state) => state.emergencyPatterns);
  const repositoryOverride = useUiStore((state) => state.repositoryOverrides[workspacePath]);
  const excludedPaths = repositoryOverride?.excludedPaths ?? globalExcludedPaths;
  const bugKeywords = repositoryOverride?.bugKeywords ?? globalBugKeywords;
  const emergencyPatterns = repositoryOverride?.emergencyPatterns ?? globalEmergencyPatterns;
  const setAnalysisPeriod = useUiStore((state) => state.setAnalysisPeriod);
  const setSelectedBranch = useUiStore((state) => state.setSelectedBranch);
  const setWorkspacePath = useUiStore((state) => state.setWorkspacePath);
  const analysisRuns = useUiStore((state) => state.analysisRuns);
  const addAnalysisRun = useUiStore((state) => state.addAnalysisRun);
  const selectWorkspace = useWorkspacePrompt();
  const { data: branches = [], isLoading: isBranchLoading } = useGitBranches(workspacePath);
  const { data: repositoryState, isError: isRepositoryStateError } =
    useGitRepositoryState(workspacePath);
  const checkoutBranch = useCheckoutGitBranch(workspacePath);
  const pullRemoteUpdates = usePullGitRemoteUpdates(workspacePath);
  const resetPullRemoteUpdates = pullRemoteUpdates.reset;
  const {
    data: checkedRemoteStatus,
    error: remoteStatusError,
    isError: isRemoteStatusError,
    isPending: isRemoteStatusPending,
    mutate: checkRemoteStatus,
    reset: resetRemoteStatus,
  } = useCheckGitRemoteStatus(workspacePath);
  const remoteStatus = pullRemoteUpdates.data ?? checkedRemoteStatus;
  const currentBranch = branches.find((branch) => branch.current)?.name ?? "";
  const activeBranch = selectedBranch || currentBranch || (repositoryState?.branch ?? "");
  const { data, isLoading, isError } = useOverviewAnalysis(
    workspacePath,
    activeBranch,
    analysisPeriod,
    excludedPaths,
    bugKeywords,
    emergencyPatterns
  );
  const { data: hotspotRows = [] } = useHotspotsAnalysis(
    workspacePath,
    activeBranch,
    analysisPeriod,
    excludedPaths,
    bugKeywords
  );
  const { data: activityRows = [] } = useActivityAnalysis(
    workspacePath,
    activeBranch,
    analysisPeriod
  );
  const { data: ownershipRows = [] } = useOwnershipAnalysis(workspacePath, activeBranch);
  const { data: deliveryRows = [] } = useDeliveryRiskAnalysis(
    workspacePath,
    activeBranch,
    emergencyPatterns
  );
  const translatedPeriodTabs = periodTabs.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
  }));
  const repositoryHistory = analysisRuns.filter((run) => run.workspacePath === workspacePath);
  const latestRecordedRun = repositoryHistory[0];
  const previousRecordedRun = repositoryHistory[1];
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
  const lastAnalyzedAt = data
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date())
    : t("common:status.notAnalyzed");
  const canPullRemoteUpdates = Boolean(hasWorkspace && remoteStatus?.status === "behind");
  const isRepositoryActionPending =
    checkoutBranch.isPending || isRemoteStatusPending || pullRemoteUpdates.isPending;

  function refreshAnalysis() {
    void queryClient.invalidateQueries({ queryKey: ["overview"] });
    void queryClient.invalidateQueries({ queryKey: ["hotspots"] });
    void queryClient.invalidateQueries({ queryKey: ["ownership"] });
    void queryClient.invalidateQueries({ queryKey: ["activity"] });
    void queryClient.invalidateQueries({ queryKey: ["delivery-risk"] });
    void queryClient.invalidateQueries({ queryKey: ["repository-state"] });
  }

  function exportReport(format: "json" | "md") {
    if (!workspacePath || !activeBranch || !data) {
      setExportMessage(t("export.empty"));
      return;
    }

    const generatedAt = new Date().toISOString();
    const reportInput = {
      generatedAt,
      workspacePath,
      repositoryName: data.repositoryName,
      branch: activeBranch,
      headSha: repositoryState?.headSha ?? null,
      shortHeadSha: repositoryState?.shortHeadSha ?? null,
      period: analysisPeriod,
      remoteStatus: remoteStatus ?? null,
      excludedPaths,
      bugKeywords,
      emergencyPatterns,
      overview: data,
      hotspots: hotspotRows,
      ownership: ownershipRows,
      activity: activityRows,
      deliveryRisk: deliveryRows,
    };

    const contents =
      format === "json"
        ? buildAnalysisReportJson(reportInput)
        : buildAnalysisReportMarkdown(reportInput);

    downloadAnalysisReport(data.repositoryName, activeBranch, format, contents);
    setExportMessage(t(`export.success.${format}`));
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
        actions={
          <Tabs items={translatedPeriodTabs} value={analysisPeriod} onChange={setAnalysisPeriod} />
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
        <Table
          columns={[
            { key: "path", header: t("common:table.file"), render: (row) => row.path },
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
              render: (row) => row.branch,
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
          ]}
          rows={repositoryHistory}
          getRowKey={(row) => `${row.workspacePath}:${row.branch}:${row.headSha}:${row.period}`}
          emptyText={hasWorkspace ? t("history.empty") : initialEmptyText}
        />
      </DetailPanel>

      <DetailPanel
        title={t("export.title")}
        description={t("export.description")}
        actions={
          <div className="gp-header-actions">
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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("export.includes")}</p>
            <p className="gp-text-secondary mt-1 text-sm">{t("export.includesValue")}</p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("export.format")}</p>
            <p className="gp-text-secondary mt-1 text-sm">{t("export.formatValue")}</p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("export.repository")}</p>
            <p className="gp-text-secondary mt-1 truncate text-sm">
              {hasWorkspace
                ? (data?.repositoryName ?? workspacePath)
                : t("common:status.notSelected")}
            </p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("export.status")}</p>
            <p className="gp-text-secondary mt-1 text-sm">
              {exportMessage || t("export.statusIdle")}
            </p>
          </div>
        </div>
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
    </div>
  );
}
