type TruncatedCellProps = {
  value: string;
};

export function TruncatedCell({ value }: TruncatedCellProps) {
  return (
    <span className="group/cell relative block truncate" title={value}>
      {value}
      <span className="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden max-w-xs break-all rounded bg-gp-bg-secondary px-2 py-1 text-xs text-gp-text-primary shadow-lg ring-1 ring-gp-border group-hover/cell:block">
        {value}
      </span>
    </span>
  );
}
