import { Card } from "./Card";
import { cn } from "../../lib/cn";

type StatTone = "neutral" | "brand" | "healthy" | "watch" | "risky" | "critical";
type StatValueSize = "md" | "lg";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: StatTone;
  valueSize?: StatValueSize;
};

const toneClass: Record<StatTone, string> = {
  neutral: "text-gp-text-primary",
  brand: "text-gp-brand-cyan",
  healthy: "text-gp-risk-healthy",
  watch: "text-gp-risk-watch",
  risky: "text-gp-risk-risky",
  critical: "text-gp-risk-critical",
};

const valueSizeClass: Record<StatValueSize, string> = {
  md: "text-base leading-6 break-words",
  lg: "text-3xl leading-tight",
};

export function StatCard({
  label,
  value,
  detail,
  tone = "neutral",
  valueSize = "lg",
}: StatCardProps) {
  return (
    <Card as="article" className="p-4">
      <p className="gp-text-muted text-sm font-medium">{label}</p>
      <p className={cn("mt-2 font-semibold", toneClass[tone], valueSizeClass[valueSize])}>
        {value}
      </p>
      <p className="gp-text-secondary mt-2 text-sm">{detail}</p>
    </Card>
  );
}
