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
import { useOwnershipAnalysis } from "./useOwnershipAnalysis";

export function OwnershipPage() {
  const { t } = useTranslation(["ownership", "common"]);
  const workspacePath = useUiStore((state) => state.workspacePath);
  const selectedBranch = useUiStore((state) => state.selectedBranch);
  const setActiveItem = useUiStore((state) => state.setActiveItem);
  const { data: contributorRows = [], isLoading } = useOwnershipAnalysis(
    workspacePath,
    selectedBranch
  );
  const [selectedContributorName, setSelectedContributorName] = useState("");
  const hasWorkspace = Boolean(workspacePath);
  const hasData = contributorRows.length > 0;
  const selectedContributor =
    contributorRows.find((row) => row.name === selectedContributorName) ?? null;
  const topContributor = contributorRows[0]?.share ?? "0%";
  const activeContributorCount = contributorRows.filter(
    (row) => row.recentKey === "status.active"
  ).length;
  const knowledgeRisk = contributorRows.some((row) => row.risk === "watch") ? "watch" : "healthy";

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={
          <Badge tone={hasWorkspace ? "watch" : "neutral"}>
            {hasWorkspace ? t("badge") : t("common:status.notAnalyzed")}
          </Badge>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={t("stats.topContributor")}
          value={
            !hasWorkspace
              ? t("common:status.notAnalyzed")
              : isLoading
                ? "..."
                : hasData
                  ? topContributor
                  : t("common:empty.ownership")
          }
          detail={t("stats.aboveWatchThreshold")}
          tone={hasWorkspace && hasData ? knowledgeRisk : "neutral"}
        />
        <StatCard
          label={t("stats.activeContributors")}
          value={
            !hasWorkspace
              ? t("common:status.notAnalyzed")
              : isLoading
                ? "..."
                : String(activeContributorCount)
          }
          detail={t("stats.recentActivity")}
          tone={hasWorkspace ? "brand" : "neutral"}
        />
        <StatCard
          label={t("stats.knowledgeRisk")}
          value={
            !hasWorkspace
              ? t("common:status.notAnalyzed")
              : isLoading
                ? "..."
                : hasData
                  ? t(`common:status.${knowledgeRisk}`)
                  : t("common:empty.ownership")
          }
          detail={t("stats.ownershipConcentration")}
          tone={hasWorkspace && hasData ? knowledgeRisk : "neutral"}
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
            <p className="gp-kicker">{t("basis.contributors")}</p>
            <p className="gp-text-secondary mt-1 text-sm">{contributorRows.length}</p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("basis.active")}</p>
            <p className="gp-text-secondary mt-1 text-sm">{activeContributorCount}</p>
          </div>
        </div>
      </DetailPanel>

      <DetailPanel title={t("table.title")} description={t("table.description")}>
        <Table
          columns={[
            {
              key: "name",
              header: t("common:table.contributor"),
              className: "w-[25%]",
              render: (row) => (
                <span className="block truncate" title={row.name}>
                  {row.name}
                </span>
              ),
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
                <Badge tone={row.risk === "watch" ? "watch" : "healthy"}>
                  {t(`common:status.${row.risk}`)}
                </Badge>
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
          emptyText={hasWorkspace ? t("common:empty.ownership") : t("common:empty.selectWorkspace")}
        />
      </DetailPanel>

      {selectedContributor ? (
        <DetailPanel
          title={t("details.title")}
          description={t("details.description", { contributor: selectedContributor.name })}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("common:table.contributor")}</p>
              <p className="gp-text-secondary mt-1 break-words text-sm">
                {selectedContributor.name}
              </p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("common:table.commits")}</p>
              <p className="gp-text-secondary mt-1 text-sm">{selectedContributor.commits}</p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("common:table.share")}</p>
              <p className="gp-text-secondary mt-1 text-sm">{selectedContributor.share}</p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("common:table.signal")}</p>
              <Badge
                tone={selectedContributor.risk === "watch" ? "watch" : "healthy"}
                className="mt-2"
              >
                {t(`common:status.${selectedContributor.risk}`)}
              </Badge>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("details.recent")}</p>
              <p className="gp-text-secondary mt-1 text-sm">
                {t(`common:${selectedContributor.recentKey}`)}
              </p>
            </div>
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("details.reading")}</p>
              <p className="gp-text-secondary mt-1 text-sm">
                {selectedContributor.risk === "watch"
                  ? t("details.watchReading")
                  : t("details.healthyReading")}
              </p>
            </div>
          </div>
        </DetailPanel>
      ) : hasWorkspace && hasData ? (
        <DetailPanel title={t("details.title")} description={t("details.emptyDescription")}>
          <EmptyState title={t("details.emptyTitle")} description={t("details.emptyBody")} />
        </DetailPanel>
      ) : null}

      <ChartCard title={t("chart.title")} description={t("chart.description")}>
        {contributorRows.length === 0 ? (
          <EmptyState
            title={hasWorkspace ? t("common:empty.ownership") : t("common:empty.selectWorkspace")}
            description={
              hasWorkspace ? t("common:empty.chart") : t("common:empty.selectWorkspaceDetail")
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
