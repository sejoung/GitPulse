import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChartCard } from "../../components/charts";
import {
  AnalysisBasisPanel,
  Badge,
  Button,
  DetailPanel,
  EmptyState,
  InfoGrid,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  Tabs,
  TruncatedCell,
} from "../../components/ui";
import { useAnalysisPageContext } from "../../hooks/useAnalysisPageContext";
import { riskTone, statValue } from "../../lib/analysis-helpers";
import { useHotspotCommitDetails, useHotspotsAnalysis } from "./useHotspotsAnalysis";

export function HotspotsPage() {
  const { t } = useTranslation(["hotspots", "common", "settings"]);
  const ctx = useAnalysisPageContext();
  const [selectedPath, setSelectedPath] = useState("");
  const [commitScope, setCommitScope] = useState<"all" | "matched">("all");
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const [commitSearch, setCommitSearch] = useState("");
  const [showCommitFilters, setShowCommitFilters] = useState(false);
  const { data: hotspotRows = [], isLoading } = useHotspotsAnalysis(
    ctx.workspacePath,
    ctx.selectedBranch,
    ctx.headSha,
    ctx.analysisPeriod,
    ctx.excludedPaths,
    ctx.bugKeywords,
    ctx.riskThresholds
  );
  const hasData = hotspotRows.length > 0;
  const selectedHotspot = hotspotRows.find((row) => row.path === selectedPath) ?? hotspotRows[0];
  const { data: commitRows = [], isLoading: isCommitLoading } = useHotspotCommitDetails(
    ctx.workspacePath,
    ctx.selectedBranch,
    ctx.headSha,
    ctx.analysisPeriod,
    ctx.bugKeywords,
    selectedHotspot?.path ?? ""
  );
  const bugOverlap = hotspotRows.filter((row) => row.fixes > 0).length;
  const highestSignal = hotspotRows.some((row) => row.risk === "risky")
    ? "risky"
    : hotspotRows.some((row) => row.risk === "watch")
      ? "watch"
      : "healthy";
  const commitAuthors = useMemo(
    () =>
      Array.from(new Set(commitRows.map((row) => row.author))).sort((left, right) =>
        left.localeCompare(right)
      ),
    [commitRows]
  );
  const filteredCommitRows = useMemo(() => {
    const normalizedSearch = commitSearch.trim().toLowerCase();

    return commitRows.filter((row) => {
      if (commitScope === "matched" && !row.matchesBugKeyword) {
        return false;
      }

      if (selectedAuthor !== "all" && row.author !== selectedAuthor) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [row.shortSha, row.author, row.subject, row.date].some((value) =>
        value.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [commitRows, commitScope, selectedAuthor, commitSearch]);
  const matchedCommitCount = commitRows.filter((row) => row.matchesBugKeyword).length;
  const latestCommitDate = commitRows[0]?.date ?? t("details.noCommitEvidence");
  const na = t("common:status.notAnalyzed");

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={
          <Badge tone={ctx.hasWorkspace ? "brand" : "neutral"}>
            {ctx.hasWorkspace ? t("badge") : t("common:status.notAnalyzed")}
          </Badge>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={t("stats.topChurnFiles")}
          value={statValue(ctx.hasWorkspace, isLoading, String(hotspotRows.length), na)}
          detail={t("common:time.lastYear")}
          tone={ctx.hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.bugOverlap")}
          value={statValue(ctx.hasWorkspace, isLoading, String(bugOverlap), na)}
          detail={t("stats.highChangeAndFixHeavy")}
          tone={ctx.hasWorkspace ? "watch" : "neutral"}
        />
        <StatCard
          label={t("stats.highestSignal")}
          value={statValue(
            ctx.hasWorkspace,
            isLoading,
            hasData ? t(`common:status.${highestSignal}`) : t("common:empty.hotspots"),
            na
          )}
          detail={t("stats.potentialMaintenanceLoad")}
          tone={ctx.hasWorkspace && hasData ? highestSignal : "neutral"}
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
          {
            label: t("basis.window"),
            value: t(`settings:defaults.analysisWindows.${ctx.analysisPeriod}`),
          },
          {
            label: t("basis.filters"),
            value: `${ctx.bugKeywords.split(",").filter(Boolean).length} / ${ctx.excludedPaths.split(",").filter(Boolean).length}`,
          },
        ]}
      />

      <DetailPanel
        title={t("ranking.title")}
        description={t("ranking.description")}
        loading={isLoading}
      >
        <Table
          columns={[
            {
              key: "path",
              header: t("common:table.file"),
              className: "w-[40%]",
              render: (row) => <TruncatedCell value={row.path} workspacePath={ctx.workspacePath} />,
            },
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
                <Badge tone={riskTone(row.risk)}>{t(`common:status.${row.risk}`)}</Badge>
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
          emptyText={
            ctx.hasWorkspace ? t("common:empty.hotspots") : t("common:empty.selectWorkspace")
          }
        />
      </DetailPanel>

      {selectedHotspot ? (
        <DetailPanel
          title={t("details.title")}
          description={t("details.description", { path: selectedHotspot.path })}
          loading={isCommitLoading}
        >
          <InfoGrid
            items={[
              { label: t("common:table.file"), value: selectedHotspot.path, breakWords: true },
              { label: t("common:table.changes"), value: String(selectedHotspot.changes) },
              { label: t("common:table.fixCommits"), value: String(selectedHotspot.fixes) },
              {
                label: t("common:table.signal"),
                value: (
                  <Badge tone={riskTone(selectedHotspot.risk)} className="mt-2">
                    {t(`common:status.${selectedHotspot.risk}`)}
                  </Badge>
                ),
              },
            ]}
          />
          <InfoGrid
            className="mt-3"
            columns="md:grid-cols-2"
            items={[
              { label: t("details.bugKeywords"), value: ctx.bugKeywords, breakWords: true },
              { label: t("details.excludedPaths"), value: ctx.excludedPaths, breakWords: true },
            ]}
          />
          <div className="mt-4">
            <div className="gp-status-row">
              <div className="min-w-0">
                <p className="gp-kicker">{t("details.commitEvidence")}</p>
                <p className="gp-text-secondary mt-1 text-sm">
                  {t("details.commitEvidenceDescription")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={matchedCommitCount > 0 ? "watch" : "neutral"} className="w-fit">
                  {t("details.recentCommits", { count: commitRows.length })}
                </Badge>
                {commitRows.length > 0 ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowCommitFilters((current) => !current)}
                  >
                    {showCommitFilters ? t("details.hideFilters") : t("details.showFilters")}
                  </Button>
                ) : null}
              </div>
            </div>
            {commitRows.length > 0 ? (
              <>
                <InfoGrid
                  className="mt-3"
                  items={[
                    { label: t("details.summary.totalCommits"), value: String(commitRows.length) },
                    {
                      label: t("details.summary.matchedCommits"),
                      value: String(matchedCommitCount),
                    },
                    { label: t("details.summary.authors"), value: String(commitAuthors.length) },
                    { label: t("details.summary.latestDate"), value: latestCommitDate },
                  ]}
                />
                {showCommitFilters ? (
                  <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,0.7fr)_minmax(0,0.6fr)_minmax(0,1fr)]">
                    <div className="gp-panel min-w-0 p-3">
                      <p className="gp-kicker">{t("details.scope")}</p>
                      <div className="mt-2">
                        <Tabs
                          items={[
                            { id: "all", label: t("details.scopeAll") },
                            { id: "matched", label: t("details.scopeMatched") },
                          ]}
                          value={commitScope}
                          onChange={(value) => setCommitScope(value)}
                        />
                      </div>
                    </div>
                    <div className="gp-panel min-w-0 p-3">
                      <label className="gp-kicker" htmlFor="hotspot-author-filter">
                        {t("details.authorFilter")}
                      </label>
                      <Select
                        id="hotspot-author-filter"
                        className="mt-2"
                        value={selectedAuthor}
                        aria-label={t("details.authorFilter")}
                        onChange={(event) => setSelectedAuthor(event.target.value)}
                      >
                        <option value="all">{t("details.allAuthors")}</option>
                        {commitAuthors.map((author) => (
                          <option key={author} value={author}>
                            {author}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="gp-panel min-w-0 p-3">
                      <label className="gp-kicker" htmlFor="hotspot-commit-search">
                        {t("details.search")}
                      </label>
                      <Input
                        id="hotspot-commit-search"
                        className="mt-2"
                        value={commitSearch}
                        onChange={(event) => setCommitSearch(event.target.value)}
                        placeholder={t("details.searchPlaceholder")}
                        aria-label={t("details.search")}
                      />
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 space-y-3 xl:hidden">
                  {filteredCommitRows.map((row) => (
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
                <div className="mt-3 hidden xl:block">
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
                        className: "w-[35%]",
                        render: (row) => <TruncatedCell value={row.subject} />,
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
                    rows={filteredCommitRows}
                    getRowKey={(row) => row.sha}
                    emptyText={
                      isCommitLoading ? t("details.loadingCommits") : t("details.noFilteredCommits")
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
            title={
              ctx.hasWorkspace ? t("common:empty.hotspots") : t("common:empty.selectWorkspace")
            }
            description={
              ctx.hasWorkspace ? t("common:empty.chart") : t("common:empty.selectWorkspaceDetail")
            }
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
