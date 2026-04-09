# GitPulse Project Structure (Tauri + React)

## Overview

This document defines the recommended project structure for GitPulse.

GitPulse is structured around:

- UI (React)
- Domain logic (TypeScript)
- Bridge (Tauri commands)
- Backend (Rust analysis engine)

---

## Directory Structure

```
gitpulse/
├─ src/                         # React app
│  ├─ app/
│  │  ├─ router/
│  │  ├─ providers/
│  │  └─ store/
│  │
│  ├─ features/
│  │  ├─ workspace/
│  │  ├─ overview/
│  │  ├─ hotspots/
│  │  ├─ ownership/
│  │  ├─ activity/
│  │  ├─ delivery-risk/
│  │  └─ settings/
│  │
│  ├─ domains/
│  │  ├─ repository/
│  │  ├─ metrics/
│  │  ├─ risk/
│  │  └─ shared/
│  │
│  ├─ components/
│  │  ├─ ui/
│  │  ├─ charts/
│  │  └─ layout/
│  │
│  ├─ services/
│  │  ├─ tauri/
│  │  ├─ cache/
│  │  └─ logger/
│  │
│  ├─ lib/
│  └─ main.tsx
│
├─ src-tauri/
│  ├─ src/
│  │  ├─ commands/
│  │  ├─ git/
│  │  ├─ analysis/
│  │  ├─ storage/
│  │  └─ models/
│  │
│  ├─ Cargo.toml
│  └─ tauri.conf.json
```

---

## Architecture

### Flow

```
React UI
 → Feature Hooks
 → Tauri API (invoke)
 → Rust Commands
 → Git Data Collection
 → Analysis Engine
 → DTO Response
 → UI Rendering
```

---

## Frontend Principles

- Feature-based structure
- Thin pages, logic in hooks
- Reusable UI components
- Separate domain logic from UI

---

## Backend Principles

### Git Layer

- Executes git commands
- Parses raw output

### Analysis Layer

- Converts raw data into insights
- Calculates metrics and risks

---

## Core Modules

### Commands

- workspace management
- analysis execution

### Git

- churn
- contributors
- activity
- bug hotspots
- emergency events

### Analysis

- hotspot analyzer
- ownership analyzer
- activity analyzer
- delivery analyzer
- risk engine

---

## API Design

Good:

```
get_overview_analysis()
get_hotspots_analysis()
get_ownership_analysis()
```

Bad:

```
get_git_log()
get_git_status()
```

---

## State Management

- React Query → server/cache state
- Zustand → UI state

---

## Cache Strategy

Key:

```
workspace + branch + period + HEAD_SHA
```

---

## Development Order

1. App shell (layout)
2. Workspace selection
3. Overview page
4. Hotspots page
5. Ownership / Activity / Delivery

---

## Tech Stack

- React + TypeScript
- TailwindCSS
- Tauri
- Rust
- Git CLI

---

## Philosophy

> Separate data collection from interpretation.

Git → Raw data  
Analysis → Meaning  
UI → Visualization
