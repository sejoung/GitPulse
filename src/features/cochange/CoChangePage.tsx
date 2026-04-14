import { useMemo, useState } from "react";
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
  TruncatedCell,
} from "../../components/ui";
import type { CoChangePair } from "../../domains/metrics/overview";
import { useAnalysisPageContext } from "../../hooks/useAnalysisPageContext";
import { couplingTone, statValue } from "../../lib/analysis-helpers";
import { useCoChangeAnalysis } from "./useCoChangeAnalysis";

type FileGroup = {
  file: string;
  partners: number;
  maxCoupling: number;
  maxSignal: string;
};

function groupByFile(pairs: CoChangePair[]): FileGroup[] {
  const map = new Map<string, { partners: number; maxCoupling: number; maxSignal: string }>();
  const signalRank: Record<string, number> = { tight: 3, moderate: 2, loose: 1 };

  for (const pair of pairs) {
    for (const file of [pair.fileA, pair.fileB]) {
      const entry = map.get(file);

      if (entry) {
        entry.partners += 1;

        if (pair.couplingRatio > entry.maxCoupling) {
          entry.maxCoupling = pair.couplingRatio;
        }

        if ((signalRank[pair.signal] ?? 0) > (signalRank[entry.maxSignal] ?? 0)) {
          entry.maxSignal = pair.signal;
        }
      } else {
        map.set(file, {
          partners: 1,
          maxCoupling: pair.couplingRatio,
          maxSignal: pair.signal,
        });
      }
    }
  }

  return Array.from(map.entries())
    .map(([file, data]) => ({ file, ...data }))
    .sort((a, b) => b.partners - a.partners || b.maxCoupling - a.maxCoupling);
}

function partnersForFile(pairs: CoChangePair[], file: string) {
  return pairs
    .filter((p) => p.fileA === file || p.fileB === file)
    .map((p) => ({
      partner: p.fileA === file ? p.fileB : p.fileA,
      coChangeCount: p.coChangeCount,
      couplingRatio: p.couplingRatio,
      signal: p.signal,
    }))
    .sort((a, b) => b.couplingRatio - a.couplingRatio);
}

export function CoChangePage() {
  const { t } = useTranslation(["cochange", "common", "settings"]);
  const ctx = useAnalysisPageContext();
  const { data, isLoading } = useCoChangeAnalysis(
    ctx.workspacePath,
    ctx.selectedBranch,
    ctx.headSha,
    ctx.analysisPeriod,
    ctx.excludedPaths
  );
  const pairs = useMemo(() => data?.pairs ?? [], [data?.pairs]);
  const fileGroups = useMemo(() => groupByFile(pairs), [pairs]);
  const [selectedFile, setSelectedFile] = useState("");
  const hasData = fileGroups.length > 0;
  const activeFile = fileGroups.find((g) => g.file === selectedFile) ?? null;
  const activePartners = useMemo(
    () => (activeFile ? partnersForFile(pairs, activeFile.file) : []),
    [activeFile, pairs]
  );
  const na = t("common:status.notAnalyzed");
  const tightestSignal = fileGroups[0]?.maxSignal ?? "loose";
  const tightCount = fileGroups.filter((g) => g.maxSignal === "tight").length;
  const maxPartners = fileGroups[0]?.partners ?? 0;

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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("stats.coupledFiles")}
          value={statValue(ctx.hasWorkspace, isLoading, String(fileGroups.length), na)}
          detail={t("stats.coupledFilesDetail")}
          tone={ctx.hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.maxPartners")}
          value={statValue(ctx.hasWorkspace, isLoading, String(maxPartners), na)}
          detail={t("stats.maxPartnersDetail")}
          tone={
            ctx.hasWorkspace && maxPartners >= 3 ? "watch" : ctx.hasWorkspace ? "brand" : "neutral"
          }
        />
        <StatCard
          label={t("stats.analyzedCommits")}
          value={statValue(ctx.hasWorkspace, isLoading, String(data?.analyzedCommitCount ?? 0), na)}
          detail={t(`settings:defaults.analysisWindows.${ctx.analysisPeriod}`)}
          tone={ctx.hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.tightestCoupling")}
          value={statValue(
            ctx.hasWorkspace,
            isLoading,
            hasData ? t(`signals.${tightestSignal}`) : "-",
            na
          )}
          detail={
            hasData ? `${tightCount} ${t("signals.tight").toLowerCase()}` : t("empty.noPairs")
          }
          tone={ctx.hasWorkspace && hasData ? couplingTone(tightestSignal) : "neutral"}
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
          { label: t("basis.branch"), value: ctx.selectedBranch || t("common:status.notSelected") },
          {
            label: t("basis.window"),
            value: t(`settings:defaults.analysisWindows.${ctx.analysisPeriod}`),
          },
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
          <EmptyState title={t("empty.noPairs")} />
        ) : (
          <Table
            columns={[
              {
                key: "file",
                header: t("common:table.file"),
                className: "max-w-0",
                render: (row) => (
                  <TruncatedCell value={row.file} workspacePath={ctx.workspacePath} />
                ),
              },
              {
                key: "partners",
                header: t("ranking.partners"),
                align: "right",
                className: "whitespace-nowrap",
                render: (row) => row.partners,
              },
              {
                key: "maxCoupling",
                header: t("ranking.maxCoupling"),
                align: "right",
                className: "whitespace-nowrap",
                render: (row) => `${Math.round(row.maxCoupling * 100)}%`,
              },
              {
                key: "signal",
                header: t("ranking.signal"),
                align: "right",
                className: "whitespace-nowrap",
                render: (row) => {
                  const isSelected = selectedFile === row.file;

                  return (
                    <button
                      type="button"
                      className="inline-block cursor-pointer"
                      onClick={() => setSelectedFile(isSelected ? "" : row.file)}
                    >
                      <Badge tone={isSelected ? "brand" : couplingTone(row.maxSignal)}>
                        {t(`signals.${row.maxSignal}`)}
                      </Badge>
                    </button>
                  );
                },
              },
            ]}
            rows={fileGroups}
            getRowKey={(row) => row.file}
            emptyText={t("empty.noPairs")}
          />
        )}
      </DetailPanel>

      {activeFile ? (
        <DetailPanel
          title={t("details.title")}
          description={t("details.fileDescription", { file: activeFile.file })}
        >
          <InfoGrid
            className="mb-4"
            columns="md:grid-cols-3"
            items={[
              { label: t("ranking.partners"), value: String(activeFile.partners) },
              {
                label: t("ranking.maxCoupling"),
                value: `${Math.round(activeFile.maxCoupling * 100)}%`,
              },
              {
                label: t("details.signal"),
                value: (
                  <Badge tone={couplingTone(activeFile.maxSignal)} className="mt-1">
                    {t(`signals.${activeFile.maxSignal}`)}
                  </Badge>
                ),
              },
            ]}
          />

          <Table
            columns={[
              {
                key: "partner",
                header: t("ranking.partner"),
                className: "max-w-0",
                render: (row) => (
                  <TruncatedCell value={row.partner} workspacePath={ctx.workspacePath} />
                ),
              },
              {
                key: "coChangeCount",
                header: t("ranking.coChanges"),
                align: "right",
                className: "whitespace-nowrap",
                render: (row) => row.coChangeCount,
              },
              {
                key: "couplingRatio",
                header: t("ranking.coupling"),
                align: "right",
                className: "whitespace-nowrap",
                render: (row) => `${Math.round(row.couplingRatio * 100)}%`,
              },
              {
                key: "signal",
                header: t("ranking.signal"),
                align: "right",
                className: "whitespace-nowrap",
                render: (row) => (
                  <Badge tone={couplingTone(row.signal)}>{t(`signals.${row.signal}`)}</Badge>
                ),
              },
            ]}
            rows={activePartners}
            getRowKey={(row) => row.partner}
            emptyText={t("empty.noPairs")}
          />
        </DetailPanel>
      ) : null}
    </div>
  );
}
