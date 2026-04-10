import { expect, test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { seedAppState } from "./app-state";
import type { PartialUiState } from "./app-state";
import { seedTauriMocks } from "./tauri-mock";
import type { TauriMockPayload } from "./tauri-mock";

type AppOptions = {
  uiState?: PartialUiState;
  tauriMocks?: TauriMockPayload;
};

type AppFixtures = {
  appPage: Page;
};

export const test = base.extend<AppFixtures & AppOptions>({
  uiState: [undefined, { option: true }],
  tauriMocks: [undefined, { option: true }],
  appPage: async ({ page, uiState, tauriMocks }, runFixture) => {
    if (uiState) {
      await seedAppState(page, uiState);
    }

    if (tauriMocks) {
      await seedTauriMocks(page, tauriMocks);
    }

    await page.goto("/");
    await runFixture(page);
  },
});

export { expect };
