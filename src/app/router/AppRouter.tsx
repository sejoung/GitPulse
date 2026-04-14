import { AppErrorBoundary } from "../error/AppErrorBoundary";
import { AppShell } from "../../components/layout/AppShell";
import { useUiStore } from "../store/ui-store";
import { ActivityPage } from "../../features/activity/ActivityPage";
import { CoChangePage } from "../../features/cochange/CoChangePage";
import { CollaborationPage } from "../../features/collaboration/CollaborationPage";
import { DeliveryRiskPage } from "../../features/delivery-risk/DeliveryRiskPage";
import { HotspotsPage } from "../../features/hotspots/HotspotsPage";
import { OverviewPage } from "../../features/overview/OverviewPage";
import { OwnershipPage } from "../../features/ownership/OwnershipPage";
import { SettingsPage } from "../../features/settings/SettingsPage";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

function ActivePage() {
  const activeItem = useUiStore((state) => state.activeItem);

  switch (activeItem) {
    case "hotspots":
      return <HotspotsPage />;
    case "ownership":
      return <OwnershipPage />;
    case "activity":
      return <ActivityPage />;
    case "delivery-risk":
      return <DeliveryRiskPage />;
    case "cochange":
      return <CoChangePage />;
    case "collaboration":
      return <CollaborationPage />;
    case "settings":
      return <SettingsPage />;
    case "overview":
    default:
      return <OverviewPage />;
  }
}

export function AppRouter() {
  useKeyboardShortcuts();

  return (
    <AppShell>
      <AppErrorBoundary>
        <ActivePage />
      </AppErrorBoundary>
    </AppShell>
  );
}
