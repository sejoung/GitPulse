import { expect, test } from "@playwright/test";

test("persists settings changes to local storage", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.setItem(
      "gitpulse.ui",
      JSON.stringify({
        state: {
          activeItem: "settings",
          language: "en",
          developerMode: false,
          workspacePath: "/mock/repository",
          selectedBranch: "",
          analysisPeriod: "1y",
          excludedPaths: "dist/, node_modules/, target/",
          defaultBranch: "main",
          bugKeywords: "fix, bug, broken",
          emergencyPatterns: [
            { pattern: "revert", signal: "Normal recovery" },
            { pattern: "hotfix", signal: "Watch release pressure" },
            { pattern: "emergency", signal: "Emergency response" },
            { pattern: "rollback", signal: "Rollback pattern" },
          ],
          rememberLastRepository: true,
          repositoryOverrides: {},
          analysisRuns: [],
          dismissedUpdateVersion: "",
          riskThresholds: {
            hotspotRiskyChanges: 20,
            hotspotRiskyFixes: 5,
            hotspotWatchChanges: 10,
            hotspotWatchFixes: 3,
            deliveryRiskyCount: 6,
            deliveryWatchCount: 2,
            ownershipWatchPercent: 60,
          },
        },
        version: 7,
      })
    );
    window.localStorage.setItem("gitpulse.language", "en");
  });
  await page.reload();

  await page.getByRole("tab", { name: "General" }).click();
  await page.getByRole("tab", { name: "한국어" }).click();

  await page.getByRole("tab", { name: "고급" }).click();
  await page.getByRole("tab", { name: "켬" }).last().click();
  await expect(page.getByRole("button", { name: "디버그 요약 복사" })).toBeVisible();
  await page.waitForFunction(() => {
    const rawState = window.localStorage.getItem("gitpulse.ui");
    const language = window.localStorage.getItem("gitpulse.language");
    if (!rawState || language !== "ko") {
      return false;
    }

    const parsed = JSON.parse(rawState) as {
      state?: { language?: string; developerMode?: boolean };
    };

    return parsed.state?.language === "ko" && parsed.state?.developerMode === true;
  });

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const rawState = window.localStorage.getItem("gitpulse.ui");
        const language = window.localStorage.getItem("gitpulse.language");
        if (!rawState) {
          return null;
        }

        const parsed = JSON.parse(rawState) as {
          state?: { language?: string; developerMode?: boolean };
        };

        return {
          language,
          storedLanguage: parsed.state?.language ?? null,
          developerMode: parsed.state?.developerMode ?? null,
        };
      })
    )
    .toEqual({
      language: "ko",
      storedLanguage: "ko",
      developerMode: true,
    });
});
