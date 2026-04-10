import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectPersistedUiSettings, useUiStore } from "../store/ui-store";
import {
  loadLocalDatabase,
  saveLocalDatabaseAnalysisRuns,
  saveLocalDatabaseSettings,
} from "../../services/tauri/local-database";
import { appendAppLog } from "../../services/tauri/app-log";
import i18n, { languageStorageKey } from "../../i18n/config";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  const [databaseHydrated, setDatabaseHydrated] = useState(false);
  const hydrateFromDatabase = useUiStore((state) => state.hydrateFromDatabase);
  const persistedSettings = useUiStore(useShallow((state) => selectPersistedUiSettings(state)));
  const analysisRuns = useUiStore((state) => state.analysisRuns);
  const settingsPayload = useMemo(
    () => ({
      ...persistedSettings,
      analysisRuns: undefined,
    }),
    [persistedSettings]
  );

  useEffect(() => {
    let active = true;

    void loadLocalDatabase()
      .then((snapshot) => {
        if (!active) {
          return;
        }

        hydrateFromDatabase({
          ...(snapshot.settings ?? {}),
          analysisRuns: snapshot.analysisRuns,
        });
        if (snapshot.settings?.language) {
          window.localStorage.setItem(languageStorageKey, snapshot.settings.language);
          if (i18n.resolvedLanguage !== snapshot.settings.language) {
            void i18n.changeLanguage(snapshot.settings.language);
          }
        }
      })
      .catch(() => {
        void appendAppLog("error", "frontend:database", "Failed to hydrate local database").catch(
          () => undefined
        );
        if (!active) {
          return;
        }

        hydrateFromDatabase({});
      })
      .finally(() => {
        if (active) {
          setDatabaseHydrated(true);
        }
      });

    return () => {
      active = false;
    };
  }, [hydrateFromDatabase]);

  useEffect(() => {
    if (!databaseHydrated) {
      return;
    }

    void saveLocalDatabaseSettings(settingsPayload).catch((error) => {
      void appendAppLog("error", "frontend:database", "Failed to save local settings", {
        error: error instanceof Error ? error.message : String(error),
      }).catch(() => undefined);
    });
  }, [databaseHydrated, settingsPayload]);

  useEffect(() => {
    if (!databaseHydrated) {
      return;
    }

    void saveLocalDatabaseAnalysisRuns(analysisRuns).catch((error) => {
      void appendAppLog("error", "frontend:database", "Failed to save analysis runs", {
        error: error instanceof Error ? error.message : String(error),
      }).catch(() => undefined);
    });
  }, [analysisRuns, databaseHydrated]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
