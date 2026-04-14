import { useTranslation } from "react-i18next";
import { ChartCard } from "../../components/charts";
import {
  AnalysisBasisPanel,
  Badge,
  DetailPanel,
  EmptyState,
  PageHeader,
  StatCard,
  Table,
} from "../../components/ui";
import { useAnalysisPageContext } from "../../hooks/useAnalysisPageContext";
import { statValue } from "../../lib/analysis-helpers";
import { useActivityAnalysis } from "./useActivityAnalysis";

export function ActivityPage() {
  const { t } = useTranslation(["activity", "common", "settings"]);
  const ctx = useAnalysisPageContext();
  const { data: activityRows = [], isLoading } = useActivityAnalysis(
    ctx.workspacePath,
    ctx.selectedBranch,
    ctx.headSha,
    ctx.analysisPeriod
  );
  const hasData = activityRows.some((row) => row.commits > 0);
  const maxCommits = Math.max(1, ...activityRows.map((row) => row.commits));
  const currentMonthCommits = activityRows[activityRows.length - 1]?.commits ?? 0;
  const previousMonthCommits = activityRows[activityRows.length - 2]?.commits ?? 0;
  const trend =
    previousMonthCommits === 0
      ? 0
      : Math.round(((currentMonthCommits - previousMonthCommits) / previousMonthCommits) * 100);
  const na = t("common:status.notAnalyzed");

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={
          <Badge tone={ctx.hasWorkspace ? "brand" : "neutral"}>
            {ctx.hasWorkspace ? t("badge") : na}
          </Badge>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={t("stats.currentMonth")}
          value={statValue(ctx.hasWorkspace, isLoading, String(currentMonthCommits), na)}
          detail={t("common:table.commits")}
          tone={ctx.hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.trend")}
          value={statValue(
            ctx.hasWorkspace,
            isLoading,
            hasData ? `${trend > 0 ? "+" : ""}${trend}%` : t("common:empty.activity"),
            na
          )}
          detail={t("stats.comparedWithPreviousMonth")}
          tone={ctx.hasWorkspace && hasData ? (trend < 0 ? "watch" : "healthy") : "neutral"}
        />
        <StatCard
          label={t("stats.signal")}
          value={
            !ctx.hasWorkspace
              ? na
              : hasData
                ? t("common:status.steady")
                : t("common:empty.activity")
          }
          detail={t("stats.noDeclinePattern")}
          tone={ctx.hasWorkspace && hasData ? "healthy" : "neutral"}
        />
      </section>

      <AnalysisBasisPanel
        title={t("basis.title")}
        description={t("basis.description")}
        onOpenSettings={() => ctx.setActiveItem("settings")}
        items={[
          {
            label: t("basis.repository"),
            value: ctx.hasWorkspace ? ctx.workspacePath : t("common:status.notSelected"),
            breakWords: true,
          },
          {
            label: t("basis.branch"),
            value: ctx.selectedBranch || t("common:status.notSelected"),
          },
          {
            label: t("basis.window"),
            value: t(`settings:defaults.analysisWindows.${ctx.analysisPeriod}`),
          },
          { label: t("basis.rows"), value: String(activityRows.length) },
        ]}
      />

      <ChartCard title={t("chart.title")} description={t("chart.description")}>
        {activityRows.length === 0 || !ctx.hasWorkspace ? (
          <EmptyState
            title={
              ctx.hasWorkspace ? t("common:empty.activity") : t("common:empty.selectWorkspace")
            }
            description={
              ctx.hasWorkspace ? t("common:empty.chart") : t("common:empty.selectWorkspaceDetail")
            }
          />
        ) : (
          <div className="flex h-56 gap-3">
            {activityRows.map((row) => (
              <div key={row.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-48 w-full items-end">
                  <div
                    className="w-full rounded-t-md bg-gp-brand-cyan"
                    style={{
                      height: `${row.commits === 0 ? 0 : Math.max(12, (row.commits / maxCommits) * 100)}%`,
                    }}
                  />
                </div>
                <span className="gp-text-muted text-xs">{row.month.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </ChartCard>

      <DetailPanel
        title={t("table.title")}
        description={t("table.description")}
        loading={isLoading}
      >
        <Table
          columns={[
            { key: "month", header: t("common:table.month"), render: (row) => row.month },
            {
              key: "commits",
              header: t("common:table.commits"),
              align: "right",
              render: (row) => row.commits,
            },
          ]}
          rows={activityRows}
          getRowKey={(row) => row.month}
          emptyText={
            ctx.hasWorkspace ? t("common:empty.activity") : t("common:empty.selectWorkspace")
          }
        />
      </DetailPanel>
    </div>
  );
}
