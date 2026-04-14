import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../app/store/ui-store";
import {
  Badge,
  Button,
  DetailPanel,
  EmptyState,
  PageHeader,
  StatCard,
  Table,
} from "../../components/ui";
import type { CoChangePair } from "../../domains/metrics/overview";
import { useGitRepositoryState } from "../overview/useGitBranches";
import { useCoChangeAnalysis } from "./useCoChangeAnalysis";

function signalTone(signal: string) {
  switch (signal) {
    case "tight":
      return "risky";
    case "moderate":
      return "watch";
    default:
      return "healthy";
  }
}

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
  const workspacePath = useUiStore((state) => state.workspacePath);
  const selectedBranch = useUiStore((state) => state.selectedBranch);
  const analysisPeriod = useUiStore((state) => state.analysisPeriod);
  const setActiveItem = useUiStore((state) => state.setActiveItem);
  const globalExcludedPaths = useUiStore((state) => state.excludedPaths);
  const repositoryOverride = useUiStore((state) => state.repositoryOverrides[workspacePath]);
  const excludedPaths = repositoryOverride?.excludedPaths ?? globalExcludedPaths;
  const { data: repositoryState } = useGitRepositoryState(workspacePath);
  const headSha = repositoryState?.headSha ?? null;
  const { data, isLoading } = useCoChangeAnalysis(
    workspacePath,
    selectedBranch,
    headSha,
    analysisPeriod,
    excludedPaths
  );
  const pairs = useMemo(() => data?.pairs ?? [], [data?.pairs]);
  const fileGroups = useMemo(() => groupByFile(pairs), [pairs]);
  const [selectedFile, setSelectedFile] = useState("");
  const hasWorkspace = Boolean(workspacePath);
  const hasData = fileGroups.length > 0;
  const activeFile = fileGroups.find((g) => g.file === selectedFile) ?? null;
  const activePartners = useMemo(
    () => (activeFile ? partnersForFile(pairs, activeFile.file) : []),
    [activeFile, pairs]
  );
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
          <Badge tone={hasWorkspace ? "brand" : "neutral"}>
            {hasWorkspace ? t("badge") : t("common:status.notAnalyzed")}
          </Badge>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("stats.coupledFiles")}
          value={
            !hasWorkspace
              ? t("common:status.notAnalyzed")
              : isLoading
                ? "..."
                : String(fileGroups.length)
          }
          detail={t("stats.coupledFilesDetail")}
          tone={hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.maxPartners")}
          value={
            !hasWorkspace ? t("common:status.notAnalyzed") : isLoading ? "..." : String(maxPartners)
          }
          detail={t("stats.maxPartnersDetail")}
          tone={hasWorkspace && maxPartners >= 3 ? "watch" : hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.analyzedCommits")}
          value={
            !hasWorkspace
              ? t("common:status.notAnalyzed")
              : isLoading
                ? "..."
                : String(data?.analyzedCommitCount ?? 0)
          }
          detail={t(`settings:defaults.analysisWindows.${analysisPeriod}`)}
          tone={hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.tightestCoupling")}
          value={
            !hasWorkspace
              ? t("common:status.notAnalyzed")
              : isLoading
                ? "..."
                : hasData
                  ? t(`signals.${tightestSignal}`)
                  : "-"
          }
          detail={
            hasData ? `${tightCount} ${t("signals.tight").toLowerCase()}` : t("empty.noPairs")
          }
          tone={hasWorkspace && hasData ? signalTone(tightestSignal) : "neutral"}
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
            <p className="gp-kicker">{t("basis.window")}</p>
            <p className="gp-text-secondary mt-1 text-sm">
              {t(`settings:defaults.analysisWindows.${analysisPeriod}`)}
            </p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("basis.filters")}</p>
            <p className="gp-text-secondary mt-1 text-sm">
              {excludedPaths.split(",").filter(Boolean).length} excluded
            </p>
          </div>
        </div>
      </DetailPanel>

      <DetailPanel
        title={t("ranking.title")}
        description={t("ranking.description")}
        loading={isLoading}
      >
        {!hasWorkspace ? (
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
                  <span className="block truncate" title={row.file}>
                    {row.file}
                  </span>
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
                      <Badge tone={isSelected ? "brand" : signalTone(row.maxSignal)}>
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
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="gp-panel p-3">
              <p className="gp-kicker">{t("ranking.partners")}</p>
              <p className="mt-1 text-lg font-semibold text-gp-text-primary">
                {activeFile.partners}
              </p>
            </div>
            <div className="gp-panel p-3">
              <p className="gp-kicker">{t("ranking.maxCoupling")}</p>
              <p className="mt-1 text-lg font-semibold text-gp-text-primary">
                {Math.round(activeFile.maxCoupling * 100)}%
              </p>
            </div>
            <div className="gp-panel p-3">
              <p className="gp-kicker">{t("details.signal")}</p>
              <Badge tone={signalTone(activeFile.maxSignal)} className="mt-1">
                {t(`signals.${activeFile.maxSignal}`)}
              </Badge>
            </div>
          </div>

          <Table
            columns={[
              {
                key: "partner",
                header: t("ranking.partner"),
                className: "max-w-0",
                render: (row) => (
                  <span className="block truncate" title={row.partner}>
                    {row.partner}
                  </span>
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
                  <Badge tone={signalTone(row.signal)}>{t(`signals.${row.signal}`)}</Badge>
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
