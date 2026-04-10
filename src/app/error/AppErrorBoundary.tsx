import type { ErrorInfo, PropsWithChildren, ReactNode } from "react";
import { Component } from "react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../store/ui-store";
import { Badge, Button, DetailPanel, PageHeader } from "../../components/ui";
import { appendAppLog, openLogFile } from "../../services/tauri/app-log";

type BoundaryState = {
  error: Error | null;
  componentStack: string;
  eventLabel: string | null;
};

function normalizeUnknownError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === "string" ? error : "Unknown application error");
}

function AppErrorFallback({
  error,
  componentStack,
  eventLabel,
  onReset,
}: {
  error: Error;
  componentStack: string;
  eventLabel: string | null;
  onReset: () => void;
}) {
  const { t } = useTranslation(["common"]);
  const activeItem = useUiStore((state) => state.activeItem);
  const setActiveItem = useUiStore((state) => state.setActiveItem);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("errorBoundary.kicker")}
        title={t("errorBoundary.title")}
        description={t("errorBoundary.description")}
        actions={<Badge tone="critical">{t("errorBoundary.badge")}</Badge>}
      />

      <DetailPanel
        title={t("errorBoundary.summary.title")}
        description={t("errorBoundary.summary.description")}
        actions={
          <div className="gp-header-actions">
            <Button variant="secondary" onClick={() => void openLogFile()}>
              {t("errorBoundary.actions.showLog")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setActiveItem("overview");
                onReset();
              }}
            >
              {t("errorBoundary.actions.goOverview")}
            </Button>
            <Button variant="primary" onClick={onReset}>
              {t("errorBoundary.actions.retry")}
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("errorBoundary.summary.page")}</p>
            <p className="gp-text-secondary mt-1 text-sm">
              {t(`nav.${activeItem === "delivery-risk" ? "deliveryRisk" : activeItem}`)}
            </p>
          </div>
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("errorBoundary.summary.type")}</p>
            <p className="gp-text-secondary mt-1 text-sm">
              {eventLabel ?? t("errorBoundary.summary.render")}
            </p>
          </div>
          <div className="gp-panel min-w-0 p-3 md:col-span-2">
            <p className="gp-kicker">{t("errorBoundary.summary.message")}</p>
            <p className="gp-text-secondary mt-1 break-words text-sm">{error.message}</p>
          </div>
        </div>
      </DetailPanel>

      <DetailPanel
        title={t("errorBoundary.details.title")}
        description={t("errorBoundary.details.description")}
      >
        <div className="space-y-3">
          <div className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{t("errorBoundary.details.error")}</p>
            <pre className="gp-text-secondary mt-2 overflow-x-auto whitespace-pre-wrap break-words text-sm">
              {error.stack ?? error.message}
            </pre>
          </div>
          {componentStack ? (
            <div className="gp-panel min-w-0 p-3">
              <p className="gp-kicker">{t("errorBoundary.details.componentStack")}</p>
              <pre className="gp-text-secondary mt-2 overflow-x-auto whitespace-pre-wrap break-words text-sm">
                {componentStack.trim()}
              </pre>
            </div>
          ) : null}
        </div>
      </DetailPanel>
    </div>
  );
}

class BoundaryRoot extends Component<
  PropsWithChildren<{
    fallback: (state: BoundaryState, reset: () => void) => ReactNode;
  }>,
  BoundaryState
> {
  state: BoundaryState = {
    error: null,
    componentStack: "",
    eventLabel: null,
  };

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return {
      error,
      eventLabel: "Render error",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    void appendAppLog("error", "frontend:render", "Render error captured", {
      error: error.message,
      componentStack: errorInfo.componentStack ?? "",
    }).catch(() => undefined);
    this.setState({
      error,
      componentStack: errorInfo.componentStack ?? "",
      eventLabel: "Render error",
    });
  }

  componentDidMount() {
    window.addEventListener("error", this.handleWindowError);
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener("error", this.handleWindowError);
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  handleWindowError = (event: ErrorEvent) => {
    void appendAppLog("error", "frontend:window", "Window error captured", {
      message: event.message,
      error: event.error instanceof Error ? event.error.message : String(event.error ?? ""),
    }).catch(() => undefined);
    this.setState({
      error: normalizeUnknownError(event.error ?? event.message),
      componentStack: "",
      eventLabel: "Window error",
    });
  };

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    void appendAppLog("error", "frontend:promise", "Unhandled promise rejection captured", {
      reason:
        event.reason instanceof Error ? event.reason.message : String(event.reason ?? "unknown"),
    }).catch(() => undefined);
    this.setState({
      error: normalizeUnknownError(event.reason),
      componentStack: "",
      eventLabel: "Unhandled promise rejection",
    });
  };

  reset = () => {
    this.setState({
      error: null,
      componentStack: "",
      eventLabel: null,
    });
  };

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state, this.reset);
    }

    return this.props.children;
  }
}

export function AppErrorBoundary({ children }: PropsWithChildren) {
  return (
    <BoundaryRoot
      fallback={(state, reset) => (
        <AppErrorFallback
          error={state.error ?? new Error("Unknown application error")}
          componentStack={state.componentStack}
          eventLabel={state.eventLabel}
          onReset={reset}
        />
      )}
    >
      {children}
    </BoundaryRoot>
  );
}
