import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table } from "../../src/components/ui/Table";

type TestRow = { id: string; name: string; count: number };

const columns = [
  {
    key: "name",
    header: "Name",
    className: "w-[40%] truncate",
    render: (row: TestRow) => row.name,
  },
  {
    key: "count",
    header: "Count",
    align: "right" as const,
    render: (row: TestRow) => row.count,
  },
];

const rows: TestRow[] = [
  { id: "1", name: "src/very/long/deeply/nested/path/to/some/file.tsx", count: 42 },
  { id: "2", name: "short.ts", count: 7 },
];

describe("Table", () => {
  it("applies className to th and td elements", () => {
    const { container } = render(
      <Table columns={columns} rows={rows} getRowKey={(row) => row.id} />
    );

    const ths = container.querySelectorAll("th");
    expect(ths[0].className).toContain("w-[40%]");
    expect(ths[0].className).toContain("truncate");
    expect(ths[1].className).not.toContain("w-[40%]");

    const tds = container.querySelectorAll("tbody td");
    expect(tds[0].className).toContain("w-[40%]");
    expect(tds[0].className).toContain("truncate");
    expect(tds[1].className).toContain("text-right");
    expect(tds[1].className).not.toContain("truncate");
  });

  it("renders empty state when no rows", () => {
    render(
      <Table columns={columns} rows={[]} getRowKey={(row) => row.id} emptyText="Nothing here." />
    );

    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("does not break when className is omitted", () => {
    const simpleColumns = [{ key: "name", header: "Name", render: (row: TestRow) => row.name }];

    const { container } = render(
      <Table columns={simpleColumns} rows={rows} getRowKey={(row) => row.id} />
    );

    const th = container.querySelector("th");
    expect(th?.className).not.toContain("undefined");
  });
});
