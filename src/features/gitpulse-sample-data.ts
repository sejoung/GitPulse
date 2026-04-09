export const hotspotRows = [
  { path: "src/features/overview/OverviewPage.tsx", changes: 42, fixes: 9, risk: "watch" },
  { path: "src-tauri/src/analysis/overview.rs", changes: 31, fixes: 7, risk: "watch" },
  { path: "src/components/ui/Table.tsx", changes: 24, fixes: 2, risk: "healthy" },
  { path: "src/services/tauri/analysis-api.ts", changes: 18, fixes: 5, risk: "risky" },
];

export const contributorRows = [
  { name: "Core maintainer", commits: 128, share: "62%", recentKey: "status.active", risk: "watch" },
  { name: "Frontend", commits: 44, share: "21%", recentKey: "status.active", risk: "healthy" },
  { name: "Analysis", commits: 25, share: "12%", recentKey: "status.quiet", risk: "watch" },
  { name: "Docs", commits: 10, share: "5%", recentKey: "status.quiet", risk: "healthy" },
];

export const activityRows = [
  { month: "2025-10", commits: 18 },
  { month: "2025-11", commits: 24 },
  { month: "2025-12", commits: 21 },
  { month: "2026-01", commits: 33 },
  { month: "2026-02", commits: 29 },
  { month: "2026-03", commits: 37 },
];

export const deliveryRows = [
  { event: "revert", count: 1, signalKey: "signals.normalRecovery", risk: "healthy" },
  { event: "hotfix", count: 2, signalKey: "signals.watchReleasePressure", risk: "watch" },
  { event: "rollback", count: 0, signalKey: "signals.noRollbackPattern", risk: "healthy" },
  { event: "emergency", count: 0, signalKey: "signals.noEmergencyPattern", risk: "healthy" },
];

export const commandRows = [
  {
    questionKey: "questions.hotspots",
    command: "git log --format=format: --name-only --since=\"1 year ago\"",
  },
  {
    questionKey: "questions.ownership",
    command: "git shortlog -sn --no-merges",
  },
  {
    questionKey: "questions.bugs",
    command: "git log -i -E --grep=\"fix|bug|broken\" --name-only --format=''",
  },
  {
    questionKey: "questions.activity",
    command: "git log --format='%ad' --date=format:'%Y-%m'",
  },
  {
    questionKey: "questions.delivery",
    command: "git log --oneline --since=\"1 year ago\" | grep -iE 'revert|hotfix|emergency|rollback'",
  },
];
