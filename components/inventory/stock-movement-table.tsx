"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn, type DataTableFilter } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import type { InventoryKind, StockMovement } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/helpers";

const REASON_LABELS: Record<StockMovement["reason"], string> = {
  purchase: "Purchase",
  production_consume: "Production (raw used)",
  production_yield: "Production (finished in)",
  sale: "Sale",
  adjustment: "Manual adjustment",
};

interface StockMovementTableProps {
  movements: StockMovement[];
  inventoryKind?: InventoryKind;
  emptyMessage?: string;
}

export function StockMovementTable({
  movements,
  inventoryKind,
  emptyMessage = "No stock movements recorded yet.",
}: StockMovementTableProps) {
  const filteredSource = useMemo(
    () =>
      inventoryKind
        ? movements.filter((m) => m.inventoryKind === inventoryKind)
        : movements,
    [movements, inventoryKind]
  );

  const table = useDataTable<StockMovement>({
    data: filteredSource,
    pageSize: 10,
    initialSort: { columnId: "date", direction: "desc" },
    searchFn: (row, q) =>
      [
        row.itemName,
        row.referenceLabel ?? "",
        REASON_LABELS[row.reason],
        row.direction,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    filterFn: (row, filters) => {
      if (filters.direction && filters.direction !== "all" && row.direction !== filters.direction) {
        return false;
      }
      if (filters.reason && filters.reason !== "all" && row.reason !== filters.reason) {
        return false;
      }
      return true;
    },
    getSortValue: (row, col) => {
      if (col === "date") return new Date(row.date);
      if (col === "item") return row.itemName;
      if (col === "qty") return row.quantity;
      if (col === "balance") return row.balanceAfter;
      return row.referenceLabel ?? "";
    },
  });

  const columns: DataTableColumn<StockMovement>[] = [
    {
      id: "date",
      header: "Date",
      sortable: true,
      cell: (m) => (
        <span className="whitespace-nowrap text-sm">{formatDate(m.date)}</span>
      ),
    },
    {
      id: "item",
      header: "Item",
      sortable: true,
      cell: (m) => <span className="font-medium">{m.itemName}</span>,
    },
    {
      id: "type",
      header: "Type",
      cell: (m) => (
        <Badge
          variant={m.direction === "in" ? "default" : "secondary"}
          className={
            m.direction === "in"
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
              : "bg-amber-100 text-amber-800 hover:bg-amber-100"
          }
        >
          {m.direction === "in" ? "In" : "Out"} — {REASON_LABELS[m.reason]}
        </Badge>
      ),
    },
    {
      id: "qty",
      header: "Qty",
      sortable: true,
      className: "text-right font-mono text-sm",
      headerClassName: "text-right",
      cell: (m) => (
        <>
          {m.direction === "out" ? "−" : "+"}
          {m.quantity.toLocaleString()} {m.unit}
        </>
      ),
    },
    {
      id: "balance",
      header: "Balance after",
      sortable: true,
      className: "text-right font-mono text-sm",
      headerClassName: "text-right",
      cell: (m) => (
        <>
          {m.balanceAfter.toLocaleString()} {m.unit}
        </>
      ),
    },
    {
      id: "reference",
      header: "Reference",
      sortable: true,
      cell: (m) => (
        <span className="max-w-[200px] truncate text-sm text-muted-foreground block">
          {m.referenceLabel ?? "—"}
        </span>
      ),
    },
  ];

  const filters: DataTableFilter[] = [
    {
      id: "direction",
      label: "Direction",
      allLabel: "All directions",
      options: [
        { value: "in", label: "Inflow" },
        { value: "out", label: "Outflow" },
      ],
    },
    {
      id: "reason",
      label: "Reason",
      allLabel: "All reasons",
      options: Object.entries(REASON_LABELS).map(([value, label]) => ({ value, label })),
    },
  ];

  return (
    <DataTable
      table={table}
      columns={columns}
      getRowKey={(m) => m.id}
      searchPlaceholder="Search movements…"
      filters={filters}
      emptyMessage={emptyMessage}
    />
  );
}

export function inventoryValue(
  items: { availableStock?: number; finishedStock?: number; unitCost?: number; sellingPrice?: number }[],
  kind: "raw" | "finished"
): number {
  if (kind === "raw") {
    return items.reduce(
      (sum, item) => sum + (item.availableStock ?? 0) * (item.unitCost ?? 0),
      0
    );
  }
  return items.reduce(
    (sum, item) => sum + (item.finishedStock ?? 0) * (item.sellingPrice ?? 0),
    0
  );
}

export function InventoryValueSummary({
  rawValue,
  finishedValue,
}: {
  rawValue: number;
  finishedValue: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Raw materials value
        </p>
        <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
          {formatCurrency(rawValue)}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Finished goods value
        </p>
        <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
          {formatCurrency(finishedValue)}
        </p>
      </div>
    </div>
  );
}
