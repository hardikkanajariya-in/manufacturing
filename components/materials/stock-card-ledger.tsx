"use client";

import * as React from "react";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useManufacturing } from "@/context/manufacturing-context";
import { formatNumber } from "@/lib/helpers";

interface StockCardLedgerProps {
  materialId: string | null;
}

interface Transaction {
  id: string;
  date: string;
  type: "Inflow" | "Outflow";
  quantity: number;
  delta: number;
  unitCost: number;
  reference: string;
  timestamp: string;
}

export function StockCardLedger({ materialId }: StockCardLedgerProps) {
  const { materials, restocks, productionRecords } = useManufacturing();

  const selectedMaterial = materials.find((m) => m.id === materialId);

  const ledgerData = React.useMemo(() => {
    if (!selectedMaterial) return [];

    const txs: Transaction[] = [];

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
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
            <Layers className="size-4 text-sky-600" />
            Stock Card: {selectedMaterial.name}
          </CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">
            In-depth tracking ledger of inventory inflows and outflows
          </p>
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

          {ledgerData.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400 border border-dashed rounded-xl">
              No transactions recorded for this material.
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[320px] border border-slate-100 rounded-xl">
              <Table>
                <TableHeader className="bg-slate-50/75 sticky top-0 z-10">
                  <TableRow className="border-b border-slate-150">
                    <TableHead className="py-2.5 pl-3 text-[10px] font-bold text-slate-500">Date</TableHead>
                    <TableHead className="py-2.5 text-[10px] font-bold text-slate-500 text-right">Quantity</TableHead>
                    <TableHead className="py-2.5 text-[10px] font-bold text-slate-500 text-right">Balance</TableHead>
                    <TableHead className="py-2.5 pr-3 text-[10px] font-bold text-slate-500">Type / Ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerData.map((item) => {
                    const isInflow = item.type === "Inflow";
                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/50 border-b border-slate-100 text-xs">
                        <TableCell className="py-2.5 pl-3 text-slate-500 font-medium font-mono text-[10px]">
                          {format(new Date(item.date), "dd MMM yy")}
                        </TableCell>
                        <TableCell className={`py-2.5 text-right font-mono font-bold tabular-nums text-xs ${isInflow ? "text-emerald-600" : "text-amber-600"}`}>
                          <span className="inline-flex items-center gap-0.5">
                            {isInflow ? "+" : "-"}
                            {formatNumber(item.quantity, 1)}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono font-bold text-slate-800 tabular-nums text-xs">
                          {formatNumber(item.balance, 1)}
                        </TableCell>
                        <TableCell className="py-2.5 pr-3">
                          <div className="flex flex-col gap-0.5">
                            <span className={`inline-self-start text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border font-sans tracking-wider ${
                              isInflow 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}>
                              {isInflow ? "Inflow" : "Outflow"}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={item.reference}>
                              {item.reference}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
