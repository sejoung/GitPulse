import { invoke } from "@tauri-apps/api/core";
import type { AnalysisRunRecord, PersistedUiSettings } from "../../app/store/ui-store";
import { appendAppLog } from "./app-log";

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

async function invokeLogged<T>(
  command: string,
  payload?: Record<string, unknown>,
  options?: { logSuccess?: boolean }
) {
  try {
    const result = await invoke<T>(command, payload);
    if (options?.logSuccess) {
      void appendAppLog("info", `tauri:${command}`, "Command completed", payload).catch(
        () => undefined
      );
    }
    return result;
  } catch (error) {
    void appendAppLog("error", `tauri:${command}`, "Command failed", {
      payload,
      error: error instanceof Error ? error.message : String(error),
    }).catch(() => undefined);
    throw error;
  }
}

export async function loadLocalDatabase() {
  if (!isTauriRuntime()) {
    return {
      settings: null,
      analysisRuns: [],
    } satisfies LocalDatabaseSnapshot;
  }

  return invokeLogged<LocalDatabaseSnapshot>("load_local_database");
}

export async function saveLocalDatabaseSettings(settings: Partial<PersistedUiSettings>) {
  if (!isTauriRuntime()) {
    return;
  }

  await invokeLogged("save_local_database_settings", { settings }, { logSuccess: true });
}

export async function saveLocalDatabaseAnalysisRuns(runs: AnalysisRunRecord[]) {
  if (!isTauriRuntime()) {
    return;
  }

  await invokeLogged("save_local_database_analysis_runs", { runs });
}

export async function upsertLocalDatabaseAnalysisCache(entry: AnalysisCacheEntry) {
  if (!isTauriRuntime()) {
    return;
  }

  await invokeLogged("upsert_local_database_analysis_cache", { entry });
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

  return invokeLogged<LocalDatabaseSummary>("get_local_database_summary");
}

export async function openLocalDatabaseDirectory() {
  if (!isTauriRuntime()) {
    return;
  }

  await invokeLogged("open_local_database_directory", undefined, { logSuccess: true });
}
