import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type {
  AnalysisPeriod,
  EmergencyPattern,
  RepositoryOverrideSettings,
} from "../../app/store/ui-store";
import { useUiStore } from "../../app/store/ui-store";
import { Badge, Button, DetailPanel, Input, PageHeader, Table, Tabs } from "../../components/ui";
import { languageStorageKey } from "../../i18n/config";

type Language = "ko" | "en";
type SettingsExport = {
  version: 1;
  language: Language;
  settings: {
    analysisPeriod: AnalysisPeriod;
    excludedPaths: string;
    defaultBranch: string;
    bugKeywords: string;
    emergencyPatterns: EmergencyPattern[];
    rememberLastRepository: boolean;
    repositoryOverrides: Record<string, RepositoryOverrideSettings>;
  };
};

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

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isAnalysisPeriod(value: unknown): value is AnalysisPeriod {
  return value === "1y" || value === "6m" || value === "3m";
}

export function SettingsPage() {
  const { t, i18n } = useTranslation(["settings", "common"]);
  const queryClient = useQueryClient();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [cacheMessage, setCacheMessage] = useState("");
  const workspacePath = useUiStore((state) => state.workspacePath);
  const excludedPaths = useUiStore((state) => state.excludedPaths);
  const defaultBranch = useUiStore((state) => state.defaultBranch);
  const analysisPeriod = useUiStore((state) => state.analysisPeriod);
  const bugKeywords = useUiStore((state) => state.bugKeywords);
  const emergencyPatterns = useUiStore((state) => state.emergencyPatterns);
  const rememberLastRepository = useUiStore((state) => state.rememberLastRepository);
  const repositoryOverrides = useUiStore((state) => state.repositoryOverrides);
  const setWorkspacePath = useUiStore((state) => state.setWorkspacePath);
  const setSelectedBranch = useUiStore((state) => state.setSelectedBranch);
  const setExcludedPaths = useUiStore((state) => state.setExcludedPaths);
  const setDefaultBranch = useUiStore((state) => state.setDefaultBranch);
  const setAnalysisPeriod = useUiStore((state) => state.setAnalysisPeriod);
  const setBugKeywords = useUiStore((state) => state.setBugKeywords);
  const setEmergencyPatterns = useUiStore((state) => state.setEmergencyPatterns);
  const setEmergencyPattern = useUiStore((state) => state.setEmergencyPattern);
  const setRememberLastRepository = useUiStore((state) => state.setRememberLastRepository);
  const setRepositoryOverride = useUiStore((state) => state.setRepositoryOverride);
  const setRepositoryOverridePattern = useUiStore((state) => state.setRepositoryOverridePattern);
  const clearRepositoryOverride = useUiStore((state) => state.clearRepositoryOverride);
  const currentLanguage = toSupportedLanguage(i18n.resolvedLanguage ?? i18n.language);
  const translatedAnalysisWindowItems = analysisWindowItems.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
  }));
  const translatedLanguageItems = languageItems.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
  }));
  const excludedPathPreview = parseList(excludedPaths);
  const currentRepositoryOverride = workspacePath ? repositoryOverrides[workspacePath] : undefined;
  const effectiveRepositorySettings = {
    excludedPaths: currentRepositoryOverride?.excludedPaths ?? excludedPaths,
    bugKeywords: currentRepositoryOverride?.bugKeywords ?? bugKeywords,
    emergencyPatterns: currentRepositoryOverride?.emergencyPatterns ?? emergencyPatterns,
  };
  const repositoryOverridePreview = parseList(effectiveRepositorySettings.excludedPaths);
  const settingsRows = [
    {
      key: t("defaults.analysisWindow"),
      value: (
        <Tabs
          items={translatedAnalysisWindowItems}
          value={analysisPeriod}
          onChange={setAnalysisPeriod}
        />
      ),
    },
    {
      key: t("defaults.bugKeywords"),
      value: (
        <div className="space-y-2">
          <Input
            value={bugKeywords}
            onChange={(event) => setBugKeywords(event.target.value)}
            placeholder="fix, bug, broken"
            aria-label={t("defaults.bugKeywords")}
          />
          <p className="gp-text-muted text-xs">{t("defaults.bugKeywordsHelp")}</p>
        </div>
      ),
    },
    {
      key: t("defaults.emergencyPatterns"),
      value: (
        <div className="space-y-3">
          {emergencyPatterns.map((item, index) => (
            <div
              key={index}
              className="grid gap-2 lg:grid-cols-[minmax(140px,0.7fr)_minmax(220px,1.3fr)]"
            >
              <Input
                value={item.pattern}
                onChange={(event) =>
                  setEmergencyPattern(index, { ...item, pattern: event.target.value })
                }
                placeholder="revert, revert:, reverted"
                aria-label={t("defaults.emergencyPattern")}
              />
              <Input
                value={item.signal}
                onChange={(event) =>
                  setEmergencyPattern(index, { ...item, signal: event.target.value })
                }
                placeholder="Watch release pressure"
                aria-label={t("defaults.emergencySignal")}
              />
            </div>
          ))}
          <p className="gp-text-muted text-xs">{t("defaults.emergencyPatternsHelp")}</p>
        </div>
      ),
    },
    { key: t("defaults.cacheKey"), value: "workspace + branch + period + HEAD_SHA" },
  ];

  function handleLanguageChange(language: Language) {
    window.localStorage.setItem(languageStorageKey, language);
    void i18n.changeLanguage(language);
  }

  function clearAnalysisCache() {
    queryClient.clear();
    setCacheMessage(t("cache.cleared"));
  }

  function exportSettings() {
    const payload: SettingsExport = {
      version: 1,
      language: currentLanguage,
      settings: {
        analysisPeriod,
        excludedPaths,
        defaultBranch,
        bugKeywords,
        emergencyPatterns,
        rememberLastRepository,
        repositoryOverrides,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "gitpulse-settings.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setSettingsMessage(t("portable.exported"));
  }

  async function importSettings(file: File) {
    try {
      const payload = JSON.parse(await file.text()) as Partial<SettingsExport>;
      const importedSettings = payload.settings;

      if (!importedSettings) {
        throw new Error("settings missing");
      }

      if (isAnalysisPeriod(importedSettings.analysisPeriod)) {
        setAnalysisPeriod(importedSettings.analysisPeriod);
      }

      setExcludedPaths(importedSettings.excludedPaths ?? excludedPaths);
      setDefaultBranch(importedSettings.defaultBranch ?? defaultBranch);
      setBugKeywords(importedSettings.bugKeywords ?? bugKeywords);
      setRememberLastRepository(importedSettings.rememberLastRepository ?? rememberLastRepository);
      if (importedSettings.repositoryOverrides) {
        Object.entries(importedSettings.repositoryOverrides).forEach(([path, settings]) => {
          setRepositoryOverride(path, settings);
        });
      }

      if (Array.isArray(importedSettings.emergencyPatterns)) {
        setEmergencyPatterns(
          importedSettings.emergencyPatterns
            .filter((item) => item.pattern?.trim() && item.signal?.trim())
            .map((item) => ({ pattern: item.pattern, signal: item.signal }))
        );
      }

      if (payload.language) {
        handleLanguageChange(toSupportedLanguage(payload.language));
      }

      setSettingsMessage(t("portable.imported"));
    } catch {
      setSettingsMessage(t("portable.importFailed"));
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  }

  function handleRememberLastRepository(remember: boolean) {
    setRememberLastRepository(remember);

    if (!remember) {
      setWorkspacePath("");
      setSelectedBranch("");
      queryClient.clear();
    }
  }

  function enableRepositoryOverride() {
    if (!workspacePath) {
      return;
    }

    setRepositoryOverride(workspacePath, {
      excludedPaths,
      bugKeywords,
      emergencyPatterns,
    });
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
          <div className="space-y-2">
            <label className="gp-text-secondary text-sm font-medium" htmlFor="excluded-paths">
              {t("filters.excludedPaths")}
            </label>
            <Input
              id="excluded-paths"
              value={excludedPaths}
              onChange={(event) => setExcludedPaths(event.target.value)}
              placeholder="dist/, node_modules/, target/"
              aria-label={t("filters.excludedPaths")}
            />
            <p className="gp-text-muted text-xs">{t("filters.excludedPathsHelp")}</p>
          </div>
          <div className="space-y-2">
            <label className="gp-text-secondary text-sm font-medium" htmlFor="default-branch">
              {t("filters.defaultBranch")}
            </label>
            <Input
              id="default-branch"
              value={defaultBranch}
              onChange={(event) => setDefaultBranch(event.target.value)}
              placeholder="main"
              aria-label={t("filters.defaultBranch")}
            />
            <p className="gp-text-muted text-xs">{t("filters.defaultBranchHelp")}</p>
          </div>
        </div>
        <div className="mt-4 gp-panel p-3">
          <p className="gp-kicker">{t("filters.preview")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {excludedPathPreview.length > 0 ? (
              excludedPathPreview.map((path) => (
                <Badge key={path} tone="neutral">
                  {path}
                </Badge>
              ))
            ) : (
              <p className="gp-text-muted text-sm">{t("filters.previewEmpty")}</p>
            )}
          </div>
        </div>
      </DetailPanel>

      <DetailPanel
        title={t("repositoryOverrides.title")}
        description={t("repositoryOverrides.description")}
        actions={
          currentRepositoryOverride ? (
            <Button variant="secondary" onClick={() => clearRepositoryOverride(workspacePath)}>
              {t("repositoryOverrides.clear")}
            </Button>
          ) : (
            <Button
              variant="secondary"
              disabled={!workspacePath}
              onClick={enableRepositoryOverride}
            >
              {t("repositoryOverrides.enable")}
            </Button>
          )
        }
      >
        {workspacePath ? (
          <div className="space-y-4">
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("repositoryOverrides.currentRepository")}</p>
              <p className="gp-text-secondary mt-1 break-words text-sm">{workspacePath}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={currentRepositoryOverride ? "brand" : "neutral"}>
                  {currentRepositoryOverride
                    ? t("repositoryOverrides.overrideActive")
                    : t("repositoryOverrides.inheritingDefaults")}
                </Badge>
              </div>
            </div>

            {currentRepositoryOverride ? (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      className="gp-text-secondary text-sm font-medium"
                      htmlFor="repository-override-excluded-paths"
                    >
                      {t("filters.excludedPaths")}
                    </label>
                    <Input
                      id="repository-override-excluded-paths"
                      value={currentRepositoryOverride.excludedPaths}
                      onChange={(event) =>
                        setRepositoryOverride(workspacePath, {
                          ...currentRepositoryOverride,
                          excludedPaths: event.target.value,
                        })
                      }
                      placeholder="dist/, node_modules/, target/"
                      aria-label={t("repositoryOverrides.excludedPaths")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="gp-text-secondary text-sm font-medium"
                      htmlFor="repository-override-bug-keywords"
                    >
                      {t("defaults.bugKeywords")}
                    </label>
                    <Input
                      id="repository-override-bug-keywords"
                      value={currentRepositoryOverride.bugKeywords}
                      onChange={(event) =>
                        setRepositoryOverride(workspacePath, {
                          ...currentRepositoryOverride,
                          bugKeywords: event.target.value,
                        })
                      }
                      placeholder="fix, bug, broken"
                      aria-label={t("repositoryOverrides.bugKeywords")}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {currentRepositoryOverride.emergencyPatterns.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-2 lg:grid-cols-[minmax(140px,0.7fr)_minmax(220px,1.3fr)]"
                    >
                      <Input
                        value={item.pattern}
                        onChange={(event) =>
                          setRepositoryOverridePattern(workspacePath, index, {
                            ...item,
                            pattern: event.target.value,
                          })
                        }
                        placeholder="revert, revert:, reverted"
                        aria-label={t("repositoryOverrides.emergencyPattern")}
                      />
                      <Input
                        value={item.signal}
                        onChange={(event) =>
                          setRepositoryOverridePattern(workspacePath, index, {
                            ...item,
                            signal: event.target.value,
                          })
                        }
                        placeholder="Watch release pressure"
                        aria-label={t("repositoryOverrides.emergencySignal")}
                      />
                    </div>
                  ))}
                  <p className="gp-text-muted text-xs">{t("repositoryOverrides.help")}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="gp-text-secondary text-sm">
                  {t("repositoryOverrides.inheritDescription")}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="gp-panel min-w-0 p-3">
                    <p className="gp-kicker">{t("filters.preview")}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {repositoryOverridePreview.length > 0 ? (
                        repositoryOverridePreview.map((path) => (
                          <Badge key={path} tone="neutral">
                            {path}
                          </Badge>
                        ))
                      ) : (
                        <p className="gp-text-muted text-sm">{t("filters.previewEmpty")}</p>
                      )}
                    </div>
                  </div>
                  <div className="gp-panel min-w-0 p-3">
                    <p className="gp-kicker">{t("defaults.bugKeywords")}</p>
                    <p className="gp-text-secondary mt-1 break-words text-sm">
                      {effectiveRepositorySettings.bugKeywords}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="gp-text-secondary text-sm">{t("repositoryOverrides.empty")}</p>
        )}
      </DetailPanel>

      <DetailPanel
        title={t("repositoryMemory.title")}
        description={t("repositoryMemory.description")}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="gp-text-secondary text-sm">{t("repositoryMemory.current")}</p>
          <Tabs
            items={[
              { id: "on", label: t("repositoryMemory.on") },
              { id: "off", label: t("repositoryMemory.off") },
            ]}
            value={rememberLastRepository ? "on" : "off"}
            onChange={(value) => handleRememberLastRepository(value === "on")}
          />
        </div>
      </DetailPanel>

      <DetailPanel
        title={t("portable.title")}
        description={t("portable.description")}
        actions={
          <div className="gp-header-actions">
            <Button variant="secondary" onClick={() => importInputRef.current?.click()}>
              {t("portable.import")}
            </Button>
            <Button variant="secondary" onClick={exportSettings}>
              {t("portable.export")}
            </Button>
          </div>
        }
      >
        <input
          ref={importInputRef}
          className="hidden"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void importSettings(file);
            }
          }}
        />
        <p className="gp-text-secondary text-sm">
          {settingsMessage || t("portable.messagePlaceholder")}
        </p>
      </DetailPanel>

      <DetailPanel
        title={t("language.title")}
        description={t("language.description")}
        actions={<Badge tone="brand">{t(`language.${currentLanguage}`)}</Badge>}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="gp-text-secondary text-sm">{t("language.current")}</p>
          <Tabs
            items={translatedLanguageItems}
            value={currentLanguage}
            onChange={handleLanguageChange}
          />
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

      <DetailPanel
        title={t("cache.title")}
        description={t("cache.description")}
        actions={
          <Button variant="danger" onClick={clearAnalysisCache}>
            {t("cache.clear")}
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("cache.key")}</p>
            <p className="gp-text-secondary mt-1 break-words text-sm">
              workspace + branch + period + HEAD_SHA
            </p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("cache.status")}</p>
            <p className="gp-text-secondary mt-1 text-sm">
              {cacheMessage || t("cache.localQueryCache")}
            </p>
          </div>
        </div>
      </DetailPanel>
    </div>
  );
}
