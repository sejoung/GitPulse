import { useTranslation } from "react-i18next";
import { useUiStore } from "../../app/store/ui-store";
import { Badge, DetailPanel, Input, PageHeader, Table, Tabs } from "../../components/ui";
import { languageStorageKey } from "../../i18n/config";

type Language = "ko" | "en";

const analysisWindowItems = [
  { id: "1y", labelKey: "defaults.analysisWindows.1y" },
  { id: "6m", labelKey: "defaults.analysisWindows.6m" },
  { id: "3m", labelKey: "defaults.analysisWindows.3m" },
] as const;

const languageItems = [
  { id: "ko", labelKey: "language.ko" },
  { id: "en", labelKey: "language.en" },
] as const;

function toSupportedLanguage(language: string): Language {
  return language.startsWith("en") ? "en" : "ko";
}

export function SettingsPage() {
  const { t, i18n } = useTranslation(["settings", "common"]);
  const excludedPaths = useUiStore((state) => state.excludedPaths);
  const defaultBranch = useUiStore((state) => state.defaultBranch);
  const analysisPeriod = useUiStore((state) => state.analysisPeriod);
  const bugKeywords = useUiStore((state) => state.bugKeywords);
  const emergencyKeywords = useUiStore((state) => state.emergencyKeywords);
  const setExcludedPaths = useUiStore((state) => state.setExcludedPaths);
  const setDefaultBranch = useUiStore((state) => state.setDefaultBranch);
  const setAnalysisPeriod = useUiStore((state) => state.setAnalysisPeriod);
  const setBugKeywords = useUiStore((state) => state.setBugKeywords);
  const setEmergencyKeywords = useUiStore((state) => state.setEmergencyKeywords);
  const currentLanguage = toSupportedLanguage(i18n.resolvedLanguage ?? i18n.language);
  const translatedAnalysisWindowItems = analysisWindowItems.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
  }));
  const translatedLanguageItems = languageItems.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
  }));
  const settingsRows = [
    {
      key: t("defaults.analysisWindow"),
      value: <Tabs items={translatedAnalysisWindowItems} value={analysisPeriod} onChange={setAnalysisPeriod} />,
    },
    {
      key: t("defaults.bugKeywords"),
      value: (
        <Input
          value={bugKeywords}
          onChange={(event) => setBugKeywords(event.target.value)}
          placeholder="fix, bug, broken"
          aria-label={t("defaults.bugKeywords")}
        />
      ),
    },
    {
      key: t("defaults.emergencyKeywords"),
      value: (
        <Input
          value={emergencyKeywords}
          onChange={(event) => setEmergencyKeywords(event.target.value)}
          placeholder="revert, hotfix, emergency, rollback"
          aria-label={t("defaults.emergencyKeywords")}
        />
      ),
    },
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
        <div className="grid gap-4 lg:grid-cols-2">
          <Input
            value={excludedPaths}
            onChange={(event) => setExcludedPaths(event.target.value)}
            placeholder="dist/, node_modules/, target/"
            aria-label={t("filters.excludedPaths")}
          />
          <Input
            value={defaultBranch}
            onChange={(event) => setDefaultBranch(event.target.value)}
            placeholder="main"
            aria-label={t("filters.defaultBranch")}
          />
        </div>
      </DetailPanel>

      <DetailPanel
        title={t("language.title")}
        description={t("language.description")}
        actions={<Badge tone="brand">{t(`language.${currentLanguage}`)}</Badge>}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
