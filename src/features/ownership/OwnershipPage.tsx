import { useTranslation } from "react-i18next";
import { ChartCard } from "../../components/charts";
import { Badge, DetailPanel, PageHeader, StatCard, Table } from "../../components/ui";
import { contributorRows } from "../gitpulse-sample-data";

export function OwnershipPage() {
  const { t } = useTranslation(["ownership", "common"]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={<Badge tone="watch">{t("badge")}</Badge>}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label={t("stats.topContributor")} value="62%" detail={t("stats.aboveWatchThreshold")} tone="watch" />
        <StatCard label={t("stats.activeContributors")} value="2" detail={t("stats.recentActivity")} tone="brand" />
        <StatCard
          label={t("stats.knowledgeRisk")}
          value={t("common:status.watch")}
          detail={t("stats.ownershipConcentration")}
          tone="watch"
        />
      </section>

      <DetailPanel title={t("table.title")} description={t("table.description")}>
        <Table
          columns={[
            { key: "name", header: t("common:table.contributor"), render: (row) => row.name },
            { key: "commits", header: t("common:table.commits"), align: "right", render: (row) => row.commits },
            { key: "share", header: t("common:table.share"), align: "right", render: (row) => row.share },
            { key: "recent", header: t("common:table.recent"), align: "right", render: (row) => t(`common:${row.recentKey}`) },
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
        />
      </DetailPanel>

      <ChartCard title={t("chart.title")} description={t("chart.description")}>
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
      </ChartCard>
    </div>
  );
}
