"use client";

import { useMemo } from "react";
import { Package, AlertTriangle } from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockMovementTable } from "@/components/inventory/stock-movement-table";
import { formatCurrency } from "@/lib/helpers";

export function FinishedGoodsWarehouse() {
  const { products, stockMovements } = useManufacturing();

  const finishedMovements = useMemo(
    () => stockMovements.filter((m) => m.inventoryKind === "finished"),
    [stockMovements]
  );

  const totalUnits = useMemo(
    () => products.reduce((sum, p) => sum + p.finishedStock, 0),
    [products]
  );

  const totalValue = useMemo(
    () => products.reduce((sum, p) => sum + p.finishedStock * p.sellingPrice, 0),
    [products]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.finishedStock > 0 && p.finishedStock < 50),
    [products]
  );

  const outOfStock = useMemo(
    () => products.filter((p) => p.finishedStock === 0),
    [products]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Units in warehouse</CardDescription>
            <CardTitle className="font-mono text-3xl">{totalUnits.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inventory value (at sell price)</CardDescription>
            <CardTitle className="font-mono text-3xl">{formatCurrency(totalValue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Products with stock</CardDescription>
            <CardTitle className="font-mono text-3xl">
              {products.filter((p) => p.finishedStock > 0).length}
              <span className="text-lg font-normal text-muted-foreground">
                {" "}
                / {products.length}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {(lowStockProducts.length > 0 || outOfStock.length > 0) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Stock alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {outOfStock.length > 0 && (
              <p>
                <span className="font-medium">{outOfStock.length} product(s)</span> have zero
                warehouse stock — run production before selling.
              </p>
            )}
            {lowStockProducts.length > 0 && (
              <p>
                Low stock:{" "}
                {lowStockProducts.map((p) => `${p.name} (${p.finishedStock})`).join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Current stock levels
          </CardTitle>
          <CardDescription>
            Finished goods ready to sell. Production adds stock in; sales deduct stock out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">In warehouse</TableHead>
                  <TableHead className="text-right">Sell price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {product.finishedStock.toLocaleString()} units
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(product.sellingPrice)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(product.finishedStock * product.sellingPrice)}
                    </TableCell>
                    <TableCell>
                      {product.finishedStock === 0 ? (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          Out of stock
                        </Badge>
                      ) : product.finishedStock < 50 ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          Low
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                          Available
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse inflow &amp; outflow</CardTitle>
          <CardDescription>
            Every production run and sale is logged here with the balance after each transaction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockMovementTable
            movements={finishedMovements}
            inventoryKind="finished"
            emptyMessage="No warehouse movements yet. Record production to add stock, or record a sale to see outflows."
          />
        </CardContent>
      </Card>
    </div>
  );
}
