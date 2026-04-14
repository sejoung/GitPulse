# GitPulse Design System

## Overview

This document describes the implemented GitPulse design system in the app codebase.

The system is built with:

- Tailwind theme tokens in `tailwind.config.ts`
- Semantic global classes in `src/styles.css`
- Reusable React components under `src/components`

Use this document as the implementation guide when adding screens or features.

---

## Design Direction

GitPulse uses a dark-first, signal-focused interface.

Core rules:

- Use dark neutral surfaces as the default UI foundation.
- Use blue and cyan for brand and signal highlights.
- Use risk colors only for status, warning, and severity.
- Prefer semantic components over repeating long Tailwind class strings.

---

## Tailwind Theme Tokens

Theme tokens are defined under the `gp` namespace.

### Background

| Token                |     Value | Usage                               |
| -------------------- | --------: | ----------------------------------- |
| `bg-gp-bg-primary`   | `#0B1220` | Main app background                 |
| `bg-gp-bg-secondary` | `#111827` | Cards, sidebar, topbar              |
| `bg-gp-bg-tertiary`  | `#1F2937` | Panels, hover states, active states |

### Brand

| Token                                     |                 Value | Usage                           |
| ----------------------------------------- | --------------------: | ------------------------------- |
| `text-gp-brand-blue` / `bg-gp-brand-blue` |             `#3B82F6` | Primary brand action            |
| `text-gp-brand-cyan` / `bg-gp-brand-cyan` |             `#22D3EE` | Signal highlight                |
| `bg-gp-signal`                            | Blue to cyan gradient | Data highlight, signal emphasis |

### Risk

| Token                   |     Value | Usage          |
| ----------------------- | --------: | -------------- |
| `text-gp-risk-healthy`  | `#22C55E` | Healthy state  |
| `text-gp-risk-watch`    | `#EAB308` | Watch state    |
| `text-gp-risk-risky`    | `#F97316` | Risky state    |
| `text-gp-risk-critical` | `#EF4444` | Critical state |

These tokens also work with `bg-*` and `border-*`.

### Text

| Token                    |     Value | Usage                        |
| ------------------------ | --------: | ---------------------------- |
| `text-gp-text-primary`   | `#F9FAFB` | Main text                    |
| `text-gp-text-secondary` | `#9CA3AF` | Supporting text              |
| `text-gp-text-muted`     | `#6B7280` | Labels and low-emphasis copy |

### Border

| Token                      |     Value | Usage                  |
| -------------------------- | --------: | ---------------------- |
| `border-gp-border`         | `#1F2937` | Default surface border |
| `border-gp-border-divider` | `#374151` | Stronger dividers      |

---

## Semantic CSS Classes

Semantic classes live in `src/styles.css` under `@layer components`.

Use them for repeated UI patterns:

| Class                 | Usage                              |
| --------------------- | ---------------------------------- |
| `gp-app`              | Full app background and text shell |
| `gp-sidebar`          | Desktop sidebar container          |
| `gp-topbar`           | Mobile topbar container            |
| `gp-main`             | Main content offset for sidebar    |
| `gp-page`             | Page width and padding             |
| `gp-content-header`   | Responsive page/detail header row  |
| `gp-header-actions`   | Responsive header action group     |
| `gp-control-grid`     | Responsive analysis control row    |
| `gp-control-action`   | Responsive action in control grids |
| `gp-status-row`       | Responsive inline status panel     |
| `gp-nav-item`         | Sidebar navigation item            |
| `gp-nav-item-active`  | Active sidebar item                |
| `gp-tabs`             | Tabs container                     |
| `gp-tab`              | Tab item                           |
| `gp-tab-active`       | Active tab item                    |
| `gp-button`           | Base button style                  |
| `gp-button-primary`   | Primary button variant             |
| `gp-button-secondary` | Secondary button variant           |
| `gp-button-ghost`     | Ghost button variant               |
| `gp-button-danger`    | Destructive action variant         |
| `gp-badge`            | Base badge style                   |
| `gp-badge-neutral`    | Neutral badge tone                 |
| `gp-badge-brand`      | Brand badge tone                   |
| `gp-badge-healthy`    | Healthy status badge               |
| `gp-badge-watch`      | Watch status badge                 |
| `gp-badge-risky`      | Risky status badge                 |
| `gp-badge-critical`   | Critical status badge              |
| `gp-input`            | Input field                        |
| `gp-table-wrap`       | Table outer container              |
| `gp-table`            | Table base style                   |
| `gp-surface`          | Standard card surface              |
| `gp-surface-dashed`   | Empty/placeholder card surface     |
| `gp-panel`            | Nested panel surface               |
| `gp-empty-state`      | Empty state layout                 |
| `gp-kicker`           | Small uppercase section label      |
| `gp-heading`          | Primary heading color              |
| `gp-text-secondary`   | Supporting text                    |
| `gp-text-muted`       | Muted text                         |
| `gp-alert-critical`   | Critical inline alert              |
| `gp-spinner`          | Spinning loading indicator         |
| `gp-loading-overlay`  | Semi-transparent loading overlay   |

---

## Component Inventory

### Layout Components

| Component  | Path                                 | Purpose               |
| ---------- | ------------------------------------ | --------------------- |
| `AppShell` | `src/components/layout/AppShell.tsx` | Root app frame        |
| `Sidebar`  | `src/components/layout/Sidebar.tsx`  | Desktop navigation    |
| `Topbar`   | `src/components/layout/Topbar.tsx`   | Mobile top navigation |

Import from:

```ts
import { AppShell, Sidebar, Topbar } from "../../components/layout";
```

### UI Components

| Component            | Path                                       | Purpose                                           |
| -------------------- | ------------------------------------------ | ------------------------------------------------- |
| `Button`             | `src/components/ui/Button.tsx`             | Standard actions                                  |
| `Badge`              | `src/components/ui/Badge.tsx`              | Status and signal labels                          |
| `Card`               | `src/components/ui/Card.tsx`               | Base surface container                            |
| `StatCard`           | `src/components/ui/StatCard.tsx`           | Metric summary card                               |
| `Table`              | `src/components/ui/Table.tsx`              | Typed data table                                  |
| `Tabs`               | `src/components/ui/Tabs.tsx`               | Tab navigation                                    |
| `Input`              | `src/components/ui/Input.tsx`              | Text input                                        |
| `EmptyState`         | `src/components/ui/EmptyState.tsx`         | Empty content state                               |
| `Spinner`            | `src/components/ui/Spinner.tsx`            | Loading indicator                                 |
| `DetailPanel`        | `src/components/ui/DetailPanel.tsx`        | Detail section with header and body               |
| `PageHeader`         | `src/components/ui/PageHeader.tsx`         | Page title, description, actions                  |
| `AnalysisBasisPanel` | `src/components/ui/AnalysisBasisPanel.tsx` | Analysis context panel with settings action       |
| `InfoGrid`           | `src/components/ui/InfoGrid.tsx`           | Key-value panel grid for detail sections          |
| `TruncatedCell`      | `src/components/ui/TruncatedCell.tsx`      | Truncated text with hover tooltip for table cells |

Import from:

```ts
import {
  AnalysisBasisPanel,
  Badge,
  Button,
  Card,
  DetailPanel,
  EmptyState,
  InfoGrid,
  Input,
  PageHeader,
  StatCard,
  Table,
  Tabs,
  TruncatedCell,
} from "../../components/ui";
```

### Shared Hooks and Utilities

| Module                   | Path                                  | Purpose                                                 |
| ------------------------ | ------------------------------------- | ------------------------------------------------------- |
| `useAnalysisPageContext` | `src/hooks/useAnalysisPageContext.ts` | Shared store selectors + headSha + repository overrides |
| `statValue`              | `src/lib/analysis-helpers.ts`         | `!hasWorkspace ? na : isLoading ? "..." : value` helper |
| `riskTone`               | `src/lib/analysis-helpers.ts`         | Maps risk level string to `BadgeTone`                   |
| `couplingTone`           | `src/lib/analysis-helpers.ts`         | Maps coupling signal string to `BadgeTone`              |

Import from:

```ts
import { useAnalysisPageContext } from "../../hooks/useAnalysisPageContext";
import { statValue, riskTone, couplingTone } from "../../lib/analysis-helpers";
```

### Chart Components

| Component    | Path                                   | Purpose                                    |
| ------------ | -------------------------------------- | ------------------------------------------ |
| `ChartCard`  | `src/components/charts/ChartCard.tsx`  | Chart container with title and empty state |
| `EmptyChart` | `src/components/charts/EmptyChart.tsx` | Backward-compatible empty chart wrapper    |

Import from:

```ts
import { ChartCard } from "../../components/charts";
```

---

## Usage Examples

### Page Header

```tsx
<PageHeader
  kicker="GitPulse"
  title="코드 뒤에 숨은 신호"
  description="Git 히스토리에서 변화, 소유권, 활동 흐름, 배포 안정성의 신호를 읽습니다."
  actions={<Button variant="secondary">Select workspace</Button>}
/>
```

### Stat Cards

```tsx
<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  <StatCard label="Commits" value="128" detail="Analyzed history" tone="brand" />
  <StatCard label="Hotspots" value="7" detail="High-change files" tone="watch" />
  <StatCard label="Risk" value="low" detail="Delivery signal" tone="healthy" />
</section>
```

### Detail Panel With Table

```tsx
<DetailPanel title="Repository details" description="Analysis controls for the current repository.">
  <Table
    columns={[
      { key: "path", header: "File", render: (row) => row.path },
      { key: "changes", header: "Changes", align: "right", render: (row) => row.changes },
    ]}
    rows={rows}
    getRowKey={(row) => row.path}
    emptyText="No hotspot data yet."
  />
</DetailPanel>
```

### Tabs

```tsx
<Tabs
  items={[
    { id: "30d", label: "30d" },
    { id: "90d", label: "90d" },
    { id: "all", label: "All" },
  ]}
  value="30d"
  onChange={(value) => setPeriod(value)}
/>
```

### Chart Card

```tsx
<ChartCard title="Activity trend" />
```

---

## Interaction Patterns

These patterns are now implemented in the app and should be reused.

### Progressive Disclosure

- Do not keep every secondary control open by default.
- Keep the first screen focused on the current repository state and the next likely action.
- Move comparison history, export options, diagnostic tools, and dense filters behind tabs or an explicit reveal action.
- Use section tabs for large settings surfaces such as `General`, `Repository`, and `Advanced`.
- In investigation pages, keep summary metrics visible and hide deep filters until the user asks for them.

### Overview and Settings Flow

- `Overview` is the execution surface for repository selection, branch control, remote checks, and analysis refresh.
- `Settings` is the configuration surface for signal defaults, repository scope, repository overrides, and persistence visibility.
- When a user needs to move between the two, use direct actions such as `Open settings`, `Adjust settings`, or `Open Overview`.

### Analysis Page Context

- Every analysis page should expose an `Analysis basis` panel near the top of the page.
- This panel should use `DetailPanel` with `gp-panel` summary cells for the active repository context.
- At minimum, show the current repository and branch. Add analysis window, configured filters, or visible row counts when they materially explain the page result.
- When a page depends on settings interpretation, include an `Open settings` action in the panel header instead of creating a separate settings callout elsewhere.

### Error States

- Runtime failures should render a full-page error surface inside the existing app shell rather than collapsing to a blank screen.
- Use `PageHeader` + `DetailPanel` + `gp-panel` blocks for error summary and debug details.
- The error page should show the current page, failure type, error message, and stack information when available.
- Keep recovery actions close to the summary: `Retry page` first, and an escape action such as `Go to overview` when the current page may remain broken.

### Summary Panels

- Use `gp-panel` for compact summary blocks that show one label and one short value.
- Use `gp-status-row` for two-part status layouts where the left side explains the current state and the right side shows a `Badge`.
- Use `gp-header-actions` whenever a panel header needs more than one action or mixed controls such as a button plus tabs.

### Editable Settings Layout

- Do not place interactive form fields inside dense data tables.
- For editable settings, prefer `DetailPanel` + `gp-panel` groups with:
  - a kicker or label
  - one input group
  - one short help line
- Keep dense side-by-side settings layouts at `xl` and below that collapse to a single column.

### Inline Feedback

- Short-lived action feedback in settings should appear inline inside the owning section.
- Use plain supporting text for these messages and clear them automatically after a short delay.
- Do not add toast UI until the product needs cross-page notifications.

### Terminology

- In user-facing English copy, prefer `repository` over `workspace`.
- In user-facing Korean copy, prefer `저장소`.
- Internal variable and API names may still use `workspacePath` where that matches the data model, but visible labels and descriptions should use the repository terminology.

---

## Implementation Rules

- Prefer components from `src/components/ui`, `src/components/layout`, and `src/components/charts`.
- Use Tailwind layout utilities for spacing and grids.
- Use `gp-*` semantic classes for repeated UI patterns.
- Treat the Tauri minimum window width as a desktop dashboard constraint: keep dense 3-4 column content grids at `xl` so the sidebar does not compress cards at the minimum window size.
- Use direct `bg-gp-*`, `text-gp-*`, and `border-gp-*` tokens only when a semantic class does not exist yet.
- Do not introduce a new color without adding it to the GitPulse color system first.
- Use risk tones only for actual health, warning, risk, or critical signals.
- Use tables for read-heavy structured data, not for editable settings forms.
- When a section depends on repository selection, explain the blocked reason in the section body instead of only disabling the action.
- For primary user journeys, provide a direct adjacent action to the next step rather than expecting sidebar navigation.

---

## Current Gaps

The current system is a foundation. It does not yet include:

- Real chart implementations
- Modal/dialog components
- Form field grouping and validation messaging
- Loading skeletons (basic spinner and overlay implemented; full skeleton placeholders pending)
- Toast notifications

Add these only when a feature needs them.
