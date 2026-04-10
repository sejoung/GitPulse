import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const nodeConfigFiles = ["tailwind.config.ts", "vite.config.ts", "playwright.config.ts"];

export default tseslint.config(
  {
    ignores: [
      "coverage",
      "dist",
      "playwright-report",
      "test-results",
      "eslint.config.js",
      "lint-staged.config.js",
      "postcss.config.js",
      "src-tauri/target",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },
  {
    files: nodeConfigFiles,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unsafe-call": "off",
    },
  }
);
