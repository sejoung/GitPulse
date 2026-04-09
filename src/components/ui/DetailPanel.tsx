import type { ReactNode } from "react";
import { Card } from "./Card";

type DetailPanelProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function DetailPanel({ title, description, actions, children }: DetailPanelProps) {
  return (
    <Card className="p-5">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="gp-heading text-base font-semibold">{title}</h2>
          {description ? <p className="gp-text-secondary mt-1 text-sm">{description}</p> : null}
        </div>
        {actions ? (
          <div className="flex max-w-full flex-wrap items-center gap-2 lg:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}
