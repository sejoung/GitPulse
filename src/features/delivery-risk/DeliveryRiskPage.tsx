import type { EmergencyPattern } from "../../app/store/ui-store";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../app/store/ui-store";
import { Badge, DetailPanel, PageHeader, StatCard, Table } from "../../components/ui";
import { useDeliveryRiskAnalysis } from "./useDeliveryRiskAnalysis";

export function DeliveryRiskPage() {
  const { t } = useTranslation(["deliveryRisk", "common"]);
  const workspacePath = useUiStore((state) => state.workspacePath);
  const selectedBranch = useUiStore((state) => state.selectedBranch);
  const emergencyPatterns = useUiStore((state) => state.emergencyPatterns);
  const { data: deliveryRows = [], isLoading } = useDeliveryRiskAnalysis(
    workspacePath,
    selectedBranch,
    emergencyPatterns
  );
  const hasWorkspace = Boolean(workspacePath);
  const hasData = deliveryRows.length > 0;
  const summaryRows = hasData
    ? deliveryRows.slice(0, 3)
    : emergencyPatterns
        .filter((item) => item.pattern.trim())
        .slice(0, 3)
        .map(
          (
            item
          ): Pick<EmergencyPattern, "pattern"> & {
            event: string;
            count: number;
            risk: "healthy";
          } => ({
            pattern: item.pattern,
            event: item.pattern,
            count: 0,
            risk: "healthy",
          })
        );
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
        actions={
          <Badge tone={hasWorkspace && hasData ? deliverySignal : "neutral"}>
            {hasWorkspace ? t("badge") : t("common:status.notAnalyzed")}
          </Badge>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryRows.map((row) => (
          <StatCard
            key={row.event}
            label={row.event}
            value={
              !hasWorkspace ? t("common:status.notAnalyzed") : isLoading ? "..." : String(row.count)
            }
            detail={t("common:time.lastYear")}
            tone={hasWorkspace && hasData ? row.risk : "neutral"}
          />
        ))}
        <StatCard
          label={t("stats.signal")}
          value={
            !hasWorkspace
              ? t("common:status.notAnalyzed")
              : isLoading
                ? "..."
                : hasData
                  ? t(`common:status.${deliverySignal}`)
                  : t("common:empty.deliveryRisk")
          }
          detail={t("stats.deliveryRisk")}
          tone={hasWorkspace && hasData ? deliverySignal : "neutral"}
        />
      </section>

      <DetailPanel title={t("patterns.title")} description={t("patterns.description")}>
        <Table
          columns={[
            { key: "event", header: t("common:table.pattern"), render: (row) => row.event },
            {
              key: "count",
              header: t("common:table.count"),
              align: "right",
              render: (row) => row.count,
            },
            {
              key: "signal",
              header: t("common:table.signal"),
              render: (row) => row.signal || t(`common:${row.signalKey}`),
            },
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
          emptyText={
            hasWorkspace ? t("common:empty.deliveryRisk") : t("common:empty.selectWorkspace")
          }
        />
      </DetailPanel>
    </div>
  );
}
