import { useDeferredValue, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type {
  AppLanguage,
  AnalysisPeriod,
  EmergencyPattern,
  RepositoryOverrideSettings,
} from "../../app/store/ui-store";
import { useUiStore } from "../../app/store/ui-store";
import { Badge, Button, DetailPanel, Input, PageHeader, Table, Tabs } from "../../components/ui";
import { languageStorageKey } from "../../i18n/config";
import { openLocalDatabaseDirectory } from "../../services/tauri/local-database";
import { useLocalDatabaseSummary } from "./useLocalDatabaseSummary";
import { useSettingsMatchPreview } from "./useSettingsMatchPreview";

type SettingsExport = {
  version: 1;
  language: AppLanguage;
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
  { id: "en", labelKey: "language.en" },
  { id: "ko", labelKey: "language.ko" },
] as const;

function toSupportedLanguage(language: string): AppLanguage {
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
  const { data: databaseSummary } = useLocalDatabaseSummary();
  const workspacePath = useUiStore((state) => state.workspacePath);
  const language = useUiStore((state) => state.language);
  const excludedPaths = useUiStore((state) => state.excludedPaths);
  const defaultBranch = useUiStore((state) => state.defaultBranch);
  const analysisPeriod = useUiStore((state) => state.analysisPeriod);
  const bugKeywords = useUiStore((state) => state.bugKeywords);
  const emergencyPatterns = useUiStore((state) => state.emergencyPatterns);
  const rememberLastRepository = useUiStore((state) => state.rememberLastRepository);
  const repositoryOverrides = useUiStore((state) => state.repositoryOverrides);
  const setWorkspacePath = useUiStore((state) => state.setWorkspacePath);
  const setLanguage = useUiStore((state) => state.setLanguage);
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
  const currentLanguage = language;
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
  const deferredPreviewPeriod = useDeferredValue(analysisPeriod);
  const deferredPreviewExcludedPaths = useDeferredValue(effectiveRepositorySettings.excludedPaths);
  const deferredPreviewBugKeywords = useDeferredValue(effectiveRepositorySettings.bugKeywords);
  const deferredPreviewEmergencyPatterns = useDeferredValue(
    effectiveRepositorySettings.emergencyPatterns
  );
  const { data: matchPreview, isFetching: isMatchPreviewFetching } = useSettingsMatchPreview(
    workspacePath,
    deferredPreviewPeriod,
    deferredPreviewExcludedPaths,
    deferredPreviewBugKeywords,
    deferredPreviewEmergencyPatterns
  );
  const previewScopeKey = currentRepositoryOverride
    ? "preview.scope.repositoryOverride"
    : "preview.scope.globalDefaults";
  const persistedItems = [
    t("cache.persistedItems.language"),
    t("cache.persistedItems.workspace"),
    t("cache.persistedItems.branch"),
    t("cache.persistedItems.analysisDefaults"),
    t("cache.persistedItems.repositoryOverrides"),
    t("cache.persistedItems.analysisHistory"),
  ];
  const volatileItems = [
    t("cache.volatileItems.activePage"),
    t("cache.volatileItems.loadingState"),
    t("cache.volatileItems.toastMessage"),
  ];

  function handleLanguageChange(nextLanguage: AppLanguage) {
    setLanguage(nextLanguage);
    window.localStorage.setItem(languageStorageKey, nextLanguage);
    void i18n.changeLanguage(nextLanguage);
  }

  function clearAnalysisCache() {
    queryClient.clear();
    setCacheMessage(t("cache.cleared"));
    void queryClient.invalidateQueries({ queryKey: ["local-database-summary"] });
  }

  async function openDatabaseDirectory() {
    try {
      await openLocalDatabaseDirectory();
      setCacheMessage(t("cache.openedFolder"));
    } catch (error) {
      setCacheMessage(
        error instanceof Error && error.message
          ? `${t("cache.openFolderFailed")} ${error.message}`
          : t("cache.openFolderFailed")
      );
    }
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

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="gp-panel min-w-0 p-4">
          <p className="gp-kicker">{t("preview.currentRepository")}</p>
          <p className="gp-text-secondary mt-1 break-words text-sm">
            {workspacePath || t("repositoryOverrides.empty")}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="gp-panel min-w-0 p-4">
            <p className="gp-kicker">{t("language.current")}</p>
            <div className="mt-2">
              <Badge tone="brand">{t(`language.${currentLanguage}`)}</Badge>
            </div>
          </div>
          <div className="gp-panel min-w-0 p-4">
            <p className="gp-kicker">{t("repositoryMemory.current")}</p>
            <div className="mt-2">
              <Badge tone={rememberLastRepository ? "brand" : "neutral"}>
                {rememberLastRepository ? t("repositoryMemory.on") : t("repositoryMemory.off")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

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

      <DetailPanel title={t("defaults.title")} description={t("defaults.description")}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <div className="space-y-4">
            <div className="gp-panel min-w-0 p-4">
              <p className="gp-kicker">{t("defaults.analysisWindow")}</p>
              <div className="mt-3">
                <Tabs
                  items={translatedAnalysisWindowItems}
                  value={analysisPeriod}
                  onChange={setAnalysisPeriod}
                />
              </div>
            </div>
            <div className="gp-panel min-w-0 p-4">
              <p className="gp-kicker">{t("defaults.cacheKey")}</p>
              <p className="gp-text-secondary mt-2 break-words text-sm">
                workspace + branch + period + HEAD_SHA
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="gp-panel min-w-0 p-4">
              <label className="gp-text-secondary text-sm font-medium" htmlFor="bug-keywords">
                {t("defaults.bugKeywords")}
              </label>
              <Input
                id="bug-keywords"
                className="mt-3"
                value={bugKeywords}
                onChange={(event) => setBugKeywords(event.target.value)}
                placeholder="fix, bug, broken"
                aria-label={t("defaults.bugKeywords")}
              />
              <p className="gp-text-muted mt-2 text-xs">{t("defaults.bugKeywordsHelp")}</p>
            </div>
            <div className="gp-panel min-w-0 p-4">
              <p className="gp-kicker">{t("defaults.emergencyPatterns")}</p>
              <div className="mt-3 space-y-3">
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
              </div>
              <p className="gp-text-muted mt-3 text-xs">{t("defaults.emergencyPatternsHelp")}</p>
            </div>
          </div>
        </div>
      </DetailPanel>

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
            <div className="gp-status-row">
              <div className="min-w-0">
                <p className="gp-kicker">{t("repositoryOverrides.currentRepository")}</p>
                <p className="gp-text-secondary mt-1 break-words text-sm">{workspacePath}</p>
              </div>
              <Badge tone={currentRepositoryOverride ? "brand" : "neutral"} className="w-fit">
                {currentRepositoryOverride
                  ? t("repositoryOverrides.overrideActive")
                  : t("repositoryOverrides.inheritingDefaults")}
              </Badge>
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

      <DetailPanel title={t("preview.title")} description={t("preview.description")}>
        {workspacePath ? (
          <div className="space-y-4">
            <div className="gp-status-row">
              <div className="min-w-0">
                <p className="gp-kicker">{t("preview.currentRepository")}</p>
                <p className="gp-text-secondary mt-1 break-words text-sm">{workspacePath}</p>
              </div>
              <Badge tone={currentRepositoryOverride ? "brand" : "neutral"} className="w-fit">
                {t(previewScopeKey)}
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="gp-panel min-w-0 p-3">
                <p className="gp-kicker">{t("preview.window")}</p>
                <p className="gp-text-secondary mt-1 text-sm">
                  {t(`defaults.analysisWindows.${analysisPeriod}`)}
                </p>
              </div>
              <div className="gp-panel min-w-0 p-3">
                <p className="gp-kicker">{t("preview.analyzedCommits")}</p>
                <p className="gp-text-secondary mt-1 text-sm">
                  {matchPreview?.analyzedCommitCount ?? 0}
                </p>
              </div>
              <div className="gp-panel min-w-0 p-3">
                <p className="gp-kicker">{t("preview.bugKeywordMatches")}</p>
                <p className="gp-text-secondary mt-1 text-sm">
                  {matchPreview?.bugKeywordCommitCount ?? 0}
                </p>
              </div>
              <div className="gp-panel min-w-0 p-3">
                <p className="gp-kicker">{t("preview.excludedFileMatches")}</p>
                <p className="gp-text-secondary mt-1 text-sm">
                  {matchPreview?.excludedFileCount ?? 0}
                </p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="gp-panel min-w-0 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="gp-kicker">{t("preview.excludedFiles")}</p>
                  {isMatchPreviewFetching ? (
                    <Badge tone="neutral">{t("preview.updating")}</Badge>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {matchPreview && matchPreview.excludedFiles.length > 0 ? (
                    matchPreview.excludedFiles.map((path) => (
                      <Badge key={path} tone="neutral">
                        {path}
                      </Badge>
                    ))
                  ) : (
                    <p className="gp-text-muted text-sm">{t("preview.excludedFilesEmpty")}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 xl:hidden">
                <p className="gp-kicker">{t("preview.emergencyPatternMatches")}</p>
                {matchPreview && matchPreview.emergencyMatches.length > 0 ? (
                  matchPreview.emergencyMatches.map((row) => (
                    <div key={row.pattern} className="gp-panel min-w-0 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="gp-text-secondary break-words text-sm">{row.pattern}</p>
                          <p className="gp-text-muted mt-1 break-words text-xs">{row.signal}</p>
                        </div>
                        <Badge tone={row.count > 0 ? "watch" : "neutral"} className="w-fit">
                          {row.count}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="gp-panel min-w-0 p-3">
                    <p className="gp-text-muted text-sm">{t("preview.emergencyMatchesEmpty")}</p>
                  </div>
                )}
              </div>

              <div className="hidden xl:block">
                <Table
                  columns={[
                    {
                      key: "pattern",
                      header: t("common:table.pattern"),
                      render: (row) => row.pattern,
                    },
                    {
                      key: "signal",
                      header: t("common:table.signal"),
                      render: (row) => row.signal,
                    },
                    {
                      key: "count",
                      header: t("common:table.count"),
                      align: "right",
                      render: (row) => row.count,
                    },
                  ]}
                  rows={matchPreview?.emergencyMatches ?? []}
                  getRowKey={(row) => row.pattern}
                  emptyText={t("preview.emergencyMatchesEmpty")}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="gp-text-secondary text-sm">{t("preview.empty")}</p>
        )}
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
        title={t("cache.title")}
        description={t("cache.description")}
        actions={
          <div className="gp-header-actions">
            <Button variant="secondary" onClick={() => void openDatabaseDirectory()}>
              {t("cache.openFolder")}
            </Button>
            <Button variant="danger" onClick={clearAnalysisCache}>
              {t("cache.clear")}
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("cache.database")}</p>
            <p className="gp-text-secondary mt-1 text-sm">
              {databaseSummary?.settingsStored
                ? t("cache.databaseReady")
                : t("cache.databaseEmpty")}
            </p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("cache.cachedRuns")}</p>
            <p className="gp-text-secondary mt-1 text-sm">
              {databaseSummary?.analysisRunCount ?? 0}
            </p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("cache.cachedAnalyses")}</p>
            <p className="gp-text-secondary mt-1 text-sm">
              {databaseSummary?.analysisCacheCount ?? 0}
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("cache.retention")}</p>
            <p className="gp-text-secondary mt-1 break-words text-sm">
              {t("cache.retentionValue", {
                runs: databaseSummary?.analysisRunLimit ?? 20,
                cache: databaseSummary?.analysisCacheLimit ?? 50,
              })}
            </p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("cache.databasePath")}</p>
            <p className="gp-text-secondary mt-1 break-words text-sm">
              {databaseSummary?.databasePath ?? t("cache.databasePathUnavailable")}
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("cache.persistedTitle")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {persistedItems.map((item) => (
                <Badge key={item} tone="neutral">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("cache.volatileTitle")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {volatileItems.map((item) => (
                <Badge key={item} tone="neutral">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </DetailPanel>
    </div>
  );
}
