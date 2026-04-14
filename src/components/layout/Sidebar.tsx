import { useUiStore } from "../../app/store/ui-store";
import type { NavigationItem } from "../../app/store/ui-store";
import { cn } from "../../lib/cn";
import { useAppUpdate } from "../../features/overview/useAppUpdate";
import { Badge } from "../ui";
import gitpulseLogoDark from "../../../icons/gitpulse_logo_dark.svg";

export type SidebarItem = {
  id: NavigationItem;
  label: string;
};

type SidebarProps = {
  items: readonly SidebarItem[];
};

export function Sidebar({ items }: SidebarProps) {
  const { activeItem, setActiveItem } = useUiStore();
  const { data } = useAppUpdate();

  return (
    <aside className="gp-sidebar flex flex-col">
      <img src={gitpulseLogoDark} alt="GitPulse" className="mb-8 w-44" />
      <nav className="flex-1 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveItem(item.id)}
            className={cn("gp-nav-item", activeItem === item.id && "gp-nav-item-active")}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {data ? (
        <div className="flex items-center gap-2 pt-4">
          <span className="text-xs text-gp-text-muted">v{data.currentVersion}</span>
          {data.hasUpdate ? <Badge tone="brand">New</Badge> : null}
        </div>
      ) : null}
    </aside>
  );
}
