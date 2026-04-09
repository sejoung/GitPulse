import { useTranslation } from "react-i18next";
import { useUiStore } from "../../app/store/ui-store";
import { ChartCard } from "../../components/charts";
import { Badge, DetailPanel, EmptyState, PageHeader, StatCard, Table } from "../../components/ui";
import { useOwnershipAnalysis } from "./useOwnershipAnalysis";

export function OwnershipPage() {
  const { t } = useTranslation(["ownership", "common"]);
  const workspacePath = useUiStore((state) => state.workspacePath);
  const selectedBranch = useUiStore((state) => state.selectedBranch);
  const { data: contributorRows = [], isLoading } = useOwnershipAnalysis(
    workspacePath,
    selectedBranch
  );
  const hasWorkspace = Boolean(workspacePath);
  const hasData = contributorRows.length > 0;
  const topContributor = contributorRows[0]?.share ?? "0%";
  const activeContributorCount = contributorRows.filter(
    (row) => row.recentKey === "status.active"
  ).length;
  const knowledgeRisk = contributorRows.some((row) => row.risk === "watch") ? "watch" : "healthy";

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={
          <Badge tone={hasWorkspace ? "watch" : "neutral"}>
            {hasWorkspace ? t("badge") : t("common:status.notAnalyzed")}
          </Badge>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={t("stats.topContributor")}
          value={
            !hasWorkspace
              ? t("common:status.notAnalyzed")
              : isLoading
                ? "..."
                : hasData
                  ? topContributor
                  : t("common:empty.ownership")
          }
          detail={t("stats.aboveWatchThreshold")}
          tone={hasWorkspace && hasData ? knowledgeRisk : "neutral"}
        />
        <StatCard
          label={t("stats.activeContributors")}
          value={
            !hasWorkspace
              ? t("common:status.notAnalyzed")
              : isLoading
                ? "..."
                : String(activeContributorCount)
          }
          detail={t("stats.recentActivity")}
          tone={hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.knowledgeRisk")}
          value={
            !hasWorkspace
              ? t("common:status.notAnalyzed")
              : isLoading
                ? "..."
                : hasData
                  ? t(`common:status.${knowledgeRisk}`)
                  : t("common:empty.ownership")
          }
          detail={t("stats.ownershipConcentration")}
          tone={hasWorkspace && hasData ? knowledgeRisk : "neutral"}
        />
      </section>

      <DetailPanel title={t("table.title")} description={t("table.description")}>
        <Table
          columns={[
            { key: "name", header: t("common:table.contributor"), render: (row) => row.name },
            {
              key: "commits",
              header: t("common:table.commits"),
              align: "right",
              render: (row) => row.commits,
            },
            {
              key: "share",
              header: t("common:table.share"),
              align: "right",
              render: (row) => row.share,
            },
            {
              key: "recent",
              header: t("common:table.recent"),
              align: "right",
              render: (row) => t(`common:${row.recentKey}`),
            },
            {
              key: "risk",
              header: t("common:table.signal"),
              align: "right",
              render: (row) => (
                <Badge tone={row.risk === "watch" ? "watch" : "healthy"}>
                  {t(`common:status.${row.risk}`)}
                </Badge>
              ),
            },
          ]}
          rows={contributorRows}
          getRowKey={(row) => row.name}
          emptyText={hasWorkspace ? t("common:empty.ownership") : t("common:empty.selectWorkspace")}
        />
      </DetailPanel>

      <ChartCard title={t("chart.title")} description={t("chart.description")}>
        {contributorRows.length === 0 ? (
          <EmptyState
            title={hasWorkspace ? t("common:empty.ownership") : t("common:empty.selectWorkspace")}
          />
        ) : (
          <div className="space-y-3">
            {contributorRows.map((row) => (
              <div key={row.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="gp-text-secondary">{row.name}</span>
                  <span className="gp-text-muted">{row.share}</span>
                </div>
                <div className="h-2 rounded-md bg-gp-bg-tertiary">
                  <div className="h-2 rounded-md bg-gp-brand-blue" style={{ width: row.share }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
}
