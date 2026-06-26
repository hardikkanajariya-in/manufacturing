"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { ProductionLogDialog } from "@/components/production/production-log-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { formatNumber } from "@/lib/helpers";
import type { ProductionRecord } from "@/lib/types";

export function ProductionLogPanel() {
  const { productionRecords } = useManufacturing();
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  const logTable = useDataTable<ProductionRecord>({
    data: productionRecords,
    pageSize: 10,
    initialSort: { columnId: "date", direction: "desc" },
    searchFn: (row, q) => row.productName.toLowerCase().includes(q),
    getSortValue: (row, col) => {
      if (col === "date") return new Date(row.productionDate);
      if (col === "product") return row.productName;
      if (col === "qty") return row.quantity;
      if (col === "scrap") return row.scrapQuantity ?? 0;
      return row.qualityStatus;
    },
  });

  const columns: DataTableColumn<ProductionRecord>[] = useMemo(
    () => [
      {
        id: "date",
        header: "Date",
        sortable: true,
        cell: (r) => format(new Date(r.productionDate), "dd MMM yyyy"),
      },
      {
        id: "product",
        header: "Product",
        sortable: true,
        cell: (r) => <span className="font-medium">{r.productName}</span>,
      },
      {
        id: "qty",
        header: "Passed yield",
        sortable: true,
        className: "text-right font-mono tabular-nums",
        headerClassName: "text-right",
        cell: (r) => formatNumber(r.quantity),
      },
      {
        id: "scrap",
        header: "Scrap",
        sortable: true,
        className: "text-right font-mono tabular-nums text-muted-foreground",
        headerClassName: "text-right",
        cell: (r) => formatNumber(r.scrapQuantity || 0),
      },
      {
        id: "quality",
        header: "Quality",
        sortable: true,
        cell: (r) => r.qualityStatus,
      },
    ],
    []
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Production log</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Record shop-floor output and review past runs for this unit.
            </p>
          </div>
          <Button onClick={() => setLogDialogOpen(true)} className="self-start sm:self-center shrink-0">
            <Plus className="size-4" />
            Log production run
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            table={logTable}
            columns={columns}
            getRowKey={(r) => r.id}
            searchPlaceholder="Search production runs…"
            emptyMessage="No production runs logged yet."
          />
        </CardContent>
      </Card>

      <ProductionLogDialog open={logDialogOpen} onOpenChange={setLogDialogOpen} />
    </>
  );
}
