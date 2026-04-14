import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../app/store/ui-store";
import { Badge, Button, DetailPanel, PageHeader, StatCard, Table } from "../../components/ui";
import { useDeliveryRiskAnalysis } from "./useDeliveryRiskAnalysis";

export function DeliveryRiskPage() {
  const { t } = useTranslation(["deliveryRisk", "common"]);
  const workspacePath = useUiStore((state) => state.workspacePath);
  const selectedBranch = useUiStore((state) => state.selectedBranch);
  const setActiveItem = useUiStore((state) => state.setActiveItem);
  const globalEmergencyPatterns = useUiStore((state) => state.emergencyPatterns);
  const riskThresholds = useUiStore((state) => state.riskThresholds);
  const repositoryOverride = useUiStore((state) => state.repositoryOverrides[workspacePath]);
  const emergencyPatterns = repositoryOverride?.emergencyPatterns ?? globalEmergencyPatterns;
  const [selectedEvent, setSelectedEvent] = useState("");
  const { data: deliveryRows = [], isLoading } = useDeliveryRiskAnalysis(
    workspacePath,
    selectedBranch,
    emergencyPatterns,
    riskThresholds
  );
  const hasWorkspace = Boolean(workspacePath);
  const hasData = deliveryRows.length > 0;
  const selectedPattern = deliveryRows.find((row) => row.event === selectedEvent) ?? null;
  const selectedConfiguredPattern = emergencyPatterns.find(
    (item) => item.pattern === selectedPattern?.event
  );
  const summaryRows = hasData
    ? deliveryRows.slice(0, 3)
    : emergencyPatterns
        .filter((item) => item.pattern.trim())
        .slice(0, 3)
        .map(
          (
            item
          ): {
            pattern: string;
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

      <DetailPanel
        title={t("basis.title")}
        description={t("basis.description")}
        actions={
          <Button variant="secondary" onClick={() => setActiveItem("settings")}>
            {t("common:actions.openSettings")}
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("basis.repository")}</p>
            <p className="gp-text-secondary mt-1 break-words text-sm">
              {hasWorkspace ? workspacePath : t("common:status.notSelected")}
            </p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("basis.branch")}</p>
            <p className="gp-text-secondary mt-1 text-sm">
              {selectedBranch || t("common:status.notSelected")}
            </p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("basis.patternRows")}</p>
            <p className="gp-text-secondary mt-1 text-sm">{emergencyPatterns.length}</p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("basis.matchedRows")}</p>
            <p className="gp-text-secondary mt-1 text-sm">{deliveryRows.length}</p>
          </div>
        </div>
      </DetailPanel>

      <DetailPanel
        title={t("patterns.title")}
        description={t("patterns.description")}
        loading={isLoading}
      >
        <Table
          columns={[
            {
              key: "event",
              header: t("common:table.pattern"),
              className: "w-[30%]",
              render: (row) => (
                <span className="block truncate" title={row.event}>
                  {row.event}
                </span>
              ),
            },
            {
              key: "count",
              header: t("common:table.count"),
              align: "right",
              render: (row) => row.count,
            },
            {
              key: "signal",
              header: t("common:table.signal"),
              className: "w-[25%]",
              render: (row) => (
                <span className="block truncate" title={row.signal || t(`common:${row.signalKey}`)}>
                  {row.signal || t(`common:${row.signalKey}`)}
                </span>
              ),
            },
            {
              key: "risk",
              header: t("common:table.risk"),
              align: "right",
              render: (row) => (
                <Badge
                  tone={row.risk === "risky" ? "risky" : row.risk === "watch" ? "watch" : "healthy"}
                >
                  {t(`common:status.${row.risk}`)}
                </Badge>
              ),
            },
            {
              key: "details",
              header: t("patterns.details"),
              align: "right",
              render: (row) => (
                <Button
                  variant={selectedPattern?.event === row.event ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setSelectedEvent(row.event)}
                >
                  {selectedPattern?.event === row.event
                    ? t("patterns.selected")
                    : t("patterns.inspect")}
                </Button>
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

      {selectedPattern ? (
        <DetailPanel
          title={t("details.title")}
          description={t("details.description", { pattern: selectedPattern.event })}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("common:table.pattern")}</p>
              <p className="gp-text-secondary mt-1 break-words text-sm">{selectedPattern.event}</p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("common:table.count")}</p>
              <p className="gp-text-secondary mt-1 text-sm">{selectedPattern.count}</p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("common:table.signal")}</p>
              <p className="gp-text-secondary mt-1 break-words text-sm">
                {selectedPattern.signal || t(`common:${selectedPattern.signalKey}`)}
              </p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("common:table.risk")}</p>
              <Badge
                tone={
                  selectedPattern.risk === "risky"
                    ? "risky"
                    : selectedPattern.risk === "watch"
                      ? "watch"
                      : "healthy"
                }
                className="mt-2"
              >
                {t(`common:status.${selectedPattern.risk}`)}
              </Badge>
            </div>
          </div>
          <div className="gp-panel mt-3 min-w-0 p-3">
            <p className="gp-kicker">{t("details.configuredSignal")}</p>
            <p className="gp-text-secondary mt-1 break-words text-sm">
              {selectedConfiguredPattern?.signal ?? t("details.noConfiguredSignal")}
            </p>
          </div>
        </DetailPanel>
      ) : hasWorkspace && hasData ? (
        <DetailPanel title={t("details.title")} description={t("details.emptyDescription")}>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("details.emptyTitle")}</p>
            <p className="gp-text-secondary mt-2 text-sm">{t("details.emptyBody")}</p>
          </div>
        </DetailPanel>
      ) : null}
    </div>
  );
}
