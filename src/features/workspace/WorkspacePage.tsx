import { useTranslation } from "react-i18next";
import { Badge, Button, DetailPanel, Input, PageHeader, Table } from "../../components/ui";
import { commandRows } from "../gitpulse-sample-data";

export function WorkspacePage() {
  const { t } = useTranslation(["workspace", "common"]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={<Button>{t("common:actions.selectWorkspace")}</Button>}
      />

      <DetailPanel
        title={t("current.title")}
        description={t("current.description")}
        actions={<Badge tone="watch">{t("common:status.notSelected")}</Badge>}
      >
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <Input readOnly value={t("current.value")} aria-label={t("current.title")} />
          <Button variant="secondary">{t("common:actions.browse")}</Button>
        </div>
      </DetailPanel>

      <DetailPanel title={t("questions.title")} description={t("questions.description")}>
        <Table
          columns={[
            { key: "question", header: t("common:table.question"), render: (row) => t(row.questionKey) },
            {
              key: "command",
              header: t("common:table.signalSource"),
              render: (row) => <code className="text-gp-brand-cyan">{row.command}</code>,
            },
          ]}
          rows={commandRows}
          getRowKey={(row) => row.questionKey}
        />
      </DetailPanel>
    </div>
  );
}
