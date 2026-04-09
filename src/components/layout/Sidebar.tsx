import { useUiStore } from "../../app/store/ui-store";
import type { NavigationItem } from "../../app/store/ui-store";
import { cn } from "../../lib/cn";

export type SidebarItem = {
  id: NavigationItem;
  label: string;
};

type SidebarProps = {
  items: readonly SidebarItem[];
};

export function Sidebar({ items }: SidebarProps) {
  const { activeItem, setActiveItem } = useUiStore();

  return (
    <aside className="gp-sidebar">
      <img src="/icons/gitpulse_logo_dark.svg" alt="GitPulse" className="mb-8 w-44" />
      <nav className="space-y-1">
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
    </aside>
  );
}
