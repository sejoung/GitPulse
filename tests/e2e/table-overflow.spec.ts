import { expect, test } from "./support/fixtures";

const longPath =
  "src/features/very-long-directory-name/deeply/nested/path/to/some/extremely-long-component-file-name.tsx";

test.use({
  uiState: {
    activeItem: "hotspots",
    workspacePath: "/mock/repository",
    selectedBranch: "main",
  },
  tauriMocks: {
    hotspots: [
      { path: longPath, changes: 42, fixes: 10, risk: "risky" },
      { path: "src/short.ts", changes: 3, fixes: 0, risk: "healthy" },
    ],
  },
});

test("table does not overflow its container with long file paths", async ({ appPage }) => {
  await expect(appPage.getByTitle(longPath)).toBeVisible();

  const overflow = await appPage.evaluate(() => {
    const wrapper = document.querySelector(".gp-table-wrap");
    if (!wrapper) return false;
    return wrapper.scrollWidth > wrapper.clientWidth;
  });

  expect(overflow).toBe(false);
});
