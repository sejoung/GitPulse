import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type BadgeTone = "neutral" | "brand" | "healthy" | "watch" | "risky" | "critical";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClass: Record<BadgeTone, string> = {
  neutral: "gp-badge-neutral",
  brand: "gp-badge-brand",
  healthy: "gp-badge-healthy",
  watch: "gp-badge-watch",
  risky: "gp-badge-risky",
  critical: "gp-badge-critical",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return <span className={cn("gp-badge", toneClass[tone], className)} {...props} />;
}
