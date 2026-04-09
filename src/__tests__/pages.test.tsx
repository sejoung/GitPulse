import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "../i18n/config";
import i18n from "../i18n/config";
import { useUiStore } from "../app/store/ui-store";
import { ActivityPage } from "../features/activity/ActivityPage";
import { OverviewPage } from "../features/overview/OverviewPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { renderWithClient } from "../test/render";

const api = vi.hoisted(() => ({
  checkoutGitBranch: vi.fn(),
  getActivityAnalysis: vi.fn(),
  getDeliveryRiskAnalysis: vi.fn(),
  getGitBranches: vi.fn(),
  getHotspotsAnalysis: vi.fn(),
  getOverviewAnalysis: vi.fn(),
  getOwnershipAnalysis: vi.fn(),
}));

vi.mock("../services/tauri/analysis-api", () => api);

function resetStore() {
  window.localStorage.clear();
  useUiStore.setState({
    activeItem: "overview",
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
  api.getActivityAnalysis.mockResolvedValue([]);
  api.getOwnershipAnalysis.mockResolvedValue([]);
  api.getDeliveryRiskAnalysis.mockResolvedValue([]);
  api.getGitBranches.mockResolvedValue([]);
  api.checkoutGitBranch.mockResolvedValue("main");
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
});

describe("OverviewPage branch controls", () => {
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
