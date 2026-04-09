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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="gp-heading text-base font-semibold">{title}</h2>
          {description ? <p className="gp-text-secondary mt-1 text-sm">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}
