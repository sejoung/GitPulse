import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AnalysisBasisPanel,
  Badge,
  DetailPanel,
  EmptyState,
  InfoGrid,
  PageHeader,
  StatCard,
  Table,
} from "../../components/ui";
import { useAnalysisPageContext } from "../../hooks/useAnalysisPageContext";
import { statValue } from "../../lib/analysis-helpers";
import type { BadgeTone } from "../../components/ui/Badge";
import { useStalenessAnalysis } from "./useStalenessAnalysis";

function stalenessTone(staleness: string): BadgeTone {
  switch (staleness) {
    case "critical":
      return "critical";
    case "stale":
      return "watch";
    default:
      return "neutral";
  }
}

export function StalenessPage() {
  const { t } = useTranslation(["staleness", "common", "settings"]);
  const ctx = useAnalysisPageContext();
  const thresholdDays = ctx.riskThresholds.stalenessThresholdDays;
  const { data, isLoading } = useStalenessAnalysis(
    ctx.workspacePath,
    ctx.headSha,
    ctx.excludedPaths,
    thresholdDays
  );
  const files = data?.files ?? [];
  const hasData = files.length > 0;
  const [selectedPath, setSelectedPath] = useState("");
  const selectedFile = files.find((f) => f.path === selectedPath) ?? null;
  const criticalCount = files.filter((f) => f.staleness === "critical").length;
  const na = t("common:status.notAnalyzed");

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={
          <Badge tone={ctx.hasWorkspace ? (criticalCount > 0 ? "critical" : "brand") : "neutral"}>
            {ctx.hasWorkspace ? t("badge") : na}
          </Badge>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("stats.staleFiles")}
          value={statValue(ctx.hasWorkspace, isLoading, String(data?.staleFileCount ?? 0), na)}
          detail={t("stats.staleFilesDetail")}
          tone={ctx.hasWorkspace && hasData ? "watch" : "neutral"}
        />
        <StatCard
          label={t("stats.criticalFiles")}
          value={statValue(ctx.hasWorkspace, isLoading, String(criticalCount), na)}
          detail={t("stats.criticalFilesDetail")}
          tone={ctx.hasWorkspace && criticalCount > 0 ? "critical" : "neutral"}
        />
        <StatCard
          label={t("stats.trackedFiles")}
          value={statValue(ctx.hasWorkspace, isLoading, String(data?.trackedFileCount ?? 0), na)}
          detail={t("common:table.file")}
          tone={ctx.hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.threshold")}
          value={ctx.hasWorkspace ? `${thresholdDays}d` : na}
          detail={t("basis.threshold")}
          tone={ctx.hasWorkspace ? "brand" : "neutral"}
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
          { label: t("basis.threshold"), value: `${thresholdDays} days` },
          {
            label: t("basis.filters"),
            value: `${ctx.excludedPaths.split(",").filter(Boolean).length} excluded`,
          },
        ]}
      />

      <DetailPanel
        title={t("ranking.title")}
        description={t("ranking.description")}
        loading={isLoading}
      >
        {!ctx.hasWorkspace ? (
          <EmptyState title={t("empty.selectWorkspace")} />
        ) : !hasData && !isLoading ? (
          <EmptyState title={t("empty.noStaleFiles")} />
        ) : (
          <Table
            columns={[
              {
                key: "path",
                header: t("common:table.file"),
                className: "max-w-0",
                render: (row) => (
                  <span className="block truncate" title={row.path}>
                    {row.path}
                  </span>
                ),
              },
              {
                key: "lastModified",
                header: t("ranking.lastModified"),
                className: "whitespace-nowrap",
                render: (row) => row.lastModified,
              },
              {
                key: "daysSince",
                header: t("ranking.daysSince"),
                align: "right",
                className: "whitespace-nowrap",
                render: (row) => row.daysSince,
              },
              {
                key: "staleness",
                header: t("ranking.staleness"),
                align: "right",
                className: "whitespace-nowrap",
                render: (row) => {
                  const isSelected = selectedPath === row.path;

                  return (
                    <button
                      type="button"
                      className="inline-block cursor-pointer"
                      onClick={() => setSelectedPath(isSelected ? "" : row.path)}
                    >
                      <Badge tone={isSelected ? "brand" : stalenessTone(row.staleness)}>
                        {t(`signals.${row.staleness}`)}
                      </Badge>
                    </button>
                  );
                },
              },
            ]}
            rows={files}
            getRowKey={(row) => row.path}
            emptyText={t("empty.noStaleFiles")}
          />
        )}
      </DetailPanel>

      {selectedFile ? (
        <DetailPanel
          title={t("details.title")}
          description={t("details.description", { path: selectedFile.path })}
        >
          <InfoGrid
            items={[
              {
                label: t("details.lastModified"),
                value: selectedFile.lastModified,
              },
              {
                label: t("details.daysSince"),
                value: String(selectedFile.daysSince),
              },
              {
                label: t("details.staleness"),
                value: (
                  <Badge tone={stalenessTone(selectedFile.staleness)} className="mt-1">
                    {t(`signals.${selectedFile.staleness}`)}
                  </Badge>
                ),
              },
              {
                label: t("details.reading"),
                value:
                  selectedFile.staleness === "critical"
                    ? t("details.criticalReading")
                    : t("details.staleReading"),
              },
            ]}
          />
        </DetailPanel>
      ) : null}
    </div>
  );
}
