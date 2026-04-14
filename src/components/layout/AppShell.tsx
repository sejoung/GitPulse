import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { UpdateBanner } from "./UpdateBanner";

const navItems = [
  { id: "overview", labelKey: "nav.overview" },
  { id: "hotspots", labelKey: "nav.hotspots" },
  { id: "ownership", labelKey: "nav.ownership" },
  { id: "activity", labelKey: "nav.activity" },
  { id: "delivery-risk", labelKey: "nav.deliveryRisk" },
  { id: "settings", labelKey: "nav.settings" },
] as const;

export function AppShell({ children }: PropsWithChildren) {
  const { t } = useTranslation("common");
  const translatedNavItems = navItems.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
  }));

  return (
    <div className="gp-app">
      <Sidebar items={translatedNavItems} />
      <main className="gp-main">
        <Topbar title={t("appName")} />
        <UpdateBanner />
        <div className="gp-page">{children}</div>
      </main>
    </div>
  );
}
