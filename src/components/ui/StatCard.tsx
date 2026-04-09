import { Card } from "./Card";

type StatTone = "neutral" | "brand" | "healthy" | "watch" | "risky" | "critical";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: StatTone;
};

const toneClass: Record<StatTone, string> = {
  neutral: "text-gp-text-primary",
  brand: "text-gp-brand-cyan",
  healthy: "text-gp-risk-healthy",
  watch: "text-gp-risk-watch",
  risky: "text-gp-risk-risky",
  critical: "text-gp-risk-critical",
};

export function StatCard({ label, value, detail, tone = "neutral" }: StatCardProps) {
  return (
    <Card as="article" className="p-4">
      <p className="gp-text-muted text-sm font-medium">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${toneClass[tone]}`}>{value}</p>
      <p className="gp-text-secondary mt-2 text-sm">{detail}</p>
    </Card>
  );
}
