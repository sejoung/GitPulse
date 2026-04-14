type SpinnerProps = {
  size?: "sm" | "md";
  label?: string;
};

export function Spinner({ size = "md", label }: SpinnerProps) {
  const sizeClass = size === "sm" ? "h-4 w-4 border-2" : "h-6 w-6 border-2";

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClass} gp-spinner`} />
      {label ? <span className="text-sm text-gp-text-muted">{label}</span> : null}
    </div>
  );
}
