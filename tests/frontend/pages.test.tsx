import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "../../src/i18n/config";
import i18n from "../../src/i18n/config";
import { useUiStore } from "../../src/app/store/ui-store";
import { ActivityPage } from "../../src/features/activity/ActivityPage";
import { DeliveryRiskPage } from "../../src/features/delivery-risk/DeliveryRiskPage";
import { HotspotsPage } from "../../src/features/hotspots/HotspotsPage";
import { OverviewPage } from "../../src/features/overview/OverviewPage";
import { OwnershipPage } from "../../src/features/ownership/OwnershipPage";
import { SettingsPage } from "../../src/features/settings/SettingsPage";
import { renderWithClient } from "./support/render";

const api = vi.hoisted(() => ({
  checkGitRemoteStatus: vi.fn(),
  checkoutGitBranch: vi.fn(),
  getLocalDatabaseSummary: vi.fn(),
  getLogFileSummary: vi.fn(),
  getActivityAnalysis: vi.fn(),
  getDeliveryRiskAnalysis: vi.fn(),
  getGitBranches: vi.fn(),
  getGitRepositoryState: vi.fn(),
  getHotspotCommitDetails: vi.fn(),
  getHotspotsAnalysis: vi.fn(),
  getOverviewAnalysis: vi.fn(),
  getOwnershipAnalysis: vi.fn(),
  openLocalDatabaseDirectory: vi.fn(),
  openLogFile: vi.fn(),
  getSettingsMatchPreview: vi.fn(),
  pullGitRemoteUpdates: vi.fn(),
  upsertLocalDatabaseAnalysisCache: vi.fn(),
}));

vi.mock("../../src/services/tauri/analysis-api", () => api);
vi.mock("../../src/services/tauri/local-database", () => ({
  getLocalDatabaseSummary: api.getLocalDatabaseSummary,
  openLocalDatabaseDirectory: api.openLocalDatabaseDirectory,
  loadLocalDatabase: vi.fn(),
  saveLocalDatabaseSettings: vi.fn(),
  saveLocalDatabaseAnalysisRuns: vi.fn(),
  upsertLocalDatabaseAnalysisCache: api.upsertLocalDatabaseAnalysisCache,
}));
vi.mock("../../src/services/tauri/app-log", () => ({
  getLogFileSummary: api.getLogFileSummary,
  openLogFile: api.openLogFile,
  appendAppLog: vi.fn(),
}));

function resetStore() {
  window.localStorage.clear();
  useUiStore.setState({
    activeItem: "overview",
    language: "en",
    developerMode: false,
    workspacePath: "",
    selectedBranch: "",
    analysisPeriod: "1y",
    excludedPaths: "dist/, node_modules/, target/",
    defaultBranch: "main",
    bugKeywords: "fix, bug, broken",
    emergencyPatterns: [
      { pattern: "revert", signal: "Normal recovery" },
      { pattern: "hotfix", signal: "Watch release pressure" },
      { pattern: "emergency", signal: "Emergency response" },
      { pattern: "rollback", signal: "Rollback pattern" },
    ],
    rememberLastRepository: true,
    repositoryOverrides: {},
    analysisRuns: [],
  });
}

beforeEach(async () => {
  vi.clearAllMocks();
  resetStore();
  await i18n.changeLanguage("en");

  api.getOverviewAnalysis.mockResolvedValue({
    repositoryName: "repo",
    totalCommits: 0,
    hotspotCount: 0,
    contributorCount: 0,
    deliveryRiskLevel: "low",
  });
  api.getHotspotsAnalysis.mockResolvedValue([]);
  api.getHotspotCommitDetails.mockResolvedValue([]);
  api.getActivityAnalysis.mockResolvedValue([]);
  api.getOwnershipAnalysis.mockResolvedValue([]);
  api.getDeliveryRiskAnalysis.mockResolvedValue([]);
  api.getSettingsMatchPreview.mockResolvedValue({
    analyzedCommitCount: 0,
    bugKeywordCommitCount: 0,
    excludedFileCount: 0,
    excludedFiles: [],
    emergencyMatches: [],
    bugKeywordCommits: [],
    emergencyCommitSamples: [],
  });
  api.getLocalDatabaseSummary.mockResolvedValue({
    settingsStored: true,
    analysisRunCount: 7,
    analysisCacheCount: 12,
    cachedRepositoryCount: 2,
    databasePath: "/mock-data/gitpulse-db.json",
    analysisRunLimit: 20,
    analysisCacheLimit: 50,
  });
  api.getLogFileSummary.mockResolvedValue({
    logPath: "/mock-data/logs/gitpulse.log",
    logDirectory: "/mock-data/logs",
    latestEntries: ["[1712700000000] ERROR frontend:test - sample failure"],
  });
  api.getGitBranches.mockResolvedValue([]);
  api.getGitRepositoryState.mockResolvedValue({
    branch: "main",
    headSha: "1234567890abcdef",
    shortHeadSha: "1234567",
    dirty: false,
  });
  api.checkGitRemoteStatus.mockResolvedValue({
    status: "up_to_date",
    upstream: "origin/main",
    ahead: 0,
    behind: 0,
    message: null,
  });
  api.checkoutGitBranch.mockResolvedValue("main");
  api.pullGitRemoteUpdates.mockResolvedValue({
    status: "up_to_date",
    upstream: "origin/main",
    ahead: 0,
    behind: 0,
    message: null,
  });
  api.openLocalDatabaseDirectory.mockResolvedValue(undefined);
  api.openLogFile.mockResolvedValue(undefined);
  api.upsertLocalDatabaseAnalysisCache.mockResolvedValue(undefined);
});

describe("SettingsPage", () => {
  it("renders emergency pattern and signal inputs that update settings state", async () => {
    const user = userEvent.setup();

    renderWithClient(<SettingsPage />);

    const patternInputs = screen.getAllByLabelText("Emergency pattern");
    const signalInputs = screen.getAllByLabelText("Emergency signal");

    await user.clear(patternInputs[0]);
    await user.type(patternInputs[0], "revert, reverted");
    await user.clear(signalInputs[0]);
    await user.type(signalInputs[0], "Rollback activity");

    expect(useUiStore.getState().emergencyPatterns[0]).toEqual({
      pattern: "revert, reverted",
      signal: "Rollback activity",
    });
    expect(screen.getByText(/Use commas for aliases/)).toBeInTheDocument();
  });

  it("clears the remembered repository when repository memory is turned off", async () => {
    const user = userEvent.setup();
    useUiStore.setState({
      workspacePath: "/Users/beni/career-ops",
      selectedBranch: "main",
      rememberLastRepository: true,
    });

    renderWithClient(<SettingsPage />);

    const offTabs = screen.getAllByRole("tab", { name: "Off" });
    await user.click(offTabs[0]);

    expect(useUiStore.getState().rememberLastRepository).toBe(false);
    expect(useUiStore.getState().workspacePath).toBe("");
    expect(useUiStore.getState().selectedBranch).toBe("");
  });

  it("enables a repository override for the current workspace", async () => {
    const user = userEvent.setup();
    useUiStore.setState({
      workspacePath: "/Users/beni/career-ops",
    });

    renderWithClient(<SettingsPage />);
    await user.click(screen.getByRole("tab", { name: "Repository" }));

    await user.click(screen.getByRole("button", { name: "Enable override" }));

    expect(useUiStore.getState().repositoryOverrides["/Users/beni/career-ops"]).toEqual({
      excludedPaths: "dist/, node_modules/, target/",
      bugKeywords: "fix, bug, broken",
      emergencyPatterns: [
        { pattern: "revert", signal: "Normal recovery" },
        { pattern: "hotfix", signal: "Watch release pressure" },
        { pattern: "emergency", signal: "Emergency response" },
        { pattern: "rollback", signal: "Rollback pattern" },
      ],
    });
  });

  it("applies a preset to the global defaults", async () => {
    const user = userEvent.setup();

    renderWithClient(<SettingsPage />);

    await user.click(screen.getAllByRole("button", { name: "Apply to defaults" })[0]);

    expect(useUiStore.getState().analysisPeriod).toBe("6m");
    expect(useUiStore.getState().excludedPaths).toBe(
      "dist/, build/, .next/, node_modules/, coverage/, target/"
    );
    expect(useUiStore.getState().bugKeywords).toBe("fix, bug, broken, regression");
    expect(useUiStore.getState().emergencyPatterns[0]).toEqual({
      pattern: "revert, reverted",
      signal: "Rollback activity",
    });
    expect(
      screen.getByText("Frontend or service UI preset was applied to the global defaults.")
    ).toBeInTheDocument();
  });

  it("applies a preset to the current repository override", async () => {
    const user = userEvent.setup();
    useUiStore.setState({
      workspacePath: "/Users/beni/career-ops",
    });

    renderWithClient(<SettingsPage />);

    const buttons = screen.getAllByRole("button", { name: "Apply to repository" });
    await user.click(buttons[2]);

    expect(useUiStore.getState().repositoryOverrides["/Users/beni/career-ops"]).toEqual({
      excludedPaths: "dist/, build/, node_modules/, target/, .turbo/, coverage/",
      bugKeywords: "fix, bug, broken, rollback, flaky",
      emergencyPatterns: [
        { pattern: "revert, reverted", signal: "Rollback activity" },
        { pattern: "hotfix", signal: "Watch release pressure" },
        { pattern: "incident, emergency", signal: "Emergency response" },
        { pattern: "rollback", signal: "Rollback pattern" },
      ],
    });
    expect(
      screen.getByText(
        "Multi-package repository preset was applied to the current repository override."
      )
    ).toBeInTheDocument();
  });

  it("shows repository override guidance and opens overview when no workspace is selected", async () => {
    const user = userEvent.setup();

    renderWithClient(<SettingsPage />);
    await user.click(screen.getByRole("tab", { name: "Repository" }));

    expect(screen.getByText("Repository required")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Choose a repository in Overview first. Repository override settings are scoped to the currently selected repository."
      )
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open Overview" }));

    expect(useUiStore.getState().activeItem).toBe("overview");
  });

  it("toggles developer mode and reveals debug actions", async () => {
    const user = userEvent.setup();

    renderWithClient(<SettingsPage />);
    await user.click(screen.getByRole("tab", { name: "Advanced" }));

    expect(
      screen.getByText("Turn on Developer mode to view recent log lines here.")
    ).toBeInTheDocument();

    const onTabs = screen.getAllByRole("tab", { name: "On" });
    await user.click(onTabs[onTabs.length - 1]);

    expect(useUiStore.getState().developerMode).toBe(true);
    expect(screen.getByRole("button", { name: "Copy debug summary" })).toBeInTheDocument();
  });

  it("renders live settings match preview for the current repository", async () => {
    const user = userEvent.setup();
    useUiStore.setState({
      workspacePath: "/Users/beni/career-ops",
      analysisPeriod: "3m",
    });
    api.getSettingsMatchPreview.mockResolvedValue({
      analyzedCommitCount: 18,
      bugKeywordCommitCount: 4,
      excludedFileCount: 2,
      excludedFiles: ["dist/index.js", "target/debug/app"],
      emergencyMatches: [
        { pattern: "revert, reverted", signal: "Rollback activity", count: 2 },
        { pattern: "hotfix", signal: "Watch release pressure", count: 1 },
      ],
      bugKeywordCommits: [
        {
          shortSha: "abc1234",
          date: "2026-04-10",
          author: "Beni",
          subject: "fix app shell bug",
        },
      ],
      emergencyCommitSamples: [
        {
          pattern: "revert, reverted",
          signal: "Rollback activity",
          commits: [
            {
              shortSha: "def5678",
              date: "2026-04-11",
              author: "Beni",
              subject: "reverted app shell",
            },
          ],
        },
      ],
    });

    renderWithClient(<SettingsPage />);
    await user.click(screen.getByRole("tab", { name: "Repository" }));

    expect(await screen.findByText("Settings match preview")).toBeInTheDocument();
    expect(await screen.findByText("dist/index.js")).toBeInTheDocument();
    expect(screen.getByText("target/debug/app")).toBeInTheDocument();
    expect(screen.getByText("fix app shell bug")).toBeInTheDocument();
    expect(screen.getByText("reverted app shell")).toBeInTheDocument();
    expect(screen.getAllByText("revert, reverted").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rollback activity").length).toBeGreaterThan(0);
    expect(api.getSettingsMatchPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        workspacePath: "/Users/beni/career-ops",
        period: "3m",
        excludedPaths: "dist/, node_modules/, target/",
        bugKeywords: "fix, bug, broken",
        emergencyPatterns: [
          { pattern: "revert", signal: "Normal recovery" },
          { pattern: "hotfix", signal: "Watch release pressure" },
          { pattern: "emergency", signal: "Emergency response" },
          { pattern: "rollback", signal: "Rollback pattern" },
        ],
      })
    );
  });

  it("lets the user jump from preview to overview", async () => {
    const user = userEvent.setup();
    useUiStore.setState({
      workspacePath: "/Users/beni/career-ops",
      activeItem: "settings",
    });

    renderWithClient(<SettingsPage />);
    await user.click(screen.getByRole("tab", { name: "Repository" }));

    await user.click(screen.getAllByRole("button", { name: "Open Overview" })[0]);

    expect(useUiStore.getState().activeItem).toBe("overview");
  });

  it("shows local database retention and opens the database folder", async () => {
    const user = userEvent.setup();

    renderWithClient(<SettingsPage />);
    await user.click(screen.getByRole("tab", { name: "Advanced" }));

    expect(await screen.findByText("Local database")).toBeInTheDocument();
    expect(
      await screen.findByText("Keep the latest 20 analysis runs and 50 cached analysis snapshots.")
    ).toBeInTheDocument();
    expect(screen.getByText("Database path")).toBeInTheDocument();
    expect(api.getLocalDatabaseSummary).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Show DB file" }));

    expect(api.openLocalDatabaseDirectory).toHaveBeenCalledTimes(1);
    expect(
      (await screen.findAllByText("Revealed the local database file.")).length
    ).toBeGreaterThan(0);
  });

  it("shows recent logs and opens the log file", async () => {
    const user = userEvent.setup();
    useUiStore.setState({ developerMode: true });

    renderWithClient(<SettingsPage />);
    await user.click(screen.getByRole("tab", { name: "Advanced" }));

    expect(await screen.findByText("Recent log entries")).toBeInTheDocument();
    expect(api.getLogFileSummary).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Show log file" }));

    expect(api.openLogFile).toHaveBeenCalledTimes(1);
    expect((await screen.findAllByText("Revealed the log file.")).length).toBeGreaterThan(0);
  });
});

describe("OverviewPage branch controls", () => {
  it("opens settings from the overview header", async () => {
    const user = userEvent.setup();
    useUiStore.setState({ workspacePath: "/repo", activeItem: "overview" });

    renderWithClient(<OverviewPage />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));

    expect(useUiStore.getState().activeItem).toBe("settings");
  });

  it("opens settings from repository details", async () => {
    const user = userEvent.setup();
    useUiStore.setState({ workspacePath: "/repo", selectedBranch: "main", activeItem: "overview" });
    api.getGitBranches.mockResolvedValue([
      { name: "main", label: "main", kind: "local", current: true },
    ]);

    renderWithClient(<OverviewPage />);

    await user.click(await screen.findByRole("button", { name: "Adjust settings" }));

    expect(useUiStore.getState().activeItem).toBe("settings");
  });

  it("disables the no-branches placeholder option", async () => {
    useUiStore.setState({ workspacePath: "/repo" });
    api.getGitBranches.mockResolvedValue([]);

    renderWithClient(<OverviewPage />);

    const branchSelect = await screen.findByRole("combobox", { name: "Branch" });
    const placeholder = screen.getByRole("option", { name: "No branches" });

    expect(branchSelect).toBeDisabled();
    expect(placeholder).toBeDisabled();
  });

  it("shows a progress overlay while a branch checkout is pending", async () => {
    const user = userEvent.setup();
    useUiStore.setState({ workspacePath: "/repo", selectedBranch: "main" });
    api.getGitBranches.mockResolvedValue([
      { name: "main", label: "main", kind: "local", current: true },
      {
        name: "origin/feature-a",
        label: "origin/feature-a (remote)",
        kind: "remote",
        current: false,
      },
    ]);
    api.checkoutGitBranch.mockImplementation(() => new Promise(() => undefined));

    renderWithClient(<OverviewPage />);

    const branchSelect = await screen.findByRole("combobox", { name: "Branch" });
    await screen.findByRole("option", { name: "origin/feature-a (remote)" });
    await user.selectOptions(branchSelect, "origin/feature-a");

    expect(await screen.findByText("Switching branch")).toBeInTheDocument();
    expect(screen.getByText("origin/feature-a")).toBeInTheDocument();
    expect(
      screen.getByText("Checking out the branch and refreshing analysis.")
    ).toBeInTheDocument();
  });

  it("checks remote status without pulling changes", async () => {
    const user = userEvent.setup();
    useUiStore.setState({ workspacePath: "/repo", selectedBranch: "main" });
    api.getGitBranches.mockResolvedValue([
      { name: "main", label: "main", kind: "local", current: true },
    ]);
    api.checkGitRemoteStatus.mockResolvedValue({
      status: "behind",
      upstream: "origin/main",
      ahead: 0,
      behind: 2,
      message: null,
    });

    renderWithClient(<OverviewPage />);

    await user.click(await screen.findByRole("button", { name: "Check remote" }));

    expect(api.checkGitRemoteStatus).toHaveBeenCalledWith("/repo");
    expect(await screen.findByText("Behind 2")).toBeInTheDocument();
    expect(screen.getByText("Tracking origin/main")).toBeInTheDocument();
    expect(screen.getByText("Analysis freshness")).toBeInTheDocument();
    expect(screen.getByText("Stale by 2")).toBeInTheDocument();
    expect(screen.getByText("Remote check age")).toBeInTheDocument();
    expect(screen.getByText("Fresh")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This analysis is based on a local HEAD that is 2 commits behind origin/main."
      )
    ).toBeInTheDocument();
  });

  it("marks the remote freshness check as stale after five minutes", async () => {
    vi.useFakeTimers();
    try {
      useUiStore.setState({ workspacePath: "/repo", selectedBranch: "main" });
      api.getGitBranches.mockResolvedValue([
        { name: "main", label: "main", kind: "local", current: true },
      ]);
      api.checkGitRemoteStatus.mockResolvedValue({
        status: "up_to_date",
        upstream: "origin/main",
        ahead: 0,
        behind: 0,
        message: null,
      });

      renderWithClient(<OverviewPage />);

      fireEvent.click(screen.getByRole("button", { name: "Check remote" }));
      await vi.advanceTimersByTimeAsync(0);
      expect(screen.getByText("Fresh")).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

      expect(screen.getByText("Stale")).toBeInTheDocument();
      expect(
        screen.getByText(
          /This remote check is stale\. Run a new remote check before trusting freshness/
        )
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows analysis basis and can pull after a behind remote check", async () => {
    const user = userEvent.setup();
    useUiStore.setState({ workspacePath: "/repo", selectedBranch: "main" });
    api.getGitBranches.mockResolvedValue([
      { name: "main", label: "main", kind: "local", current: true },
    ]);
    api.checkGitRemoteStatus.mockResolvedValue({
      status: "behind",
      upstream: "origin/main",
      ahead: 0,
      behind: 1,
      message: null,
    });
    api.pullGitRemoteUpdates.mockResolvedValue({
      status: "up_to_date",
      upstream: "origin/main",
      ahead: 0,
      behind: 0,
      message: null,
    });

    renderWithClient(<OverviewPage />);

    expect((await screen.findAllByText("1234567")).length).toBeGreaterThan(0);
    await user.click(await screen.findByRole("button", { name: "Check remote" }));
    await screen.findByText("Behind 1");
    await user.click(screen.getByRole("button", { name: "Pull" }));

    expect(api.pullGitRemoteUpdates).toHaveBeenCalledWith("/repo");
    expect(await screen.findByText("Up to date")).toBeInTheDocument();
  });

  it("stores and renders analysis history for the current repository", async () => {
    useUiStore.setState({ workspacePath: "/repo", selectedBranch: "main" });
    api.getGitBranches.mockResolvedValue([
      { name: "main", label: "main", kind: "local", current: true },
    ]);
    api.getOverviewAnalysis.mockResolvedValue({
      repositoryName: "repo",
      totalCommits: 24,
      hotspotCount: 5,
      contributorCount: 3,
      deliveryRiskLevel: "medium",
    });

    renderWithClient(<OverviewPage />);

    expect((await screen.findAllByText("Analysis history")).length).toBeGreaterThan(0);
    expect(await screen.findByText("Latest HEAD")).toBeInTheDocument();
    expect(useUiStore.getState().analysisRuns[0]).toMatchObject({
      workspacePath: "/repo",
      branch: "main",
      period: "1y",
      headSha: "1234567890abcdef",
      shortHeadSha: "1234567",
      totalCommits: 24,
      hotspotCount: 5,
      contributorCount: 3,
      deliveryRiskLevel: "medium",
    });
  });

  it("renders snapshot compare and lets the user change the baseline run", async () => {
    const user = userEvent.setup();
    useUiStore.setState({
      workspacePath: "/repo",
      selectedBranch: "main",
      analysisRuns: [
        {
          workspacePath: "/repo",
          branch: "main",
          period: "1y",
          headSha: "head-current",
          shortHeadSha: "cur1234",
          recordedAt: "2026-04-10T10:00:00.000Z",
          totalCommits: 30,
          hotspotCount: 6,
          contributorCount: 4,
          deliveryRiskLevel: "medium",
        },
        {
          workspacePath: "/repo",
          branch: "main",
          period: "1y",
          headSha: "head-prev",
          shortHeadSha: "prev123",
          recordedAt: "2026-04-09T10:00:00.000Z",
          totalCommits: 24,
          hotspotCount: 5,
          contributorCount: 3,
          deliveryRiskLevel: "low",
        },
        {
          workspacePath: "/repo",
          branch: "release",
          period: "3m",
          headSha: "head-old",
          shortHeadSha: "old1234",
          recordedAt: "2026-04-08T10:00:00.000Z",
          totalCommits: 18,
          hotspotCount: 3,
          contributorCount: 2,
          deliveryRiskLevel: "low",
        },
      ],
    });
    api.getGitRepositoryState.mockResolvedValue({
      branch: "main",
      headSha: "head-current",
      shortHeadSha: "cur1234",
      dirty: false,
    });
    api.getGitBranches.mockResolvedValue([
      { name: "main", label: "main", kind: "local", current: true },
    ]);

    renderWithClient(<OverviewPage />);

    expect(await screen.findByText("Snapshot compare")).toBeInTheDocument();
    expect(screen.getByText("Commit delta vs baseline")).toBeInTheDocument();
    expect(screen.getAllByText("+6").length).toBeGreaterThan(0);
    expect(screen.getByText("low -> medium")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Compare" }));

    expect(await screen.findByText("+12")).toBeInTheDocument();
    expect(
      await screen.findByText("Branch and analysis window changed between the compared snapshots.")
    ).toBeInTheDocument();
  });

  it("exports the current analysis as JSON", async () => {
    const user = userEvent.setup();
    const createObjectUrl = vi.fn(() => "blob:gitpulse-report");
    const revokeObjectUrl = vi.fn();
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: createObjectUrl,
      revokeObjectURL: revokeObjectUrl,
    });
    useUiStore.setState({ workspacePath: "/repo", selectedBranch: "main" });
    api.getGitBranches.mockResolvedValue([
      { name: "main", label: "main", kind: "local", current: true },
    ]);
    api.getOverviewAnalysis.mockResolvedValue({
      repositoryName: "repo",
      totalCommits: 24,
      hotspotCount: 5,
      contributorCount: 3,
      deliveryRiskLevel: "medium",
    });
    api.getOwnershipAnalysis.mockResolvedValue([
      { name: "Beni", commits: 10, share: "50%", recentKey: "status.active", risk: "healthy" },
    ]);
    api.getDeliveryRiskAnalysis.mockResolvedValue([
      {
        event: "revert",
        count: 1,
        signal: "Normal recovery",
        signalKey: "signals.normalRecovery",
        risk: "healthy",
      },
    ]);

    renderWithClient(<OverviewPage />);

    await user.click(screen.getByRole("tab", { name: "Analysis report export" }));
    await user.click(await screen.findByRole("button", { name: "Export JSON" }));

    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:gitpulse-report");
    expect(await screen.findByText("JSON report downloaded.")).toBeInTheDocument();

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("exports a compare summary report with a timestamped filename", async () => {
    const user = userEvent.setup();
    const downloads: string[] = [];
    const createObjectUrl = vi.fn(() => "blob:gitpulse-report-compare");
    const revokeObjectUrl = vi.fn();
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function click(this: HTMLAnchorElement) {
        downloads.push(this.download);
      });
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: createObjectUrl,
      revokeObjectURL: revokeObjectUrl,
    });
    useUiStore.setState({
      workspacePath: "/repo",
      selectedBranch: "main",
      analysisRuns: [
        {
          workspacePath: "/repo",
          branch: "main",
          period: "3m",
          headSha: "head-current",
          shortHeadSha: "cur1234",
          recordedAt: "2026-04-10T01:02:03.000Z",
          totalCommits: 24,
          hotspotCount: 5,
          contributorCount: 3,
          deliveryRiskLevel: "medium",
        },
        {
          workspacePath: "/repo",
          branch: "main",
          period: "6m",
          headSha: "head-prev",
          shortHeadSha: "prev123",
          recordedAt: "2026-04-01T01:02:03.000Z",
          totalCommits: 18,
          hotspotCount: 3,
          contributorCount: 2,
          deliveryRiskLevel: "low",
        },
      ],
    });
    api.getGitBranches.mockResolvedValue([
      { name: "main", label: "main", kind: "local", current: true },
    ]);
    api.getOverviewAnalysis.mockResolvedValue({
      repositoryName: "repo",
      totalCommits: 24,
      hotspotCount: 5,
      contributorCount: 3,
      deliveryRiskLevel: "medium",
    });

    renderWithClient(<OverviewPage />);
    await user.click(screen.getByRole("tab", { name: "Analysis report export" }));

    await user.click(screen.getByRole("tab", { name: "Summary" }));
    await user.click(screen.getByRole("tab", { name: "Compare snapshot" }));
    await user.click(screen.getByRole("button", { name: "Export JSON" }));

    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(downloads[0]).toMatch(/^repo-main-\d{8}T\d{6}Z-summary-compare-report\.json$/);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:gitpulse-report-compare");

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});

describe("ActivityPage", () => {
  it("shows initial analysis state instead of result-like values before workspace selection", () => {
    renderWithClient(<ActivityPage />);

    expect(screen.getAllByText("Not analyzed").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Select a repository to see analysis results.").length
    ).toBeGreaterThan(0);
  });
});

describe("analysis pages initial states", () => {
  it("keeps hotspots, ownership, and delivery risk in a pre-analysis state before workspace selection", () => {
    const { unmount: unmountHotspots } = renderWithClient(<HotspotsPage />);
    expect(screen.getAllByText("Not analyzed").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Select a repository to see analysis results.").length
    ).toBeGreaterThan(0);
    unmountHotspots();

    const { unmount: unmountOwnership } = renderWithClient(<OwnershipPage />);
    expect(screen.getAllByText("Not analyzed").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Select a repository to see analysis results.").length
    ).toBeGreaterThan(0);
    unmountOwnership();

    renderWithClient(<DeliveryRiskPage />);
    expect(screen.getAllByText("Not analyzed").length).toBeGreaterThan(0);
    expect(screen.getByText("Select a repository to see analysis results.")).toBeInTheDocument();
  });
});

describe("HotspotsPage", () => {
  it("shows commit evidence for the selected hotspot file", async () => {
    useUiStore.setState({ workspacePath: "/repo", selectedBranch: "main" });
    api.getHotspotsAnalysis.mockResolvedValue([
      {
        path: "src/app.tsx",
        changes: 12,
        fixes: 4,
        risk: "watch",
      },
    ]);
    api.getHotspotCommitDetails.mockResolvedValue([
      {
        sha: "abcdef123456",
        shortSha: "abcdef1",
        date: "2026-04-01",
        author: "Beni",
        subject: "fix app shell bug",
        matchesBugKeyword: true,
      },
    ]);

    renderWithClient(<HotspotsPage />);

    expect(await screen.findByText("Commit evidence")).toBeInTheDocument();
    expect((await screen.findAllByText("fix app shell bug")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("abcdef1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bug keyword").length).toBeGreaterThan(0);
    expect(api.getHotspotCommitDetails).toHaveBeenCalledWith({
      workspacePath: "/repo",
      period: "1y",
      bugKeywords: "fix, bug, broken",
      filePath: "src/app.tsx",
    });
  });

  it("filters hotspot commit evidence by keyword match and author", async () => {
    const user = userEvent.setup();
    useUiStore.setState({ workspacePath: "/repo", selectedBranch: "main" });
    api.getHotspotsAnalysis.mockResolvedValue([
      {
        path: "src/app.tsx",
        changes: 12,
        fixes: 4,
        risk: "watch",
      },
    ]);
    api.getHotspotCommitDetails.mockResolvedValue([
      {
        sha: "abcdef123456",
        shortSha: "abcdef1",
        date: "2026-04-01",
        author: "Beni",
        subject: "fix app shell bug",
        matchesBugKeyword: true,
      },
      {
        sha: "123456abcdef",
        shortSha: "123456a",
        date: "2026-03-28",
        author: "Alex",
        subject: "refactor app shell",
        matchesBugKeyword: false,
      },
    ]);

    renderWithClient(<HotspotsPage />);

    expect(await screen.findByText("Visible commits")).toBeInTheDocument();
    expect(screen.getAllByText("fix app shell bug").length).toBeGreaterThan(0);
    expect(screen.getAllByText("refactor app shell").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Show filters" }));
    await user.click(screen.getByRole("tab", { name: "Keyword matches" }));

    expect(screen.getAllByText("fix app shell bug").length).toBeGreaterThan(0);
    expect(screen.queryByText("refactor app shell")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Author filter" }), "Beni");
    expect(screen.getAllByText("Beni").length).toBeGreaterThan(0);
  });

  it("uses repository override settings for hotspot analysis", async () => {
    useUiStore.setState({
      workspacePath: "/repo",
      selectedBranch: "main",
      repositoryOverrides: {
        "/repo": {
          excludedPaths: "build/",
          bugKeywords: "incident, outage",
          emergencyPatterns: [
            { pattern: "revert", signal: "Normal recovery" },
            { pattern: "hotfix", signal: "Watch release pressure" },
            { pattern: "emergency", signal: "Emergency response" },
            { pattern: "rollback", signal: "Rollback pattern" },
          ],
        },
      },
    });
    api.getHotspotsAnalysis.mockResolvedValue([
      {
        path: "src/app.tsx",
        changes: 12,
        fixes: 4,
        risk: "watch",
      },
    ]);

    renderWithClient(<HotspotsPage />);

    expect(await screen.findByText("incident, outage")).toBeInTheDocument();
    expect(screen.getByText("build/")).toBeInTheDocument();
    expect(api.getHotspotsAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        workspacePath: "/repo",
        period: "1y",
        excludedPaths: "build/",
        bugKeywords: "incident, outage",
      })
    );
  });
});

describe("DeliveryRiskPage", () => {
  it("renders risky delivery events with the risky badge tone", async () => {
    useUiStore.setState({ workspacePath: "/repo", selectedBranch: "main" });
    api.getDeliveryRiskAnalysis.mockResolvedValue([
      {
        event: "hotfix",
        count: 7,
        signal: "Release pressure",
        signalKey: "signals.watchReleasePressure",
        risk: "risky",
      },
    ]);

    renderWithClient(<DeliveryRiskPage />);

    const riskyTexts = await screen.findAllByText("risky");
    expect(riskyTexts.some((element) => element.classList.contains("gp-badge-risky"))).toBe(true);
  });

  it("opens delivery pattern details only after explicit selection", async () => {
    const user = userEvent.setup();
    useUiStore.setState({ workspacePath: "/repo", selectedBranch: "main" });
    api.getDeliveryRiskAnalysis.mockResolvedValue([
      {
        event: "hotfix",
        count: 2,
        signal: "Release pressure",
        signalKey: "signals.watchReleasePressure",
        risk: "watch",
      },
    ]);

    renderWithClient(<DeliveryRiskPage />);

    expect(await screen.findByText("Choose a pattern")).toBeInTheDocument();
    expect(screen.queryByText("Configured signal")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Inspect" }));

    expect(await screen.findByText("Configured signal")).toBeInTheDocument();
    expect(await screen.findAllByText("Release pressure")).not.toHaveLength(0);
  });
});

describe("OwnershipPage", () => {
  it("opens contributor details only after explicit selection", async () => {
    const user = userEvent.setup();
    useUiStore.setState({ workspacePath: "/repo", selectedBranch: "main" });
    api.getOwnershipAnalysis.mockResolvedValue([
      {
        name: "Beni",
        commits: 10,
        share: "50%",
        recentKey: "status.active",
        risk: "watch",
      },
    ]);

    renderWithClient(<OwnershipPage />);

    expect(await screen.findByText("Choose a contributor")).toBeInTheDocument();
    expect(
      screen.queryByText("This contributor holds a large share of commits.")
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Inspect" }));

    expect(
      await screen.findByText(/This contributor holds a large share of commits\./)
    ).toBeInTheDocument();
  });
});
