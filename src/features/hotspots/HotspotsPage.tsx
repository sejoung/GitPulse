import { useTranslation } from "react-i18next";
import { useUiStore } from "../../app/store/ui-store";
import { ChartCard } from "../../components/charts";
import { Badge, DetailPanel, EmptyState, PageHeader, StatCard, Table } from "../../components/ui";
import { useHotspotsAnalysis } from "./useHotspotsAnalysis";

export function HotspotsPage() {
  const { t } = useTranslation(["hotspots", "common"]);
  const workspacePath = useUiStore((state) => state.workspacePath);
  const selectedBranch = useUiStore((state) => state.selectedBranch);
  const analysisPeriod = useUiStore((state) => state.analysisPeriod);
  const excludedPaths = useUiStore((state) => state.excludedPaths);
  const bugKeywords = useUiStore((state) => state.bugKeywords);
  const { data: hotspotRows = [], isLoading } = useHotspotsAnalysis(
    workspacePath,
    selectedBranch,
    analysisPeriod,
    excludedPaths,
    bugKeywords
  );
  const hasWorkspace = Boolean(workspacePath);
  const hasData = hotspotRows.length > 0;
  const bugOverlap = hotspotRows.filter((row) => row.fixes > 0).length;
  const highestSignal = hotspotRows.some((row) => row.risk === "risky")
    ? "risky"
    : hotspotRows.some((row) => row.risk === "watch")
      ? "watch"
      : "healthy";

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={
          <Badge tone={hasWorkspace ? "brand" : "neutral"}>
            {hasWorkspace ? t("badge") : t("common:status.notAnalyzed")}
          </Badge>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={t("stats.topChurnFiles")}
          value={
            !hasWorkspace
              ? t("common:status.notAnalyzed")
              : isLoading
                ? "..."
                : String(hotspotRows.length)
          }
          detail={t("common:time.lastYear")}
          tone={hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.bugOverlap")}
          value={
            !hasWorkspace ? t("common:status.notAnalyzed") : isLoading ? "..." : String(bugOverlap)
          }
          detail={t("stats.highChangeAndFixHeavy")}
          tone={hasWorkspace ? "watch" : "neutral"}
        />
        <StatCard
          label={t("stats.highestSignal")}
          value={
            !hasWorkspace
              ? t("common:status.notAnalyzed")
              : isLoading
                ? "..."
                : hasData
                  ? t(`common:status.${highestSignal}`)
                  : t("common:empty.hotspots")
          }
          detail={t("stats.potentialMaintenanceLoad")}
          tone={hasWorkspace && hasData ? highestSignal : "neutral"}
        />
      </section>

      <DetailPanel title={t("ranking.title")} description={t("ranking.description")}>
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
              key: "fixes",
              header: t("common:table.fixCommits"),
              align: "right",
              render: (row) => row.fixes,
            },
            {
              key: "risk",
              header: t("common:table.signal"),
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
          rows={hotspotRows}
          getRowKey={(row) => row.path}
          emptyText={hasWorkspace ? t("common:empty.hotspots") : t("common:empty.selectWorkspace")}
        />
      </DetailPanel>

      <ChartCard title={t("chart.title")} description={t("chart.description")}>
        {hotspotRows.length === 0 ? (
          <EmptyState
            title={hasWorkspace ? t("common:empty.hotspots") : t("common:empty.selectWorkspace")}
          />
        ) : (
          <div className="space-y-3">
            {hotspotRows.map((row) => (
              <div key={row.path} className="space-y-1">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="gp-text-secondary truncate">{row.path}</span>
                  <span className="gp-text-muted">{row.changes}</span>
                </div>
                <div className="h-2 rounded-md bg-gp-bg-tertiary">
                  <div
                    className="h-2 rounded-md bg-gp-brand-cyan"
                    style={{ width: `${row.changes}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
}
