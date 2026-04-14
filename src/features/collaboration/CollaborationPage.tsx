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
} from "../../components/ui";
import type { CollaborationPair } from "../../domains/metrics/overview";
import { useAnalysisPageContext } from "../../hooks/useAnalysisPageContext";
import { statValue } from "../../lib/analysis-helpers";
import { useCollaborationAnalysis } from "./useCollaborationAnalysis";

import type { BadgeTone } from "../../components/ui/Badge";

function strengthTone(strength: string): BadgeTone {
  switch (strength) {
    case "strong":
      return "healthy";
    case "moderate":
      return "watch";
    default:
      return "neutral";
  }
}

type ContributorGroup = {
  name: string;
  partners: number;
  maxSharedFiles: number;
  maxStrength: string;
};

function groupByContributor(pairs: CollaborationPair[]): ContributorGroup[] {
  const strengthRank: Record<string, number> = { strong: 3, moderate: 2, weak: 1 };
  const map = new Map<string, { partners: number; maxSharedFiles: number; maxStrength: string }>();

  for (const pair of pairs) {
    for (const name of [pair.authorA, pair.authorB]) {
      const entry = map.get(name);

      if (entry) {
        entry.partners += 1;

        if (pair.sharedFileCount > entry.maxSharedFiles) {
          entry.maxSharedFiles = pair.sharedFileCount;
        }

        if ((strengthRank[pair.strength] ?? 0) > (strengthRank[entry.maxStrength] ?? 0)) {
          entry.maxStrength = pair.strength;
        }
      } else {
        map.set(name, {
          partners: 1,
          maxSharedFiles: pair.sharedFileCount,
          maxStrength: pair.strength,
        });
      }
    }
  }

  return Array.from(map.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.partners - a.partners || b.maxSharedFiles - a.maxSharedFiles);
}

function partnersFor(pairs: CollaborationPair[], name: string) {
  return pairs
    .filter((p) => p.authorA === name || p.authorB === name)
    .map((p) => ({
      partner: p.authorA === name ? p.authorB : p.authorA,
      sharedFileCount: p.sharedFileCount,
      strength: p.strength,
    }))
    .sort((a, b) => b.sharedFileCount - a.sharedFileCount);
}

export function CollaborationPage() {
  const { t } = useTranslation(["collaboration", "common", "settings"]);
  const ctx = useAnalysisPageContext();
  const { data, isLoading } = useCollaborationAnalysis(
    ctx.workspacePath,
    ctx.selectedBranch,
    ctx.headSha,
    ctx.analysisPeriod,
    ctx.excludedPaths
  );
  const pairs = useMemo(() => data?.pairs ?? [], [data?.pairs]);
  const groups = useMemo(() => groupByContributor(pairs), [pairs]);
  const [selectedName, setSelectedName] = useState("");
  const hasData = groups.length > 0;
  const activeGroup = groups.find((g) => g.name === selectedName) ?? null;
  const activePartners = useMemo(
    () => (activeGroup ? partnersFor(pairs, activeGroup.name) : []),
    [activeGroup, pairs]
  );
  const na = t("common:status.notAnalyzed");
  const strongCount = pairs.filter((p) => p.strength === "strong").length;
  const topStrength = groups[0]?.maxStrength ?? "weak";

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={
          <Badge tone={ctx.hasWorkspace ? "brand" : "neutral"}>
            {ctx.hasWorkspace ? t("badge") : na}
          </Badge>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("stats.collaborators")}
          value={statValue(ctx.hasWorkspace, isLoading, String(groups.length), na)}
          detail={t("stats.collaboratorsDetail")}
          tone={ctx.hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.strongPairs")}
          value={statValue(ctx.hasWorkspace, isLoading, String(strongCount), na)}
          detail={t("stats.strongPairsDetail")}
          tone={ctx.hasWorkspace && strongCount > 0 ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.analyzedFiles")}
          value={statValue(ctx.hasWorkspace, isLoading, String(data?.analyzedFileCount ?? 0), na)}
          detail={t(`settings:defaults.analysisWindows.${ctx.analysisPeriod}`)}
          tone={ctx.hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.topStrength")}
          value={statValue(
            ctx.hasWorkspace,
            isLoading,
            hasData ? t(`signals.${topStrength}`) : "-",
            na
          )}
          detail={
            hasData ? `${strongCount} ${t("signals.strong").toLowerCase()}` : t("empty.noPairs")
          }
          tone={ctx.hasWorkspace && hasData ? strengthTone(topStrength) : "neutral"}
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
                key: "name",
                header: t("common:table.contributor"),
                className: "max-w-0",
                render: (row) => (
                  <span className="block truncate" title={row.name}>
                    {row.name}
                  </span>
                ),
              },
              {
                key: "partners",
                header: t("ranking.sharedFiles"),
                align: "right",
                className: "whitespace-nowrap",
                render: (row) => row.partners,
              },
              {
                key: "maxSharedFiles",
                header: t("ranking.strength"),
                align: "right",
                className: "whitespace-nowrap",
                render: (row) => row.maxSharedFiles,
              },
              {
                key: "strength",
                header: "",
                align: "right",
                className: "whitespace-nowrap",
                render: (row) => {
                  const isSelected = selectedName === row.name;

                  return (
                    <button
                      type="button"
                      className="inline-block cursor-pointer"
                      onClick={() => setSelectedName(isSelected ? "" : row.name)}
                    >
                      <Badge tone={isSelected ? "brand" : strengthTone(row.maxStrength)}>
                        {t(`signals.${row.maxStrength}`)}
                      </Badge>
                    </button>
                  );
                },
              },
            ]}
            rows={groups}
            getRowKey={(row) => row.name}
            emptyText={t("empty.noPairs")}
          />
        )}
      </DetailPanel>

      {activeGroup ? (
        <DetailPanel
          title={t("details.title")}
          description={t("details.description", {
            authorA: activeGroup.name,
            authorB: `${activeGroup.partners} partners`,
          })}
        >
          <InfoGrid
            className="mb-4"
            columns="md:grid-cols-3"
            items={[
              { label: t("ranking.sharedFiles"), value: String(activeGroup.partners) },
              { label: t("details.sharedFileCount"), value: String(activeGroup.maxSharedFiles) },
              {
                label: t("details.strength"),
                value: (
                  <Badge tone={strengthTone(activeGroup.maxStrength)} className="mt-1">
                    {t(`signals.${activeGroup.maxStrength}`)}
                  </Badge>
                ),
              },
            ]}
          />

          <Table
            columns={[
              {
                key: "partner",
                header: t("common:table.contributor"),
                className: "max-w-0",
                render: (row) => (
                  <span className="block truncate" title={row.partner}>
                    {row.partner}
                  </span>
                ),
              },
              {
                key: "sharedFileCount",
                header: t("ranking.sharedFiles"),
                align: "right",
                className: "whitespace-nowrap",
                render: (row) => row.sharedFileCount,
              },
              {
                key: "strength",
                header: t("ranking.strength"),
                align: "right",
                className: "whitespace-nowrap",
                render: (row) => (
                  <Badge tone={strengthTone(row.strength)}>{t(`signals.${row.strength}`)}</Badge>
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
