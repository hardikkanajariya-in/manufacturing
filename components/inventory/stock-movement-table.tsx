"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const filtered = inventoryKind
    ? movements.filter((m) => m.inventoryKind === inventoryKind)
    : movements;

  if (filtered.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Balance after</TableHead>
            <TableHead>Reference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell className="whitespace-nowrap text-sm">
                {formatDate(movement.date)}
              </TableCell>
              <TableCell className="font-medium">{movement.itemName}</TableCell>
              <TableCell>
                <Badge
                  variant={movement.direction === "in" ? "default" : "secondary"}
                  className={
                    movement.direction === "in"
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                  }
                >
                  {movement.direction === "in" ? "In" : "Out"} —{" "}
                  {REASON_LABELS[movement.reason]}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {movement.direction === "out" ? "−" : "+"}
                {movement.quantity.toLocaleString()} {movement.unit}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {movement.balanceAfter.toLocaleString()} {movement.unit}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                {movement.referenceLabel ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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
