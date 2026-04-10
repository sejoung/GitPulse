import { invoke } from "@tauri-apps/api/core";
import type { AnalysisRunRecord, PersistedUiSettings } from "../../app/store/ui-store";

export type AnalysisCacheEntry = {
  workspacePath: string;
  repositoryName: string;
  branch: string;
  period: string;
  headSha: string;
  recordedAt: string;
  totalCommits: number;
  hotspotCount: number;
  contributorCount: number;
  deliveryRiskLevel: "low" | "medium" | "high";
};

export type LocalDatabaseSnapshot = {
  settings: Partial<PersistedUiSettings> | null;
  analysisRuns: AnalysisRunRecord[];
};

export type LocalDatabaseSummary = {
  settingsStored: boolean;
  analysisRunCount: number;
  analysisCacheCount: number;
  cachedRepositoryCount: number;
  databasePath: string;
  analysisRunLimit: number;
  analysisCacheLimit: number;
};

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

export async function loadLocalDatabase() {
  if (!isTauriRuntime()) {
    return {
      settings: null,
      analysisRuns: [],
    } satisfies LocalDatabaseSnapshot;
  }

  return invoke<LocalDatabaseSnapshot>("load_local_database");
}

export async function saveLocalDatabaseSettings(settings: Partial<PersistedUiSettings>) {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("save_local_database_settings", { settings });
}

export async function saveLocalDatabaseAnalysisRuns(runs: AnalysisRunRecord[]) {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("save_local_database_analysis_runs", { runs });
}

export async function upsertLocalDatabaseAnalysisCache(entry: AnalysisCacheEntry) {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("upsert_local_database_analysis_cache", { entry });
}

export async function getLocalDatabaseSummary() {
  if (!isTauriRuntime()) {
    return {
      settingsStored: false,
      analysisRunCount: 0,
      analysisCacheCount: 0,
      cachedRepositoryCount: 0,
      databasePath: "",
      analysisRunLimit: 20,
      analysisCacheLimit: 50,
    } satisfies LocalDatabaseSummary;
  }

  return invoke<LocalDatabaseSummary>("get_local_database_summary");
}

export async function openLocalDatabaseDirectory() {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("open_local_database_directory");
}
