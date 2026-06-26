"use client";

import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn, type DataTableFilter } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { StockMovementTable } from "@/components/inventory/stock-movement-table";
import { PageTabs } from "@/components/layout/page-tabs";
import { formatCurrency } from "@/lib/helpers";
import type { Product } from "@/lib/types";

export function FinishedGoodsWarehouse() {
  const { products, stockMovements } = useManufacturing();
  const [view, setView] = useState<"stock" | "movements">("stock");

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

  const stockTable = useDataTable<Product>({
    data: products,
    pageSize: 10,
    initialSort: { columnId: "stock", direction: "desc" },
    searchFn: (row, q) => row.name.toLowerCase().includes(q),
    filterFn: (row, filters) => {
      if (filters.status === "all") return true;
      if (filters.status === "out") return row.finishedStock === 0;
      if (filters.status === "low") return row.finishedStock > 0 && row.finishedStock < 50;
      if (filters.status === "ok") return row.finishedStock >= 50;
      return true;
    },
    getSortValue: (row, col) => {
      if (col === "product") return row.name;
      if (col === "stock") return row.finishedStock;
      if (col === "price") return row.sellingPrice;
      return row.finishedStock * row.sellingPrice;
    },
  });

  const stockColumns: DataTableColumn<Product>[] = [
    {
      id: "product",
      header: "Product",
      sortable: true,
      cell: (p) => <span className="font-medium">{p.name}</span>,
    },
    {
      id: "stock",
      header: "In warehouse",
      sortable: true,
      className: "text-right font-mono",
      headerClassName: "text-right",
      cell: (p) => `${p.finishedStock.toLocaleString()} units`,
    },
    {
      id: "price",
      header: "Sell price",
      sortable: true,
      className: "text-right font-mono",
      headerClassName: "text-right",
      cell: (p) => formatCurrency(p.sellingPrice),
    },
    {
      id: "value",
      header: "Value",
      sortable: true,
      className: "text-right font-mono",
      headerClassName: "text-right",
      cell: (p) => formatCurrency(p.finishedStock * p.sellingPrice),
    },
    {
      id: "status",
      header: "Status",
      cell: (p) =>
        p.finishedStock === 0 ? (
          <Badge variant="secondary" className="bg-red-100 text-red-800">Out of stock</Badge>
        ) : p.finishedStock < 50 ? (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">Low</Badge>
        ) : (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Available</Badge>
        ),
    },
  ];

  const stockFilters: DataTableFilter[] = [
    {
      id: "status",
      label: "Status",
      allLabel: "All statuses",
      options: [
        { value: "ok", label: "Available" },
        { value: "low", label: "Low stock" },
        { value: "out", label: "Out of stock" },
      ],
    },
  ];

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

      <PageTabs
        tabs={[
          { id: "stock", label: "Stock levels" },
          { id: "movements", label: "Inflow / outflow" },
        ]}
        activeTab={view}
        onChange={(id) => setView(id as "stock" | "movements")}
      />

      {view === "stock" ? (
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
            <DataTable
              table={stockTable}
              columns={stockColumns}
              getRowKey={(p) => p.id}
              searchPlaceholder="Search products…"
              filters={stockFilters}
              emptyMessage="No products registered."
            />
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  );
}
