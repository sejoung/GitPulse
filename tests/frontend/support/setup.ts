import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom v29+ requires --localstorage-file for localStorage.
// Provide an in-memory polyfill so tests can use localStorage normally.
if (typeof window !== "undefined" && !isLocalStorageFunctional()) {
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (index: number) => [...store.keys()][index] ?? null,
    },
    writable: true,
  });
}

function isLocalStorageFunctional(): boolean {
  try {
    window.localStorage.setItem("__test__", "1");
    window.localStorage.removeItem("__test__");
    return true;
  } catch {
    return false;
  }
}

afterEach(() => {
  cleanup();
});
