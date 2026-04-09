import { open } from "@tauri-apps/plugin-dialog";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../app/store/ui-store";

export function useWorkspacePrompt() {
  const { t } = useTranslation("workspace");
  const workspacePath = useUiStore((state) => state.workspacePath);
  const setWorkspacePath = useUiStore((state) => state.setWorkspacePath);
  const setSelectedBranch = useUiStore((state) => state.setSelectedBranch);

  return async function selectWorkspace() {
    if ("__TAURI_INTERNALS__" in window) {
      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: t("current.prompt"),
      });

      if (typeof selectedPath === "string") {
        setWorkspacePath(selectedPath);
        setSelectedBranch("");
      }

      return;
    }

    const nextPath = window.prompt(t("current.prompt"), workspacePath);

    if (nextPath === null) {
      return;
    }
    setWorkspacePath(nextPath.trim());
    setSelectedBranch("");
  };
}
