import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AnalysisBasisPanel,
  Badge,
  Button,
  DetailPanel,
  InfoGrid,
  PageHeader,
  StatCard,
  Table,
  TruncatedCell,
} from "../../components/ui";
import { useAnalysisPageContext } from "../../hooks/useAnalysisPageContext";
import { riskTone, statValue } from "../../lib/analysis-helpers";
import { useDeliveryRiskAnalysis } from "./useDeliveryRiskAnalysis";

export function DeliveryRiskPage() {
  const { t } = useTranslation(["deliveryRisk", "common"]);
  const ctx = useAnalysisPageContext();
  const [selectedEvent, setSelectedEvent] = useState("");
  const { data: deliveryRows = [], isLoading } = useDeliveryRiskAnalysis(
    ctx.workspacePath,
    ctx.selectedBranch,
    ctx.headSha,
    ctx.emergencyPatterns,
    ctx.riskThresholds
  );
  const hasData = deliveryRows.length > 0;
  const selectedPattern = deliveryRows.find((row) => row.event === selectedEvent) ?? null;
  const selectedConfiguredPattern = ctx.emergencyPatterns.find(
    (item) => item.pattern === selectedPattern?.event
  );
  const summaryRows = hasData
    ? deliveryRows.slice(0, 3)
    : ctx.emergencyPatterns
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
  const na = t("common:status.notAnalyzed");

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={
          <Badge tone={ctx.hasWorkspace && hasData ? deliverySignal : "neutral"}>
            {ctx.hasWorkspace ? t("badge") : na}
          </Badge>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryRows.map((row) => (
          <StatCard
            key={row.event}
            label={row.event}
            value={statValue(ctx.hasWorkspace, isLoading, String(row.count), na)}
            detail={t("common:time.lastYear")}
            tone={ctx.hasWorkspace && hasData ? row.risk : "neutral"}
          />
        ))}
        <StatCard
          label={t("stats.signal")}
          value={statValue(
            ctx.hasWorkspace,
            isLoading,
            hasData ? t(`common:status.${deliverySignal}`) : t("common:empty.deliveryRisk"),
            na
          )}
          detail={t("stats.deliveryRisk")}
          tone={ctx.hasWorkspace && hasData ? deliverySignal : "neutral"}
        />
      </section>

      <AnalysisBasisPanel
        title={t("basis.title")}
        description={t("basis.description")}
        onOpenSettings={() => ctx.setActiveItem("settings")}
        items={[
          {
            label: t("basis.repository"),
            value: ctx.hasWorkspace ? ctx.workspacePath : t("common:status.notSelected"),
            breakWords: true,
          },
          {
            label: t("basis.branch"),
            value: ctx.selectedBranch || t("common:status.notSelected"),
          },
          { label: t("basis.patternRows"), value: String(ctx.emergencyPatterns.length) },
          { label: t("basis.matchedRows"), value: String(deliveryRows.length) },
        ]}
      />

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
              render: (row) => <TruncatedCell value={row.event} />,
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
              render: (row) => <TruncatedCell value={row.signal || t(`common:${row.signalKey}`)} />,
            },
            {
              key: "risk",
              header: t("common:table.risk"),
              align: "right",
              render: (row) => (
                <Badge tone={riskTone(row.risk)}>{t(`common:status.${row.risk}`)}</Badge>
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
            ctx.hasWorkspace ? t("common:empty.deliveryRisk") : t("common:empty.selectWorkspace")
          }
        />
      </DetailPanel>

      {selectedPattern ? (
        <DetailPanel
          title={t("details.title")}
          description={t("details.description", { pattern: selectedPattern.event })}
        >
          <InfoGrid
            items={[
              { label: t("common:table.pattern"), value: selectedPattern.event, breakWords: true },
              { label: t("common:table.count"), value: String(selectedPattern.count) },
              {
                label: t("common:table.signal"),
                value: selectedPattern.signal || t(`common:${selectedPattern.signalKey}`),
                breakWords: true,
              },
              {
                label: t("common:table.risk"),
                value: (
                  <Badge tone={riskTone(selectedPattern.risk)} className="mt-2">
                    {t(`common:status.${selectedPattern.risk}`)}
                  </Badge>
                ),
              },
            ]}
          />
          <div className="gp-panel mt-3 min-w-0 p-3">
            <p className="gp-kicker">{t("details.configuredSignal")}</p>
            <p className="gp-text-secondary mt-1 break-words text-sm">
              {selectedConfiguredPattern?.signal ?? t("details.noConfiguredSignal")}
            </p>
          </div>
        </DetailPanel>
      ) : ctx.hasWorkspace && hasData ? (
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
