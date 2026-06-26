"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { FileText, Plus } from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { PurchaseBillDialog } from "@/components/materials/purchase-bill-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { formatNumber } from "@/lib/helpers";
import type { RestockRecord } from "@/lib/types";

function groupPurchaseBills(restocks: RestockRecord[]) {
  const groups = new Map<string, RestockRecord[]>();
  restocks.forEach((record) => {
    const key = `${record.invoiceNumber ?? record.id}-${record.supplier}-${record.date}`;
    const existing = groups.get(key) ?? [];
    existing.push(record);
    groups.set(key, existing);
  });
  return Array.from(groups.values())
    .map((lines) => ({
      invoiceNumber: lines[0].invoiceNumber ?? "—",
      supplier: lines[0].supplier,
      date: lines[0].date,
      lines,
      total: lines.reduce((sum, line) => sum + line.totalCost, 0),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

type PurchaseBill = ReturnType<typeof groupPurchaseBills>[number];

export function PurchaseBillsPanel() {
  const { restocks } = useManufacturing();
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const recentBills = useMemo(() => groupPurchaseBills(restocks), [restocks]);

  const billsTable = useDataTable<PurchaseBill>({
    data: recentBills,
    pageSize: 10,
    initialSort: { columnId: "date", direction: "desc" },
    searchFn: (row, q) =>
      [row.supplier, row.invoiceNumber, row.lines.map((l) => l.materialName).join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(q),
    getSortValue: (row, col) => {
      if (col === "date") return new Date(row.date);
      if (col === "supplier") return row.supplier;
      if (col === "total") return row.total;
      return row.invoiceNumber;
    },
  });

  const billColumns: DataTableColumn<PurchaseBill>[] = [
    {
      id: "date",
      header: "Date",
      sortable: true,
      cell: (bill) => format(new Date(bill.date), "dd MMM yyyy"),
    },
    {
      id: "invoice",
      header: "Invoice no.",
      sortable: true,
      cell: (bill) => <span className="font-mono font-semibold">{bill.invoiceNumber}</span>,
    },
    {
      id: "supplier",
      header: "Supplier",
      sortable: true,
      cell: (bill) => bill.supplier,
    },
    {
      id: "materials",
      header: "Materials",
      cell: (bill) => (
        <span className="text-muted-foreground text-xs">
          {bill.lines
            .map((line) => `${line.materialName} (${formatNumber(line.quantity, 0)} ${line.unit})`)
            .join(" · ")}
        </span>
      ),
    },
    {
      id: "total",
      header: "Bill total",
      sortable: true,
      className: "text-right font-mono font-semibold text-success",
      headerClassName: "text-right",
      cell: (bill) => `₹${formatNumber(bill.total, 2)}`,
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-primary" />
              Purchase bills
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Supplier invoices and material restocks.
            </p>
          </div>
          <Button onClick={() => setBillDialogOpen(true)} className="self-start sm:self-center">
            <Plus className="size-4" />
            New purchase bill
          </Button>
        </CardHeader>
        <CardContent>
          {successMsg && (
            <p className="mb-4 text-xs text-success rounded-lg bg-success/10 border border-success/20 px-3 py-2">
              {successMsg}
            </p>
          )}
          <DataTable
            table={billsTable}
            columns={billColumns}
            getRowKey={(bill) => `${bill.invoiceNumber}-${bill.supplier}-${bill.date}`}
            searchPlaceholder="Search purchase bills…"
            emptyMessage="No purchase bills recorded yet. Create one to restock materials."
          />
        </CardContent>
      </Card>

      <PurchaseBillDialog
        open={billDialogOpen}
        onOpenChange={setBillDialogOpen}
        onSuccess={() => {
          setSuccessMsg("Purchase bill logged. Stock levels updated.");
          setTimeout(() => setSuccessMsg(null), 3000);
        }}
      />
    </>
  );
}
