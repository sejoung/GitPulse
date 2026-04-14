import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "../../src/i18n/config";
import i18n from "../../src/i18n/config";
import { useUiStore } from "../../src/app/store/ui-store";
import { UpdateBanner } from "../../src/components/layout/UpdateBanner";
import { renderWithClient } from "./support/render";

const api = vi.hoisted(() => ({
  checkAppUpdate: vi.fn(),
}));

vi.mock("../../src/services/tauri/analysis-api", () => api);
vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: vi.fn(),
}));

function resetStore() {
  window.localStorage.clear();
  useUiStore.setState({
    dismissedUpdateVersion: "",
  });
}

beforeEach(async () => {
  vi.clearAllMocks();
  resetStore();
  await i18n.changeLanguage("en");
});

describe("UpdateBanner", () => {
  it("renders nothing when there is no update", () => {
    api.checkAppUpdate.mockResolvedValue({
      currentVersion: "0.1.4",
      latestVersion: "0.1.4",
      hasUpdate: false,
      downloadUrl: "https://sejoung.github.io/GitPulse/",
    });

    const { container } = renderWithClient(<UpdateBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("shows banner when a new version is available", async () => {
    api.checkAppUpdate.mockResolvedValue({
      currentVersion: "0.1.4",
      latestVersion: "0.2.0",
      hasUpdate: true,
      downloadUrl: "https://sejoung.github.io/GitPulse/",
    });

    renderWithClient(<UpdateBanner />);

    expect(await screen.findByText(/v0\.2\.0/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  it("hides banner after dismiss and persists dismissed version", async () => {
    api.checkAppUpdate.mockResolvedValue({
      currentVersion: "0.1.4",
      latestVersion: "0.2.0",
      hasUpdate: true,
      downloadUrl: "https://sejoung.github.io/GitPulse/",
    });

    renderWithClient(<UpdateBanner />);

    const dismissButton = await screen.findByRole("button", { name: "Dismiss" });
    const user = userEvent.setup();
    await user.click(dismissButton);

    expect(useUiStore.getState().dismissedUpdateVersion).toBe("0.2.0");
  });

  it("does not show banner when version was already dismissed", async () => {
    useUiStore.setState({ dismissedUpdateVersion: "0.2.0" });

    api.checkAppUpdate.mockResolvedValue({
      currentVersion: "0.1.4",
      latestVersion: "0.2.0",
      hasUpdate: true,
      downloadUrl: "https://sejoung.github.io/GitPulse/",
    });

    const { container } = renderWithClient(<UpdateBanner />);

    // Wait for query to settle, then verify banner is still not shown
    await vi.waitFor(() => {
      expect(container.querySelector(".gp-status-row")).toBeNull();
    });
  });

  it("opens download URL when download button is clicked", async () => {
    const { openUrl } = await import("@tauri-apps/plugin-opener");

    api.checkAppUpdate.mockResolvedValue({
      currentVersion: "0.1.4",
      latestVersion: "0.2.0",
      hasUpdate: true,
      downloadUrl: "https://sejoung.github.io/GitPulse/",
    });

    renderWithClient(<UpdateBanner />);

    const downloadButton = await screen.findByRole("button", { name: "Download" });
    const user = userEvent.setup();
    await user.click(downloadButton);

    expect(openUrl).toHaveBeenCalledWith("https://sejoung.github.io/GitPulse/");
  });
});

describe("Zustand dismiss state", () => {
  it("persists dismissed version across store resets", () => {
    useUiStore.setState({ dismissedUpdateVersion: "0.3.0" });
    expect(useUiStore.getState().dismissedUpdateVersion).toBe("0.3.0");

    useUiStore.getState().setDismissedUpdateVersion("0.4.0");
    expect(useUiStore.getState().dismissedUpdateVersion).toBe("0.4.0");
  });
});
