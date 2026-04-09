import { useTranslation } from "react-i18next";
import { ChartCard } from "../../components/charts";
import { Badge, DetailPanel, PageHeader, StatCard, Table } from "../../components/ui";
import { activityRows } from "../gitpulse-sample-data";

const maxCommits = Math.max(...activityRows.map((row) => row.commits));

export function ActivityPage() {
  const { t } = useTranslation(["activity", "common"]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={<Badge tone="brand">{t("badge")}</Badge>}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label={t("stats.currentMonth")} value="37" detail={t("common:table.commits")} tone="brand" />
        <StatCard label={t("stats.trend")} value="+28%" detail={t("stats.comparedWithPreviousMonth")} tone="healthy" />
        <StatCard
          label={t("stats.signal")}
          value={t("common:status.steady")}
          detail={t("stats.noDeclinePattern")}
          tone="healthy"
        />
      </section>

      <ChartCard title={t("chart.title")} description={t("chart.description")}>
        <div className="flex h-56 items-end gap-3">
          {activityRows.map((row) => (
            <div key={row.month} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-gp-brand-cyan"
                style={{ height: `${Math.max(12, (row.commits / maxCommits) * 100)}%` }}
              />
              <span className="gp-text-muted text-xs">{row.month.slice(5)}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <DetailPanel title={t("table.title")} description={t("table.description")}>
        <Table
          columns={[
            { key: "month", header: t("common:table.month"), render: (row) => row.month },
            { key: "commits", header: t("common:table.commits"), align: "right", render: (row) => row.commits },
          ]}
          rows={activityRows}
          getRowKey={(row) => row.month}
        />
      </DetailPanel>
    </div>
  );
}
