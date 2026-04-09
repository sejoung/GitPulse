import type { ReactNode } from "react";
import { Card, EmptyState } from "../ui";

type ChartCardProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  emptyText?: string;
};

export function ChartCard({
  title,
  description,
  children,
  emptyText = "Git history signals will appear here.",
}: ChartCardProps) {
  return (
    <Card dashed className="p-6">
      <div>
        <h2 className="gp-heading text-base font-semibold">{title}</h2>
        {description ? <p className="gp-text-secondary mt-1 text-sm">{description}</p> : null}
      </div>
      {children ? (
        <div className="mt-6">{children}</div>
      ) : (
        <EmptyState className="mt-6" title={emptyText} />
      )}
    </Card>
  );
}
