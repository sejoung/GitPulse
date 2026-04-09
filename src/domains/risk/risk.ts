export type RiskLevel = "low" | "medium" | "high";

export type RiskSignal = {
  level: RiskLevel;
  reason: string;
};
