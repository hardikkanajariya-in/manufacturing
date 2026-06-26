"use client";

import * as React from "react";
import { format } from "date-fns";
import { ArrowLeft, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { useManufacturing } from "@/context/manufacturing-context";
import { formatNumber } from "@/lib/helpers";

interface StockCardLedgerProps {
  materialId: string | null;
  onBack?: () => void;
}

interface LedgerRow {
  id: string;
  date: string;
  type: "Inflow" | "Outflow";
  quantity: number;
  delta: number;
  unitCost: number;
  reference: string;
  timestamp: string;
  balance: number;
}

export function StockCardLedger({ materialId, onBack }: StockCardLedgerProps) {
  const { materials, restocks, productionRecords } = useManufacturing();

  const selectedMaterial = materials.find((m) => m.id === materialId);

  const ledgerData = React.useMemo(() => {
    if (!selectedMaterial) return [];

    const txs: Omit<LedgerRow, "balance">[] = [];

    // 1. Collect Restock Inflows
    restocks
      .filter((r) => r.materialId === selectedMaterial.id)
      .forEach((r) => {
        txs.push({
          id: r.id,
          date: r.date,
          type: "Inflow",
          quantity: r.quantity,
          delta: r.quantity,
          unitCost: r.unitCost,
          reference: `Restock: ${r.supplier}`,
          timestamp: r.createdAt,
        });
      });

    // 2. Collect Production Outflows
    productionRecords.forEach((record) => {
      const consumptionItem = record.consumption.find((c) => c.materialId === selectedMaterial.id);
      if (consumptionItem) {
        txs.push({
          id: `${record.id}-${consumptionItem.materialId}`,
          date: record.productionDate,
          type: "Outflow",
          quantity: consumptionItem.quantity,
          delta: -consumptionItem.quantity,
          unitCost: consumptionItem.unitCost,
          reference: `Production: ${record.productName}`,
          timestamp: record.createdAt,
        });
      }
    });

    // Sort chronologically (oldest first) to calculate running balance
    txs.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    // Calculate starting stock back-propagated from the current live available stock
    const netChange = txs.reduce((sum, tx) => sum + tx.delta, 0);
    const startingStock = selectedMaterial.availableStock - netChange;

    let rollingBalance = startingStock;
    const ledger = txs.map((tx) => {
      rollingBalance += tx.delta;
      return {
        ...tx,
        balance: rollingBalance,
      };
    });

    // Return reversed (newest first) for visual display
    return ledger.reverse();
  }, [selectedMaterial, restocks, productionRecords]);

  const ledgerTable = useDataTable<LedgerRow>({
    data: ledgerData,
    pageSize: 10,
    initialSort: { columnId: "date", direction: "desc" },
    searchFn: (row, q) =>
      row.reference.toLowerCase().includes(q) ||
      row.type.toLowerCase().includes(q),
    filterFn: (row, filters) => {
      if (filters.type && filters.type !== "all" && row.type !== filters.type) {
        return false;
      }
      return true;
    },
    getSortValue: (row, col) => {
      if (col === "date") return new Date(row.date);
      if (col === "quantity") return row.quantity;
      if (col === "balance") return row.balance;
      return row.reference;
    },
  });

  const ledgerColumns: DataTableColumn<LedgerRow>[] = [
    {
      id: "date",
      header: "Date",
      sortable: true,
      cell: (item) => (
        <span className="text-slate-500 font-medium font-mono text-[10px]">
          {format(new Date(item.date), "dd MMM yy")}
        </span>
      ),
    },
    {
      id: "quantity",
      header: "Quantity",
      sortable: true,
      className: "text-right font-mono font-bold tabular-nums text-xs",
      headerClassName: "text-right",
      cell: (item) => {
        const isInflow = item.type === "Inflow";
        return (
          <span className={isInflow ? "text-emerald-600" : "text-amber-600"}>
            {isInflow ? "+" : "-"}
            {formatNumber(item.quantity, 1)}
          </span>
        );
      },
    },
    {
      id: "balance",
      header: "Balance",
      sortable: true,
      className: "text-right font-mono font-bold text-slate-800 tabular-nums text-xs",
      headerClassName: "text-right",
      cell: (item) => formatNumber(item.balance, 1),
    },
    {
      id: "reference",
      header: "Type / Ref",
      sortable: true,
      cell: (item) => {
        const isInflow = item.type === "Inflow";
        return (
          <div className="flex flex-col gap-0.5">
            <span
              className={`inline-self-start text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border font-sans tracking-wider ${
                isInflow
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-amber-50 text-amber-700 border-amber-100"
              }`}
            >
              {isInflow ? "Inflow" : "Outflow"}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={item.reference}>
              {item.reference}
            </span>
          </div>
        );
      },
    },
  ];

  const ledgerFilters = [
    {
      id: "type",
      label: "Type",
      allLabel: "All types",
      options: [
        { value: "Inflow", label: "Inflow" },
        { value: "Outflow", label: "Outflow" },
      ],
    },
  ];

  if (!selectedMaterial) {
    return (
      <Card className="bg-slate-50/50 border-dashed border-2 border-slate-200 h-full flex flex-col justify-center items-center py-16 text-center shadow-xs rounded-2xl min-h-[350px]">
        <Layers className="size-8 text-slate-300 mb-3" />
        <span className="text-xs text-slate-400 font-medium px-4">Select a material to display its ledger stock card audit.</span>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-slate-200 shadow-sm h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer shrink-0"
                aria-label="Back to raw materials directory"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            <div>
              <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
                <Layers className="size-4 text-sky-600" />
                Stock Card: {selectedMaterial.name}
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                In-depth tracking ledger of inventory inflows and outflows
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Quick summary of the selected material */}
          <div className="grid grid-cols-2 gap-3 text-xs border border-slate-100 rounded-xl p-3.5 bg-slate-50/50">
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Stock Balance</span>
              <span className="text-sm font-black text-slate-800 mt-0.5 block">
                {formatNumber(selectedMaterial.availableStock, 1)} {selectedMaterial.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Weighted Avg Cost</span>
              <span className="text-sm font-black text-slate-800 mt-0.5 block">
                ₹{formatNumber(selectedMaterial.unitCost, 2)}
              </span>
            </div>
          </div>

          <DataTable
            table={ledgerTable}
            columns={ledgerColumns}
            getRowKey={(item) => item.id}
            searchPlaceholder="Search by reference…"
            filters={ledgerFilters}
            emptyMessage="No transactions recorded for this material."
          />
        </CardContent>
      </div>
    </Card>
  );
}
