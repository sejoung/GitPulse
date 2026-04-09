import { useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { useHotspotsAnalysis } from "../hotspots/useHotspotsAnalysis";
import { useWorkspacePrompt } from "../workspace/useWorkspacePrompt";
import { useCheckoutGitBranch, useGitBranches } from "./useGitBranches";

const periodTabs = [
  { id: "1y", labelKey: "settings:defaults.analysisWindows.1y" },
  { id: "6m", labelKey: "settings:defaults.analysisWindows.6m" },
  { id: "3m", labelKey: "settings:defaults.analysisWindows.3m" },
] as const;

export function OverviewPage() {
  const { t } = useTranslation(["overview", "common", "settings"]);
  const workspacePath = useUiStore((state) => state.workspacePath);
  const selectedBranch = useUiStore((state) => state.selectedBranch);
  const analysisPeriod = useUiStore((state) => state.analysisPeriod);
  const excludedPaths = useUiStore((state) => state.excludedPaths);
  const bugKeywords = useUiStore((state) => state.bugKeywords);
  const emergencyPatterns = useUiStore((state) => state.emergencyPatterns);
  const setAnalysisPeriod = useUiStore((state) => state.setAnalysisPeriod);
  const setSelectedBranch = useUiStore((state) => state.setSelectedBranch);
  const selectWorkspace = useWorkspacePrompt();
  const { data: branches = [], isLoading: isBranchLoading } = useGitBranches(workspacePath);
  const checkoutBranch = useCheckoutGitBranch(workspacePath);
  const currentBranch = branches.find((branch) => branch.current)?.name ?? "";
  const activeBranch = selectedBranch || currentBranch;
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
  const translatedPeriodTabs = periodTabs.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
  }));
  const hasWorkspace = Boolean(workspacePath);
  const maxActivityCommits = Math.max(1, ...activityRows.map((row) => row.commits));
  const initialValue = t("common:status.notAnalyzed");
  const initialEmptyText = t("common:empty.selectWorkspace");

  useEffect(() => {
    if (!selectedBranch && currentBranch) {
      setSelectedBranch(currentBranch);
    }
  }, [currentBranch, selectedBranch, setSelectedBranch]);

  return (
    <div className="space-y-6">
      {checkoutBranch.isPending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gp-bg-primary/70 px-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-gp-border bg-gp-bg-secondary p-5 shadow-xl">
            <p className="gp-kicker">{t("workspaceDetails.switchingBranch")}</p>
            <h2 className="gp-heading mt-2 text-lg font-semibold">
              {String(checkoutBranch.variables ?? activeBranch)}
            </h2>
            <p className="gp-text-secondary mt-2 text-sm">
              {t("workspaceDetails.switchingBranchDescription")}
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
            <Badge
              tone={hasWorkspace ? "healthy" : "neutral"}
              className="max-w-full truncate lg:max-w-md"
            >
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

      {isError ? <p className="gp-alert-critical">{t("error")}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("stats.repository")}
          value={
            isLoading
              ? "..."
              : workspacePath || data?.repositoryName || t("common:status.notSelected")
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
        <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_minmax(180px,240px)_auto]">
          <Input
            readOnly
            value={workspacePath || t("common:status.notSelected")}
            aria-label={t("stats.repository")}
          />
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
          <Button variant={hasWorkspace ? "secondary" : "primary"} onClick={selectWorkspace}>
            {hasWorkspace
              ? t("common:actions.changeWorkspace")
              : t("common:actions.selectWorkspace")}
          </Button>
        </div>
        {checkoutBranch.isError ? (
          <p className="gp-alert-critical mb-4">{String(checkoutBranch.error)}</p>
        ) : null}
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
