import { useTranslation } from "react-i18next";
import { useUiStore } from "../../app/store/ui-store";
import { Badge, DetailPanel, PageHeader, StatCard, Table } from "../../components/ui";
import { useDeliveryRiskAnalysis } from "./useDeliveryRiskAnalysis";

export function DeliveryRiskPage() {
  const { t } = useTranslation(["deliveryRisk", "common"]);
  const workspacePath = useUiStore((state) => state.workspacePath);
  const emergencyKeywords = useUiStore((state) => state.emergencyKeywords);
  const { data: deliveryRows = [], isLoading } = useDeliveryRiskAnalysis(workspacePath, emergencyKeywords);
  const hasWorkspace = Boolean(workspacePath);
  const hasData = deliveryRows.length > 0;
  const eventCount = (event: string) => deliveryRows.find((row) => row.event === event)?.count ?? 0;
  const deliverySignal = deliveryRows.some((row) => row.risk === "risky")
    ? "risky"
    : deliveryRows.some((row) => row.risk === "watch")
      ? "watch"
      : "healthy";

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={<Badge tone={hasWorkspace && hasData ? deliverySignal : "neutral"}>{hasWorkspace ? t("badge") : t("common:status.notAnalyzed")}</Badge>}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("stats.hotfix")} value={!hasWorkspace ? t("common:status.notAnalyzed") : isLoading ? "..." : String(eventCount("hotfix"))} detail={t("common:time.lastYear")} tone={hasWorkspace && hasData ? (eventCount("hotfix") >= 2 ? "watch" : "healthy") : "neutral"} />
        <StatCard label={t("stats.revert")} value={!hasWorkspace ? t("common:status.notAnalyzed") : isLoading ? "..." : String(eventCount("revert"))} detail={t("common:time.lastYear")} tone={hasWorkspace && hasData ? (eventCount("revert") >= 2 ? "watch" : "healthy") : "neutral"} />
        <StatCard label={t("stats.rollback")} value={!hasWorkspace ? t("common:status.notAnalyzed") : isLoading ? "..." : String(eventCount("rollback"))} detail={t("common:time.lastYear")} tone={hasWorkspace && hasData ? (eventCount("rollback") >= 2 ? "watch" : "healthy") : "neutral"} />
        <StatCard label={t("stats.signal")} value={!hasWorkspace ? t("common:status.notAnalyzed") : isLoading ? "..." : hasData ? t(`common:status.${deliverySignal}`) : t("common:empty.deliveryRisk")} detail={t("stats.deliveryRisk")} tone={hasWorkspace && hasData ? deliverySignal : "neutral"} />
      </section>

      <DetailPanel
        title={t("patterns.title")}
        description={t("patterns.description")}
      >
        <Table
          columns={[
            { key: "event", header: t("common:table.pattern"), render: (row) => row.event },
            { key: "count", header: t("common:table.count"), align: "right", render: (row) => row.count },
            { key: "signal", header: t("common:table.signal"), render: (row) => t(`common:${row.signalKey}`) },
            {
              key: "risk",
              header: t("common:table.risk"),
              align: "right",
              render: (row) => (
                <Badge tone={row.risk === "watch" ? "watch" : "healthy"}>
                  {t(`common:status.${row.risk}`)}
                </Badge>
              ),
            },
          ]}
          rows={deliveryRows}
          getRowKey={(row) => row.event}
          emptyText={hasWorkspace ? t("common:empty.deliveryRisk") : t("common:empty.selectWorkspace")}
        />
      </DetailPanel>
    </div>
  );
}
