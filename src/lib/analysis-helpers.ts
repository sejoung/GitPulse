import type { BadgeTone } from "../components/ui/Badge";

export function statValue(
  hasWorkspace: boolean,
  isLoading: boolean,
  value: string,
  notAnalyzedLabel = "Not analyzed"
): string {
  if (!hasWorkspace) return notAnalyzedLabel;
  if (isLoading) return "...";
  return value;
}

export function riskTone(risk: string): BadgeTone {
  switch (risk) {
    case "risky":
    case "critical":
      return "risky";
    case "watch":
      return "watch";
    default:
      return "healthy";
  }
}

export function couplingTone(signal: string): BadgeTone {
  switch (signal) {
    case "tight":
      return "risky";
    case "moderate":
      return "watch";
    default:
      return "healthy";
  }
}
