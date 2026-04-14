import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUiStore, type NavigationItem } from "../store/ui-store";
import { useWorkspacePrompt } from "../../features/workspace/useWorkspacePrompt";

const pageKeyMap: Record<string, NavigationItem> = {
  "1": "overview",
  "2": "hotspots",
  "3": "ownership",
  "4": "activity",
  "5": "delivery-risk",
  "6": "cochange",
  "7": "collaboration",
  "8": "staleness",
};

function isInputFocused() {
  const tag = document.activeElement?.tagName;

  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function useKeyboardShortcuts() {
  const setActiveItem = useUiStore((state) => state.setActiveItem);
  const queryClient = useQueryClient();
  const selectWorkspace = useWorkspacePrompt();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (isInputFocused()) {
        return;
      }

      const key = event.key.toLowerCase();

      const navTarget = pageKeyMap[key];
      if (navTarget) {
        event.preventDefault();
        setActiveItem(navTarget);
        return;
      }

      if (key === "r") {
        event.preventDefault();
        void queryClient.invalidateQueries({ queryKey: ["repository-state"] });
        void queryClient.invalidateQueries({ queryKey: ["overview"] });
        void queryClient.invalidateQueries({ queryKey: ["hotspots"] });
        void queryClient.invalidateQueries({ queryKey: ["ownership"] });
        void queryClient.invalidateQueries({ queryKey: ["activity"] });
        void queryClient.invalidateQueries({ queryKey: ["delivery-risk"] });
        void queryClient.invalidateQueries({ queryKey: ["cochange"] });
        void queryClient.invalidateQueries({ queryKey: ["collaboration"] });
        void queryClient.invalidateQueries({ queryKey: ["staleness"] });
        return;
      }

      if (key === "s") {
        event.preventDefault();
        setActiveItem("settings");
        return;
      }

      if (key === "o") {
        event.preventDefault();
        void selectWorkspace();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [queryClient, selectWorkspace, setActiveItem]);
}
