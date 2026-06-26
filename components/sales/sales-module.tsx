"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { SaleDialog } from "@/components/sales/sale-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn, type DataTableFilter } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { formatNumber } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { PaymentStatus, SaleRecord } from "@/lib/types";

const paymentStyles: Record<PaymentStatus, string> = {
  Paid: "bg-success/10 text-success border-success/20",
  Pending: "bg-warning/15 text-warning-foreground border-warning/30",
  Partial: "bg-accent text-accent-foreground border-border",
};

export function SalesModule() {
  const { products, sales } = useManufacturing();
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);

  const totals = useMemo(() => {
    const revenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const unitsSold = sales.reduce((sum, s) => sum + s.quantity, 0);
    const pending = sales.filter((s) => s.paymentStatus !== "Paid").length;
    return { revenue, unitsSold, pending, count: sales.length };
  }, [sales]);

  const salesTable = useDataTable<SaleRecord>({
    data: sales,
    pageSize: 10,
    initialSort: { columnId: "date", direction: "desc" },
    searchFn: (row, q) =>
      [row.customerName, row.productName, row.invoiceNumber ?? "", row.paymentStatus]
        .join(" ")
        .toLowerCase()
        .includes(q),
    filterFn: (row, filters) => {
      if (filters.payment && filters.payment !== "all" && row.paymentStatus !== filters.payment) {
        return false;
      }
      if (filters.product && filters.product !== "all" && row.productId !== filters.product) {
        return false;
      }
      return true;
    },
    getSortValue: (row, col) => {
      if (col === "date") return new Date(row.saleDate);
      if (col === "customer") return row.customerName;
      if (col === "product") return row.productName;
      if (col === "qty") return row.quantity;
      if (col === "amount") return row.totalAmount;
      return row.invoiceNumber ?? "";
    },
  });

  const salesColumns: DataTableColumn<SaleRecord>[] = [
    {
      id: "date",
      header: "Date",
      sortable: true,
      cell: (s) => (
        <span className="text-muted-foreground">{format(new Date(s.saleDate), "dd MMM yyyy")}</span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      sortable: true,
      cell: (s) => <span className="font-medium">{s.customerName}</span>,
    },
    {
      id: "product",
      header: "Product",
      sortable: true,
      cell: (s) => s.productName,
    },
    {
      id: "qty",
      header: "Qty",
      sortable: true,
      className: "text-right font-mono",
      headerClassName: "text-right",
      cell: (s) => s.quantity,
    },
    {
      id: "amount",
      header: "Amount",
      sortable: true,
      className: "text-right font-mono font-semibold",
      headerClassName: "text-right",
      cell: (s) => `₹${formatNumber(s.totalAmount, 2)}`,
    },
    {
      id: "payment",
      header: "Payment",
      cell: (s) => (
        <Badge variant="outline" className={cn("text-[10px] font-medium", paymentStyles[s.paymentStatus])}>
          {s.paymentStatus}
        </Badge>
      ),
    },
    {
      id: "invoice",
      header: "Invoice",
      sortable: true,
      cell: (s) => (
        <span className="font-mono text-xs text-muted-foreground">{s.invoiceNumber ?? "—"}</span>
      ),
    },
  ];

  const salesFilters: DataTableFilter[] = [
    {
      id: "payment",
      label: "Payment",
      allLabel: "All payments",
      options: [
        { value: "Paid", label: "Paid" },
        { value: "Pending", label: "Pending" },
        { value: "Partial", label: "Partial" },
      ],
    },
    {
      id: "product",
      label: "Product",
      allLabel: "All products",
      options: products.map((p) => ({ value: p.id, label: p.name })),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="kpi-label">Sales recorded</p>
            <p className="text-2xl font-bold mt-1">{totals.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="kpi-label">Units sold</p>
            <p className="text-2xl font-bold mt-1">{formatNumber(totals.unitsSold, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="kpi-label">Total revenue</p>
            <p className="text-2xl font-bold mt-1 text-primary">₹{formatNumber(totals.revenue, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="kpi-label">Pending payments</p>
            <p className="text-2xl font-bold mt-1">{totals.pending}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
          <div>
            <CardTitle className="section-title">Sales ledger</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              All outbound finished-goods sales for this unit.
            </p>
          </div>
          <Button onClick={() => setSaleDialogOpen(true)} className="self-start sm:self-center">
            <Plus className="size-4" />
            Record sale
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            table={salesTable}
            columns={salesColumns}
            getRowKey={(s) => s.id}
            searchPlaceholder="Search sales…"
            filters={salesFilters}
            emptyMessage="No sales recorded for this unit."
          />
        </CardContent>
      </Card>

      <SaleDialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen} />
    </div>
  );
}
