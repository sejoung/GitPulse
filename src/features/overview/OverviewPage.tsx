import { useTranslation } from "react-i18next";
import { ChartCard } from "../../components/charts";
import { Badge, Button, DetailPanel, PageHeader, StatCard, Table, Tabs } from "../../components/ui";
import { formatCount } from "../../lib/format";
import { useOverviewAnalysis } from "./useOverviewAnalysis";

const periodTabs = [
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
  { id: "all", labelKey: "common:time.all" },
] as const;

const hotspotRows: Array<{ path: string; changes: number; risk: string }> = [];

export function OverviewPage() {
  const { t } = useTranslation(["overview", "common"]);
  const { data, isLoading, isError } = useOverviewAnalysis();
  const translatedPeriodTabs = periodTabs.map((item) => ({
    id: item.id,
    label: "label" in item ? item.label : t(item.labelKey),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Badge tone="brand">{t("badge")}</Badge>
            <Button variant="secondary">{t("common:actions.selectWorkspace")}</Button>
          </>
        }
      />

      {isError ? (
        <p className="gp-alert-critical">{t("error")}</p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label={t("stats.repository")}
          value={isLoading ? "..." : data?.repositoryName ?? t("common:status.notSelected")}
          detail={t("common:time.currentWorkspace")}
        />
        <StatCard
          label={t("stats.commits")}
          value={isLoading ? "..." : formatCount(data?.totalCommits ?? 0)}
          detail={t("stats.analyzedHistory")}
          tone="brand"
        />
        <StatCard
          label={t("stats.hotspots")}
          value={isLoading ? "..." : formatCount(data?.hotspotCount ?? 0)}
          detail={t("stats.highChangeFiles")}
          tone="watch"
        />
        <StatCard
          label={t("stats.risk")}
          value={isLoading ? "..." : data?.deliveryRiskLevel ?? t("common:status.low")}
          detail={t("stats.deliverySignal")}
          tone="healthy"
        />
      </section>

      <DetailPanel
        title={t("workspaceDetails.title")}
        description={t("workspaceDetails.description")}
        actions={<Tabs items={translatedPeriodTabs} value="30d" onChange={() => undefined} />}
      >
        <Table
          columns={[
            { key: "path", header: t("common:table.file"), render: (row) => row.path },
            { key: "changes", header: t("common:table.changes"), align: "right", render: (row) => row.changes },
            { key: "risk", header: t("common:table.risk"), align: "right", render: (row) => row.risk },
          ]}
          rows={hotspotRows}
          getRowKey={(row) => row.path}
          emptyText={t("common:empty.hotspots")}
        />
      </DetailPanel>

      <ChartCard title={t("chart.activityTrend")} emptyText={t("common:empty.chart")} />
    </div>
  );
}
