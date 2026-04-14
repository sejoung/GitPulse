import type { ReactNode } from "react";

type TableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
  className?: string;
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  emptyText?: string;
};

export function Table<T>({ columns, rows, getRowKey, emptyText = "No data yet." }: TableProps<T>) {
  return (
    <div className="gp-table-wrap">
      <table className="gp-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`${column.align === "right" ? "text-right" : "text-left"} ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <tr key={getRowKey(row, index)}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`${column.align === "right" ? "text-right" : "text-left"} ${column.className ?? ""}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center text-gp-text-muted">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
