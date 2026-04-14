import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAppUpdate } from "../../features/overview/useAppUpdate";
import { useUiStore } from "../../app/store/ui-store";
import { Badge, Button } from "../ui";

export function UpdateBanner() {
  const { t } = useTranslation("common");
  const { data } = useAppUpdate();
  const dismissedVersion = useUiStore((s) => s.dismissedUpdateVersion);
  const dismiss = useUiStore((s) => s.setDismissedUpdateVersion);

  if (!data?.hasUpdate || dismissedVersion === data.latestVersion) {
    return null;
  }

  return (
    <div className="gp-status-row mx-4 mb-4 mt-4 sm:mx-5 md:mx-6 xl:mx-8">
      <div className="flex items-center gap-2">
        <Badge tone="brand">{t("status.ready")}</Badge>
        <p className="text-sm text-gp-text-secondary">
          {t("update.newVersion", { version: data.latestVersion })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => void openUrl(data.downloadUrl)}>
          {t("update.download")}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => dismiss(data.latestVersion)}>
          {t("update.dismiss")}
        </Button>
      </div>
    </div>
  );
}
