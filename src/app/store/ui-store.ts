import { create } from "zustand";

export type NavigationItem =
  | "workspace"
  | "overview"
  | "hotspots"
  | "ownership"
  | "activity"
  | "delivery-risk"
  | "settings";

type UiState = {
  activeItem: NavigationItem;
  setActiveItem: (item: NavigationItem) => void;
};

export const useUiStore = create<UiState>((set) => ({
  activeItem: "overview",
  setActiveItem: (activeItem) => set({ activeItem }),
}));
