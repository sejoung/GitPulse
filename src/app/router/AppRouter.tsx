import { AppShell } from "../../components/layout/AppShell";
import { useUiStore } from "../store/ui-store";
import { ActivityPage } from "../../features/activity/ActivityPage";
import { DeliveryRiskPage } from "../../features/delivery-risk/DeliveryRiskPage";
import { HotspotsPage } from "../../features/hotspots/HotspotsPage";
import { OverviewPage } from "../../features/overview/OverviewPage";
import { OwnershipPage } from "../../features/ownership/OwnershipPage";
import { SettingsPage } from "../../features/settings/SettingsPage";
import { WorkspacePage } from "../../features/workspace/WorkspacePage";

function ActivePage() {
  const activeItem = useUiStore((state) => state.activeItem);

  switch (activeItem) {
    case "workspace":
      return <WorkspacePage />;
    case "hotspots":
      return <HotspotsPage />;
    case "ownership":
      return <OwnershipPage />;
    case "activity":
      return <ActivityPage />;
    case "delivery-risk":
      return <DeliveryRiskPage />;
    case "settings":
      return <SettingsPage />;
    case "overview":
    default:
      return <OverviewPage />;
  }
}

export function AppRouter() {
  return (
    <AppShell>
      <ActivePage />
    </AppShell>
  );
}
