import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "div";
  dashed?: boolean;
};

export function Card({ as: Component = "section", dashed = false, className, ...props }: CardProps) {
  return (
    <Component
      className={cn(dashed ? "gp-surface-dashed" : "gp-surface", className)}
      {...props}
    />
  );
}
