# GitPulse Color System

## Overview

This document defines the color system for GitPulse.

The design is based on:

- Dark-first UI
- Signal-based highlighting
- Minimal but meaningful color usage

---

## 🎯 Design Principles

- Dark background as default
- Use color only for signals (not decoration)
- Emphasize clarity over aesthetics
- Risk levels must be instantly recognizable

---

## 🌌 Background Colors

| Name                 | Value   | Usage                |
| -------------------- | ------- | -------------------- |
| Background Primary   | #0B1220 | Main app background  |
| Background Secondary | #111827 | Cards                |
| Background Tertiary  | #1F2937 | Panels, hover states |

---

## 🔵 Primary Colors

| Name          | Value   | Usage               |
| ------------- | ------- | ------------------- |
| Electric Blue | #3B82F6 | Primary brand color |
| Neon Cyan     | #22D3EE | Signal / highlight  |

### Gradient

```
#3B82F6 → #22D3EE
```

Used for:

- Logo
- Charts
- Highlight signals

---

## ⚠️ Risk Colors

| Level    | Color  | Value   |
| -------- | ------ | ------- |
| Healthy  | Green  | #22C55E |
| Watch    | Yellow | #EAB308 |
| Risky    | Orange | #F97316 |
| Critical | Red    | #EF4444 |

---

## ⚪ Text Colors

| Name           | Value   | Usage     |
| -------------- | ------- | --------- |
| Primary Text   | #F9FAFB | Main text |
| Secondary Text | #9CA3AF | Sub text  |
| Muted Text     | #6B7280 | Labels    |

---

## 🔳 Border / Divider

| Name    | Value   |
| ------- | ------- |
| Border  | #1F2937 |
| Divider | #374151 |

---

## 🎨 Usage Guidelines

### Do

- Use blue/cyan for signals and data
- Use risk colors only for warnings
- Keep UI mostly neutral

### Don't

- Do not overuse red/orange
- Do not mix too many colors in charts
- Avoid decorative gradients

---

## 📊 Chart Color Strategy

- Default: Blue scale
- Highlight: Cyan
- Risk overlay: Red/Orange

Example:

- Line chart → Blue
- Highlighted anomaly → Cyan
- Risk spike → Red

---

## 🧠 Visual Identity Summary

GitPulse color system is designed to feel:

- Analytical
- Calm
- Precise
- Signal-focused

---

## 🔥 One-line Definition

> Colors in GitPulse represent signals, not decoration.
