import type { ReactNode } from "react";

export type InfoGridItem = {
  label: string;
  value: ReactNode;
  breakWords?: boolean;
};

type InfoGridProps = {
  items: InfoGridItem[];
  columns?: string;
  className?: string;
};

export function InfoGrid({
  items,
  columns = "md:grid-cols-2 xl:grid-cols-4",
  className,
}: InfoGridProps) {
  return (
    <div className={`grid gap-3 ${columns} ${className ?? ""}`}>
      {items.map((item) => (
        <div key={item.label} className="gp-panel min-w-0 p-3">
          <p className="gp-kicker">{item.label}</p>
          <p className={`gp-text-secondary mt-1 text-sm ${item.breakWords ? "break-words" : ""}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
