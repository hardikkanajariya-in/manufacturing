"use client";

import { useMemo } from "react";
import { useManufacturing } from "@/context/manufacturing-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StockMovementTable } from "@/components/inventory/stock-movement-table";
import { formatCurrency } from "@/lib/helpers";

export function RawMaterialLedger() {
  const { materials, stockMovements } = useManufacturing();

  const rawMovements = useMemo(
    () => stockMovements.filter((m) => m.inventoryKind === "raw"),
    [stockMovements]
  );

  const totalValue = useMemo(
    () => materials.reduce((sum, m) => sum + m.availableStock * m.unitCost, 0),
    [materials]
  );

  const lowStock = useMemo(
    () => materials.filter((m) => m.availableStock <= m.minimumStock),
    [materials]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Raw materials on hand (value)</CardDescription>
            <CardTitle className="font-mono text-3xl">{formatCurrency(totalValue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Materials below minimum stock</CardDescription>
            <CardTitle className="font-mono text-3xl text-amber-600">{lowStock.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Raw material inflow &amp; outflow</CardTitle>
          <CardDescription>
            Purchases add stock in; production runs consume materials out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockMovementTable
            movements={rawMovements}
            inventoryKind="raw"
            emptyMessage="No raw material movements yet. Record a purchase or production run to see the ledger."
          />
        </CardContent>
      </Card>
    </div>
  );
}
