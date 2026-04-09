import type { ReactNode } from "react";

type PageHeaderProps = {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ kicker, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-2">
        {kicker ? <p className="gp-kicker">{kicker}</p> : null}
        <h1 className="gp-heading text-3xl font-semibold">{title}</h1>
        {description ? <p className="gp-text-secondary max-w-2xl">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex max-w-full flex-wrap items-center gap-2 lg:justify-end">{actions}</div>
      ) : null}
    </header>
  );
}
