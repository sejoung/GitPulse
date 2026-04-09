import { useTranslation } from "react-i18next";
import { Badge, DetailPanel, Input, PageHeader, Table, Tabs } from "../../components/ui";
import { languageStorageKey } from "../../i18n/config";

type Language = "ko" | "en";

const languageItems = [
  { id: "ko", labelKey: "language.ko" },
  { id: "en", labelKey: "language.en" },
] as const;

function toSupportedLanguage(language: string): Language {
  return language.startsWith("en") ? "en" : "ko";
}

export function SettingsPage() {
  const { t, i18n } = useTranslation(["settings", "common"]);
  const currentLanguage = toSupportedLanguage(i18n.resolvedLanguage ?? i18n.language);
  const translatedLanguageItems = languageItems.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
  }));
  const settingsRows = [
    { key: t("defaults.analysisWindow"), value: "1 year" },
    { key: t("defaults.bugKeywords"), value: "fix, bug, broken" },
    { key: t("defaults.emergencyKeywords"), value: "revert, hotfix, emergency, rollback" },
    { key: t("defaults.cacheKey"), value: "workspace + branch + period + HEAD_SHA" },
  ];

  function handleLanguageChange(language: Language) {
    window.localStorage.setItem(languageStorageKey, language);
    void i18n.changeLanguage(language);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={<Badge tone="neutral">{t("badge")}</Badge>}
      />

      <DetailPanel title={t("filters.title")} description={t("filters.description")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input placeholder="dist/, node_modules/, target/" aria-label={t("filters.excludedPaths")} />
          <Input placeholder="main" aria-label={t("filters.defaultBranch")} />
        </div>
      </DetailPanel>

      <DetailPanel
        title={t("language.title")}
        description={t("language.description")}
        actions={<Badge tone="brand">{t(`language.${currentLanguage}`)}</Badge>}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="gp-text-secondary text-sm">{t("language.current")}</p>
          <Tabs items={translatedLanguageItems} value={currentLanguage} onChange={handleLanguageChange} />
        </div>
      </DetailPanel>

      <DetailPanel title={t("defaults.title")} description={t("defaults.description")}>
        <Table
          columns={[
            { key: "key", header: t("common:table.setting"), render: (row) => row.key },
            { key: "value", header: t("common:table.value"), render: (row) => row.value },
          ]}
          rows={settingsRows}
          getRowKey={(row) => row.key}
        />
      </DetailPanel>
    </div>
  );
}
