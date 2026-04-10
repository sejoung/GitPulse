import { invoke } from "@tauri-apps/api/core";

export type AppLogLevel = "info" | "warn" | "error";

export type LogFileSummary = {
  logPath: string;
  logDirectory: string;
  latestEntries: string[];
};

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

function normalizeContext(context: unknown) {
  if (context === undefined || context === null) {
    return undefined;
  }

  try {
    return JSON.stringify(context);
  } catch {
    return Object.prototype.toString.call(context);
  }
}

export async function appendAppLog(
  level: AppLogLevel,
  source: string,
  message: string,
  context?: unknown
) {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("append_log_entry", {
    entry: {
      level,
      source,
      message,
      context: normalizeContext(context),
    },
  });
}

export async function getLogFileSummary() {
  if (!isTauriRuntime()) {
    return {
      logPath: "",
      logDirectory: "",
      latestEntries: [],
    } satisfies LogFileSummary;
  }

  return invoke<LogFileSummary>("get_log_file_summary");
}

export async function openLogFile() {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("open_log_file");
}
