import { useTranslation } from "react-i18next";
import { useUiStore } from "../../app/store/ui-store";
import { ChartCard } from "../../components/charts";
import { Badge, DetailPanel, EmptyState, PageHeader, StatCard, Table } from "../../components/ui";
import { useActivityAnalysis } from "./useActivityAnalysis";

export function ActivityPage() {
  const { t } = useTranslation(["activity", "common"]);
  const workspacePath = useUiStore((state) => state.workspacePath);
  const { data: activityRows = [], isLoading } = useActivityAnalysis(workspacePath);
  const hasWorkspace = Boolean(workspacePath);
  const hasData = activityRows.some((row) => row.commits > 0);
  const maxCommits = Math.max(1, ...activityRows.map((row) => row.commits));
  const currentMonthCommits = activityRows[activityRows.length - 1]?.commits ?? 0;
  const previousMonthCommits = activityRows[activityRows.length - 2]?.commits ?? 0;
  const trend = previousMonthCommits === 0 ? 0 : Math.round(((currentMonthCommits - previousMonthCommits) / previousMonthCommits) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={<Badge tone={hasWorkspace ? "brand" : "neutral"}>{hasWorkspace ? t("badge") : t("common:status.notAnalyzed")}</Badge>}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label={t("stats.currentMonth")} value={!hasWorkspace ? t("common:status.notAnalyzed") : isLoading ? "..." : String(currentMonthCommits)} detail={t("common:table.commits")} tone={hasWorkspace ? "brand" : "neutral"} />
        <StatCard label={t("stats.trend")} value={!hasWorkspace ? t("common:status.notAnalyzed") : isLoading ? "..." : hasData ? `${trend > 0 ? "+" : ""}${trend}%` : t("common:empty.activity")} detail={t("stats.comparedWithPreviousMonth")} tone={hasWorkspace && hasData ? (trend < 0 ? "watch" : "healthy") : "neutral"} />
        <StatCard
          label={t("stats.signal")}
          value={!hasWorkspace ? t("common:status.notAnalyzed") : hasData ? t("common:status.steady") : t("common:empty.activity")}
          detail={t("stats.noDeclinePattern")}
          tone={hasWorkspace && hasData ? "healthy" : "neutral"}
        />
      </section>

      <ChartCard title={t("chart.title")} description={t("chart.description")}>
        {activityRows.length === 0 || !hasWorkspace ? (
          <EmptyState title={hasWorkspace ? t("common:empty.activity") : t("common:empty.selectWorkspace")} />
        ) : <div className="flex h-56 gap-3">
          {activityRows.map((row) => (
            <div key={row.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-48 w-full items-end">
                <div
                  className="w-full rounded-t-md bg-gp-brand-cyan"
                  style={{ height: `${row.commits === 0 ? 0 : Math.max(12, (row.commits / maxCommits) * 100)}%` }}
                />
              </div>
              <span className="gp-text-muted text-xs">{row.month.slice(5)}</span>
            </div>
          ))}
        </div>}
      </ChartCard>

      <DetailPanel title={t("table.title")} description={t("table.description")}>
        <Table
          columns={[
            { key: "month", header: t("common:table.month"), render: (row) => row.month },
            { key: "commits", header: t("common:table.commits"), align: "right", render: (row) => row.commits },
          ]}
          rows={activityRows}
          getRowKey={(row) => row.month}
          emptyText={hasWorkspace ? t("common:empty.activity") : t("common:empty.selectWorkspace")}
        />
      </DetailPanel>
    </div>
  );
}
