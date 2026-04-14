import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enActivity from "./locales/en/activity.json";
import enCochange from "./locales/en/cochange.json";
import enCollaboration from "./locales/en/collaboration.json";
import enCommon from "./locales/en/common.json";
import enStaleness from "./locales/en/staleness.json";
import enDeliveryRisk from "./locales/en/deliveryRisk.json";
import enHotspots from "./locales/en/hotspots.json";
import enOverview from "./locales/en/overview.json";
import enOwnership from "./locales/en/ownership.json";
import enSettings from "./locales/en/settings.json";
import enWorkspace from "./locales/en/workspace.json";
import koActivity from "./locales/ko/activity.json";
import koCochange from "./locales/ko/cochange.json";
import koCollaboration from "./locales/ko/collaboration.json";
import koCommon from "./locales/ko/common.json";
import koStaleness from "./locales/ko/staleness.json";
import koDeliveryRisk from "./locales/ko/deliveryRisk.json";
import koHotspots from "./locales/ko/hotspots.json";
import koOverview from "./locales/ko/overview.json";
import koOwnership from "./locales/ko/ownership.json";
import koSettings from "./locales/ko/settings.json";
import koWorkspace from "./locales/ko/workspace.json";

export const defaultNS = "common";
export const languageStorageKey = "gitpulse.language";
export const defaultLanguage = "en";
export const resources = {
  en: {
    common: enCommon,
    workspace: enWorkspace,
    overview: enOverview,
    hotspots: enHotspots,
    ownership: enOwnership,
    activity: enActivity,
    deliveryRisk: enDeliveryRisk,
    cochange: enCochange,
    collaboration: enCollaboration,
    staleness: enStaleness,
    settings: enSettings,
  },
  ko: {
    common: koCommon,
    workspace: koWorkspace,
    overview: koOverview,
    hotspots: koHotspots,
    ownership: koOwnership,
    activity: koActivity,
    deliveryRisk: koDeliveryRisk,
    cochange: koCochange,
    collaboration: koCollaboration,
    staleness: koStaleness,
    settings: koSettings,
  },
} as const;

const savedLanguage = (() => {
  try {
    return window.localStorage.getItem(languageStorageKey) ?? undefined;
  } catch {
    return undefined;
  }
})();

void i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage ?? defaultLanguage,
  fallbackLng: defaultLanguage,
  supportedLngs: ["ko", "en"],
  defaultNS,
  ns: [
    "common",
    "workspace",
    "overview",
    "hotspots",
    "ownership",
    "activity",
    "deliveryRisk",
    "cochange",
    "collaboration",
    "staleness",
    "settings",
  ],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
