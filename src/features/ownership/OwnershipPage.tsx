import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChartCard } from "../../components/charts";
import {
  AnalysisBasisPanel,
  Badge,
  Button,
  DetailPanel,
  EmptyState,
  InfoGrid,
  PageHeader,
  StatCard,
  Table,
  TruncatedCell,
} from "../../components/ui";
import { useAnalysisPageContext } from "../../hooks/useAnalysisPageContext";
import { riskTone, statValue } from "../../lib/analysis-helpers";
import { useOwnershipAnalysis } from "./useOwnershipAnalysis";

export function OwnershipPage() {
  const { t } = useTranslation(["ownership", "common"]);
  const ctx = useAnalysisPageContext();
  const { data: contributorRows = [], isLoading } = useOwnershipAnalysis(
    ctx.workspacePath,
    ctx.selectedBranch,
    ctx.headSha,
    ctx.riskThresholds
  );
  const [selectedContributorName, setSelectedContributorName] = useState("");
  const hasData = contributorRows.length > 0;
  const selectedContributor =
    contributorRows.find((row) => row.name === selectedContributorName) ?? null;
  const topContributor = contributorRows[0]?.share ?? "0%";
  const activeContributorCount = contributorRows.filter(
    (row) => row.recentKey === "status.active"
  ).length;
  const knowledgeRisk = contributorRows.some((row) => row.risk === "watch") ? "watch" : "healthy";
  const na = t("common:status.notAnalyzed");

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={
          <Badge tone={ctx.hasWorkspace ? "watch" : "neutral"}>
            {ctx.hasWorkspace ? t("badge") : na}
          </Badge>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={t("stats.topContributor")}
          value={statValue(
            ctx.hasWorkspace,
            isLoading,
            hasData ? topContributor : t("common:empty.ownership"),
            na
          )}
          detail={t("stats.aboveWatchThreshold")}
          tone={ctx.hasWorkspace && hasData ? knowledgeRisk : "neutral"}
        />
        <StatCard
          label={t("stats.activeContributors")}
          value={statValue(ctx.hasWorkspace, isLoading, String(activeContributorCount), na)}
          detail={t("stats.recentActivity")}
          tone={ctx.hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.knowledgeRisk")}
          value={statValue(
            ctx.hasWorkspace,
            isLoading,
            hasData ? t(`common:status.${knowledgeRisk}`) : t("common:empty.ownership"),
            na
          )}
          detail={t("stats.ownershipConcentration")}
          tone={ctx.hasWorkspace && hasData ? knowledgeRisk : "neutral"}
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
          { label: t("basis.contributors"), value: String(contributorRows.length) },
          { label: t("basis.active"), value: String(activeContributorCount) },
        ]}
      />

      <DetailPanel
        title={t("table.title")}
        description={t("table.description")}
        loading={isLoading}
      >
        <Table
          columns={[
            {
              key: "name",
              header: t("common:table.contributor"),
              className: "w-[25%]",
              render: (row) => <TruncatedCell value={row.name} />,
            },
            {
              key: "commits",
              header: t("common:table.commits"),
              align: "right",
              render: (row) => row.commits,
            },
            {
              key: "share",
              header: t("common:table.share"),
              align: "right",
              render: (row) => row.share,
            },
            {
              key: "recent",
              header: t("common:table.recent"),
              align: "right",
              render: (row) => t(`common:${row.recentKey}`),
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
              header: t("table.details"),
              align: "right",
              render: (row) => (
                <Button
                  variant={selectedContributor?.name === row.name ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setSelectedContributorName(row.name)}
                >
                  {selectedContributor?.name === row.name
                    ? t("table.selected")
                    : t("table.inspect")}
                </Button>
              ),
            },
          ]}
          rows={contributorRows}
          getRowKey={(row) => row.name}
          emptyText={
            ctx.hasWorkspace ? t("common:empty.ownership") : t("common:empty.selectWorkspace")
          }
        />
      </DetailPanel>

      {selectedContributor ? (
        <DetailPanel
          title={t("details.title")}
          description={t("details.description", { contributor: selectedContributor.name })}
        >
          <InfoGrid
            items={[
              {
                label: t("common:table.contributor"),
                value: selectedContributor.name,
                breakWords: true,
              },
              { label: t("common:table.commits"), value: String(selectedContributor.commits) },
              { label: t("common:table.share"), value: selectedContributor.share },
              {
                label: t("common:table.signal"),
                value: (
                  <Badge tone={riskTone(selectedContributor.risk)} className="mt-2">
                    {t(`common:status.${selectedContributor.risk}`)}
                  </Badge>
                ),
              },
            ]}
          />
          <InfoGrid
            className="mt-3"
            columns="md:grid-cols-2"
            items={[
              {
                label: t("details.recent"),
                value: t(`common:${selectedContributor.recentKey}`),
              },
              {
                label: t("details.reading"),
                value:
                  selectedContributor.risk === "watch"
                    ? t("details.watchReading")
                    : t("details.healthyReading"),
              },
            ]}
          />
        </DetailPanel>
      ) : ctx.hasWorkspace && hasData ? (
        <DetailPanel title={t("details.title")} description={t("details.emptyDescription")}>
          <EmptyState title={t("details.emptyTitle")} description={t("details.emptyBody")} />
        </DetailPanel>
      ) : null}

      <ChartCard title={t("chart.title")} description={t("chart.description")}>
        {contributorRows.length === 0 ? (
          <EmptyState
            title={
              ctx.hasWorkspace ? t("common:empty.ownership") : t("common:empty.selectWorkspace")
            }
            description={
              ctx.hasWorkspace ? t("common:empty.chart") : t("common:empty.selectWorkspaceDetail")
            }
          />
        ) : (
          <div className="space-y-3">
            {contributorRows.map((row) => (
              <div key={row.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="gp-text-secondary">{row.name}</span>
                  <span className="gp-text-muted">{row.share}</span>
                </div>
                <div className="h-2 rounded-md bg-gp-bg-tertiary">
                  <div className="h-2 rounded-md bg-gp-brand-blue" style={{ width: row.share }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
}
