import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";

type TruncatedCellProps = {
  value: string;
  workspacePath?: string;
};

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

export function TruncatedCell({ value, workspacePath }: TruncatedCellProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
  const [feedback, setFeedback] = useState("");

  function showTooltip() {
    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;

    const rect = el.getBoundingClientRect();
    setTooltip({ x: rect.left, y: rect.top });
  }

  function handleClick() {
    void navigator.clipboard.writeText(value).then(() => {
      showFeedback("Copied");
    });
  }

  function handleDoubleClick(event: React.MouseEvent) {
    event.preventDefault();
    window.getSelection()?.removeAllRanges();

    if (!workspacePath || !isTauriRuntime()) return;

    void invoke<boolean>("reveal_file_in_explorer", {
      workspacePath,
      filePath: value,
    }).then((found) => {
      showFeedback(found ? "Opened" : "Not found");
    });
  }

  function showFeedback(message: string) {
    setFeedback(message);
    setTimeout(() => setFeedback(""), 1500);
  }

  return (
    <>
      <span
        ref={ref}
        className="block cursor-pointer select-none truncate hover:text-gp-brand-cyan"
        title={value}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setTooltip(null)}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {value}
      </span>
      {tooltip
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[9999] max-w-sm break-all rounded bg-gp-bg-secondary px-3 py-2 text-xs text-gp-text-primary shadow-lg ring-1 ring-gp-border"
              style={{ left: tooltip.x, top: tooltip.y - 4, transform: "translateY(-100%)" }}
            >
              {value}
            </div>,
            document.body
          )
        : null}
      {feedback
        ? createPortal(
            <div className="pointer-events-none fixed left-1/2 top-4 z-[9999] -translate-x-1/2 rounded bg-gp-bg-secondary px-3 py-1.5 text-xs font-medium text-gp-brand-cyan shadow-lg ring-1 ring-gp-border">
              {feedback}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
