import type { ReactNode } from "react";

type PageHeaderProps = {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ kicker, title, description, actions }: PageHeaderProps) {
  return (
    <header className="gp-content-header">
      <div className="min-w-0 space-y-2">
        {kicker ? <p className="gp-kicker">{kicker}</p> : null}
        <h1 className="gp-heading text-2xl font-semibold md:text-3xl">{title}</h1>
        {description ? <p className="gp-text-secondary max-w-2xl">{description}</p> : null}
      </div>
      {actions ? <div className="gp-header-actions">{actions}</div> : null}
    </header>
  );
}
