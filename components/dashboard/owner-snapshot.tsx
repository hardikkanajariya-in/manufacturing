"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Factory,
  Package,
  ShoppingCart,
  Warehouse,
} from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/helpers";

export function OwnerSnapshot() {
  const { materials, products, productionRecords, sales, stockMovements } = useManufacturing();

  const rawValue = useMemo(
    () => materials.reduce((sum, m) => sum + m.availableStock * m.unitCost, 0),
    [materials]
  );

  const finishedValue = useMemo(
    () => products.reduce((sum, p) => sum + p.finishedStock * p.sellingPrice, 0),
    [products]
  );

  const finishedUnits = useMemo(
    () => products.reduce((sum, p) => sum + p.finishedStock, 0),
    [products]
  );

  const lowRawCount = useMemo(
    () => materials.filter((m) => m.availableStock <= m.minimumStock).length,
    [materials]
  );

  const outOfStockProducts = useMemo(
    () => products.filter((p) => p.finishedStock === 0).length,
    [products]
  );

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7);

  const productionToday = useMemo(
    () =>
      productionRecords
        .filter((r) => r.productionDate === today)
        .reduce((sum, r) => sum + r.quantity, 0),
    [productionRecords, today]
  );

  const salesThisMonth = useMemo(
    () =>
      sales
        .filter((s) => s.saleDate.startsWith(monthStart))
        .reduce((sum, s) => sum + s.totalAmount, 0),
    [sales, monthStart]
  );

  const recentMovements = stockMovements.slice(0, 5);

  const lowRawMaterials = useMemo(
    () =>
      materials
        .filter((m) => m.availableStock <= m.minimumStock)
        .sort((a, b) => a.availableStock - b.availableStock)
        .slice(0, 5),
    [materials]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Business snapshot</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Two inventories at a glance — raw materials and finished goods ready to sell.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-[var(--module-materials)]">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Warehouse className="h-3.5 w-3.5" />
              Raw materials value
            </CardDescription>
            <CardTitle className="font-mono text-2xl">{formatCurrency(rawValue)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            {lowRawCount > 0 ? (
              <span className="text-amber-600">{lowRawCount} below reorder level</span>
            ) : (
              "All materials above reorder level"
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[var(--module-products)]">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Finished goods in warehouse
            </CardDescription>
            <CardTitle className="font-mono text-2xl">
              {finishedUnits.toLocaleString()} units
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Value at sell price: {formatCurrency(finishedValue)}
            {outOfStockProducts > 0 && (
              <span className="ml-1 text-red-600">· {outOfStockProducts} out of stock</span>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[var(--module-production)]">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Factory className="h-3.5 w-3.5" />
              Production today
            </CardDescription>
            <CardTitle className="font-mono text-2xl">
              {productionToday.toLocaleString()} units
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-[var(--module-sales)]">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" />
              Sales this month
            </CardDescription>
            <CardTitle className="font-mono text-2xl">{formatCurrency(salesThisMonth)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {lowRawMaterials.length > 0 && (
          <Card className="border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Reorder needed
              </CardTitle>
              <CardDescription>Raw materials at or below reorder level</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {lowRawMaterials.map((m) => (
                  <li key={m.id} className="flex justify-between">
                    <span>{m.name}</span>
                    <span className="font-mono text-amber-700">
                      {m.availableStock} {m.unit} (min {m.minimumStock})
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/raw-materials?tab=purchases"
                className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4" })}
              >
                Record purchase <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent stock movements</CardTitle>
            <CardDescription>Latest inflow and outflow across both inventories</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMovements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No movements yet. Purchases, production, and sales will appear here.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentMovements.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-2">
                    <span className="min-w-0 truncate">
                      <span
                        className={
                          m.direction === "in" ? "text-emerald-700" : "text-amber-700"
                        }
                      >
                        {m.direction === "in" ? "+" : "−"}
                        {m.quantity} {m.unit}
                      </span>{" "}
                      {m.itemName}
                      <span className="block text-xs text-muted-foreground">
                        {m.inventoryKind === "raw" ? "Raw" : "Warehouse"} ·{" "}
                        {m.referenceLabel}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(m.date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/raw-materials?tab=finished"
              className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4" })}
            >
              View full warehouse ledger <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/production" className={buttonVariants()}>
          Log production
        </Link>
        <Link href="/sales" className={buttonVariants({ variant: "outline" })}>
          Record sale
        </Link>
        <Link href="/reports" className={buttonVariants({ variant: "outline" })}>
          Production &amp; finance reports
        </Link>
      </div>
    </div>
  );
}
