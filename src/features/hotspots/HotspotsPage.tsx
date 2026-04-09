import { useTranslation } from "react-i18next";
import { ChartCard } from "../../components/charts";
import { Badge, DetailPanel, PageHeader, StatCard, Table } from "../../components/ui";
import { hotspotRows } from "../gitpulse-sample-data";

export function HotspotsPage() {
  const { t } = useTranslation(["hotspots", "common"]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={<Badge tone="brand">{t("badge")}</Badge>}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label={t("stats.topChurnFiles")} value="20" detail={t("common:time.lastYear")} tone="brand" />
        <StatCard label={t("stats.bugOverlap")} value="3" detail={t("stats.highChangeAndFixHeavy")} tone="watch" />
        <StatCard
          label={t("stats.highestSignal")}
          value={t("common:status.watch")}
          detail={t("stats.potentialMaintenanceLoad")}
          tone="watch"
        />
      </section>

      <DetailPanel
        title={t("ranking.title")}
        description={t("ranking.description")}
      >
        <Table
          columns={[
            { key: "path", header: t("common:table.file"), render: (row) => row.path },
            { key: "changes", header: t("common:table.changes"), align: "right", render: (row) => row.changes },
            { key: "fixes", header: t("common:table.fixCommits"), align: "right", render: (row) => row.fixes },
            {
              key: "risk",
              header: t("common:table.signal"),
              align: "right",
              render: (row) => (
                <Badge tone={row.risk === "risky" ? "risky" : row.risk === "watch" ? "watch" : "healthy"}>
                  {t(`common:status.${row.risk}`)}
                </Badge>
              ),
            },
          ]}
          rows={hotspotRows}
          getRowKey={(row) => row.path}
        />
      </DetailPanel>

      <ChartCard title={t("chart.title")} description={t("chart.description")}>
        <div className="space-y-3">
          {hotspotRows.map((row) => (
            <div key={row.path} className="space-y-1">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="gp-text-secondary truncate">{row.path}</span>
                <span className="gp-text-muted">{row.changes}</span>
              </div>
              <div className="h-2 rounded-md bg-gp-bg-tertiary">
                <div className="h-2 rounded-md bg-gp-brand-cyan" style={{ width: `${row.changes}%` }} />
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
