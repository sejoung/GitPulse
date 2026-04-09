import { useTranslation } from "react-i18next";
import { Badge, DetailPanel, PageHeader, StatCard, Table } from "../../components/ui";
import { deliveryRows } from "../gitpulse-sample-data";

export function DeliveryRiskPage() {
  const { t } = useTranslation(["deliveryRisk", "common"]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={<Badge tone="healthy">{t("badge")}</Badge>}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label={t("stats.hotfix")} value="2" detail={t("common:time.lastYear")} tone="watch" />
        <StatCard label={t("stats.revert")} value="1" detail={t("common:time.lastYear")} tone="healthy" />
        <StatCard label={t("stats.rollback")} value="0" detail={t("common:time.lastYear")} tone="healthy" />
        <StatCard label={t("stats.signal")} value={t("common:status.low")} detail={t("stats.deliveryRisk")} tone="healthy" />
      </section>

      <DetailPanel
        title={t("patterns.title")}
        description={t("patterns.description")}
      >
        <Table
          columns={[
            { key: "event", header: t("common:table.pattern"), render: (row) => row.event },
            { key: "count", header: t("common:table.count"), align: "right", render: (row) => row.count },
            { key: "signal", header: t("common:table.signal"), render: (row) => t(`common:${row.signalKey}`) },
            {
              key: "risk",
              header: t("common:table.risk"),
              align: "right",
              render: (row) => (
                <Badge tone={row.risk === "watch" ? "watch" : "healthy"}>
                  {t(`common:status.${row.risk}`)}
                </Badge>
              ),
            },
          ]}
          rows={deliveryRows}
          getRowKey={(row) => row.event}
        />
      </DetailPanel>
    </div>
  );
}
