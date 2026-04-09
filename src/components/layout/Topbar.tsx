import type { ReactNode } from "react";

type TopbarProps = {
  title?: string;
  actions?: ReactNode;
};

export function Topbar({ title = "GitPulse", actions }: TopbarProps) {
  return (
    <header className="gp-topbar">
      <div className="flex items-center gap-3">
        <img src="/icons/gitpulse_icon_dark.svg" alt="" className="h-8 w-8" />
        <span className="text-sm font-semibold text-gp-text-primary md:hidden">{title}</span>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
