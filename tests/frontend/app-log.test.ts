import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appendAppLog, getLogFileSummary, openLogFile } from "../../src/services/tauri/app-log";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const invokeMock = vi.mocked(invoke);

function setTauriRuntime(enabled: boolean) {
  if (enabled) {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: {},
    });
  } else {
    Reflect.deleteProperty(window, "__TAURI_INTERNALS__");
  }
}

describe("app-log api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTauriRuntime(false);
  });

  it("returns safe fallback data outside the native runtime", async () => {
    await expect(getLogFileSummary()).resolves.toEqual({
      logPath: "",
      logDirectory: "",
      latestEntries: [],
    });
    await expect(
      appendAppLog("error", "frontend:test", "message", { scope: "unit" })
    ).resolves.toBeUndefined();
    await expect(openLogFile()).resolves.toBeUndefined();

    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("passes log requests through to native commands", async () => {
    setTauriRuntime(true);
    invokeMock.mockResolvedValue(undefined);

    await appendAppLog("error", "frontend:test", "message", { scope: "unit" });
    await getLogFileSummary();
    await openLogFile();

    expect(invokeMock).toHaveBeenCalledWith("append_log_entry", {
      entry: {
        level: "error",
        source: "frontend:test",
        message: "message",
        context: JSON.stringify({ scope: "unit" }),
      },
    });
    expect(invokeMock).toHaveBeenCalledWith("get_log_file_summary");
    expect(invokeMock).toHaveBeenCalledWith("open_log_file");
  });
});
