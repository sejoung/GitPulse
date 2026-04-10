import type { ReactNode } from "react";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "../../src/i18n/config";
import { AppErrorBoundary } from "../../src/app/error/AppErrorBoundary";
import { useUiStore } from "../../src/app/store/ui-store";
import { renderWithClient } from "./support/render";

function ThrowOnRender(): ReactNode {
  throw new Error("Render failed for test");
}

describe("AppErrorBoundary", () => {
  it("renders a debug page for render failures", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    useUiStore.setState({ activeItem: "hotspots" });

    renderWithClient(
      <AppErrorBoundary>
        <ThrowOnRender />
      </AppErrorBoundary>
    );

    expect(await screen.findByText("GitPulse hit an unexpected error")).toBeInTheDocument();
    expect(screen.getByText("Render failed for test")).toBeInTheDocument();
    expect(screen.getByText("Hotspots")).toBeInTheDocument();
    expect(screen.getByText("Render error")).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it("renders a debug page for unhandled promise rejections", async () => {
    useUiStore.setState({ activeItem: "activity" });

    renderWithClient(
      <AppErrorBoundary>
        <div>child</div>
      </AppErrorBoundary>
    );

    fireEvent(
      window,
      new PromiseRejectionEvent("unhandledrejection", {
        reason: new Error("Unhandled rejection for test"),
        promise: new Promise(() => undefined),
      })
    );

    expect(await screen.findByText("Unhandled rejection for test")).toBeInTheDocument();
    expect(screen.getByText("Unhandled promise rejection")).toBeInTheDocument();
    expect(screen.getByText("Activity")).toBeInTheDocument();
  });
});
