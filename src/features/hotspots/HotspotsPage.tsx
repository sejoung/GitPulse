import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../app/store/ui-store";
import { ChartCard } from "../../components/charts";
import {
  Badge,
  Button,
  DetailPanel,
  EmptyState,
  PageHeader,
  StatCard,
  Table,
} from "../../components/ui";
import { useHotspotCommitDetails, useHotspotsAnalysis } from "./useHotspotsAnalysis";

export function HotspotsPage() {
  const { t } = useTranslation(["hotspots", "common"]);
  const workspacePath = useUiStore((state) => state.workspacePath);
  const selectedBranch = useUiStore((state) => state.selectedBranch);
  const analysisPeriod = useUiStore((state) => state.analysisPeriod);
  const excludedPaths = useUiStore((state) => state.excludedPaths);
  const bugKeywords = useUiStore((state) => state.bugKeywords);
  const [selectedPath, setSelectedPath] = useState("");
  const { data: hotspotRows = [], isLoading } = useHotspotsAnalysis(
    workspacePath,
    selectedBranch,
    analysisPeriod,
    excludedPaths,
    bugKeywords
  );
  const hasWorkspace = Boolean(workspacePath);
  const hasData = hotspotRows.length > 0;
  const selectedHotspot = hotspotRows.find((row) => row.path === selectedPath) ?? hotspotRows[0];
  const { data: commitRows = [], isLoading: isCommitLoading } = useHotspotCommitDetails(
    workspacePath,
    selectedBranch,
    analysisPeriod,
    bugKeywords,
    selectedHotspot?.path ?? ""
  );
  const bugOverlap = hotspotRows.filter((row) => row.fixes > 0).length;
  const highestSignal = hotspotRows.some((row) => row.risk === "risky")
    ? "risky"
    : hotspotRows.some((row) => row.risk === "watch")
      ? "watch"
      : "healthy";

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={
          <Badge tone={hasWorkspace ? "brand" : "neutral"}>
            {hasWorkspace ? t("badge") : t("common:status.notAnalyzed")}
          </Badge>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={t("stats.topChurnFiles")}
          value={
            !hasWorkspace
              ? t("common:status.notAnalyzed")
              : isLoading
                ? "..."
                : String(hotspotRows.length)
          }
          detail={t("common:time.lastYear")}
          tone={hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.bugOverlap")}
          value={
            !hasWorkspace ? t("common:status.notAnalyzed") : isLoading ? "..." : String(bugOverlap)
          }
          detail={t("stats.highChangeAndFixHeavy")}
          tone={hasWorkspace ? "watch" : "neutral"}
        />
        <StatCard
          label={t("stats.highestSignal")}
          value={
            !hasWorkspace
              ? t("common:status.notAnalyzed")
              : isLoading
                ? "..."
                : hasData
                  ? t(`common:status.${highestSignal}`)
                  : t("common:empty.hotspots")
          }
          detail={t("stats.potentialMaintenanceLoad")}
          tone={hasWorkspace && hasData ? highestSignal : "neutral"}
        />
      </section>

      <DetailPanel title={t("ranking.title")} description={t("ranking.description")}>
        <Table
          columns={[
            { key: "path", header: t("common:table.file"), render: (row) => row.path },
            {
              key: "changes",
              header: t("common:table.changes"),
              align: "right",
              render: (row) => row.changes,
            },
            {
              key: "fixes",
              header: t("common:table.fixCommits"),
              align: "right",
              render: (row) => row.fixes,
            },
            {
              key: "risk",
              header: t("common:table.signal"),
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
              header: t("ranking.details"),
              align: "right",
              render: (row) => (
                <Button
                  variant={selectedHotspot?.path === row.path ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setSelectedPath(row.path)}
                >
                  {selectedHotspot?.path === row.path
                    ? t("ranking.selected")
                    : t("ranking.inspect")}
                </Button>
              ),
            },
          ]}
          rows={hotspotRows}
          getRowKey={(row) => row.path}
          emptyText={hasWorkspace ? t("common:empty.hotspots") : t("common:empty.selectWorkspace")}
        />
      </DetailPanel>

      {selectedHotspot ? (
        <DetailPanel
          title={t("details.title")}
          description={t("details.description", { path: selectedHotspot.path })}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("common:table.file")}</p>
              <p className="gp-text-secondary mt-1 break-words text-sm">{selectedHotspot.path}</p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("common:table.changes")}</p>
              <p className="gp-text-secondary mt-1 text-sm">{selectedHotspot.changes}</p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("common:table.fixCommits")}</p>
              <p className="gp-text-secondary mt-1 text-sm">{selectedHotspot.fixes}</p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("common:table.signal")}</p>
              <Badge
                tone={
                  selectedHotspot.risk === "risky"
                    ? "risky"
                    : selectedHotspot.risk === "watch"
                      ? "watch"
                      : "healthy"
                }
                className="mt-2"
              >
                {t(`common:status.${selectedHotspot.risk}`)}
              </Badge>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("details.bugKeywords")}</p>
              <p className="gp-text-secondary mt-1 break-words text-sm">{bugKeywords}</p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("details.excludedPaths")}</p>
              <p className="gp-text-secondary mt-1 break-words text-sm">{excludedPaths}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="gp-kicker">{t("details.commitEvidence")}</p>
            <p className="gp-text-secondary mt-1 mb-3 text-sm">
              {t("details.commitEvidenceDescription")}
            </p>
            {commitRows.length > 0 ? (
              <>
                <div className="space-y-3 xl:hidden">
                  {commitRows.map((row) => (
                    <div key={row.sha} className="gp-panel min-w-0 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="brand">{row.shortSha}</Badge>
                        <Badge tone={row.matchesBugKeyword ? "watch" : "neutral"}>
                          {row.matchesBugKeyword
                            ? t("details.bugKeywordMatched")
                            : t("details.changeOnly")}
                        </Badge>
                      </div>
                      <p className="gp-text-secondary mt-3 break-words text-sm">{row.subject}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="min-w-0">
                          <p className="gp-kicker">{t("details.date")}</p>
                          <p className="gp-text-secondary mt-1 text-sm">{row.date}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="gp-kicker">{t("details.author")}</p>
                          <p className="gp-text-secondary mt-1 break-words text-sm">{row.author}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden xl:block">
                  <Table
                    columns={[
                      {
                        key: "sha",
                        header: t("details.commit"),
                        render: (row) => row.shortSha,
                      },
                      {
                        key: "date",
                        header: t("details.date"),
                        render: (row) => row.date,
                      },
                      {
                        key: "author",
                        header: t("details.author"),
                        render: (row) => row.author,
                      },
                      {
                        key: "subject",
                        header: t("details.subject"),
                        render: (row) => (
                          <span className="block max-w-md truncate" title={row.subject}>
                            {row.subject}
                          </span>
                        ),
                      },
                      {
                        key: "match",
                        header: t("details.keywordMatch"),
                        align: "right",
                        render: (row) =>
                          row.matchesBugKeyword ? (
                            <Badge tone="watch">{t("details.bugKeywordMatched")}</Badge>
                          ) : (
                            <Badge tone="neutral">{t("details.changeOnly")}</Badge>
                          ),
                      },
                    ]}
                    rows={commitRows}
                    getRowKey={(row) => row.sha}
                    emptyText={
                      isCommitLoading ? t("details.loadingCommits") : t("details.noCommitEvidence")
                    }
                  />
                </div>
              </>
            ) : (
              <div className="gp-panel min-w-0 p-3">
                <p className="gp-text-secondary text-sm">
                  {isCommitLoading ? t("details.loadingCommits") : t("details.noCommitEvidence")}
                </p>
              </div>
            )}
          </div>
        </DetailPanel>
      ) : null}

      <ChartCard title={t("chart.title")} description={t("chart.description")}>
        {hotspotRows.length === 0 ? (
          <EmptyState
            title={hasWorkspace ? t("common:empty.hotspots") : t("common:empty.selectWorkspace")}
          />
        ) : (
          <div className="space-y-3">
            {hotspotRows.map((row) => (
              <div key={row.path} className="space-y-1">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="gp-text-secondary truncate">{row.path}</span>
                  <span className="gp-text-muted">{row.changes}</span>
                </div>
                <div className="h-2 rounded-md bg-gp-bg-tertiary">
                  <div
                    className="h-2 rounded-md bg-gp-brand-cyan"
                    style={{ width: `${row.changes}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
}
