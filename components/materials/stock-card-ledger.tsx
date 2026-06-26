"use client";

import * as React from "react";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, ShieldAlert, Layers } from "lucide-react";
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
      <Card className="bg-muted/15 border-dashed border-2 h-full flex flex-col justify-center items-center py-16 text-center">
        <Layers className="size-8 text-muted-foreground/45 mb-2" />
        <span className="text-sm text-muted-foreground">Select a material to display its ledger stock card.</span>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-1.5">
          <Layers className="size-4 text-primary" />
          Stock Card: {selectedMaterial.name}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          In-depth tracking ledger of inventory inflows and outflows.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick summary of the selected material */}
        <div className="grid grid-cols-2 gap-3 text-xs border rounded-lg p-3 bg-muted/30">
          <div>
            <span className="text-muted-foreground block">Stock Balance</span>
            <span className="text-base font-bold text-foreground">
              {formatNumber(selectedMaterial.availableStock, 1)} {selectedMaterial.unit}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Weighted Avg Cost</span>
            <span className="text-base font-bold text-foreground">
              ₹{formatNumber(selectedMaterial.unitCost, 2)}
            </span>
          </div>
        </div>

        {ledgerData.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg">
            No transactions recorded for this material.
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[350px] border rounded-lg">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="py-2 text-[11px]">Date</TableHead>
                  <TableHead className="py-2 text-[11px] text-right">Quantity</TableHead>
                  <TableHead className="py-2 text-[11px] text-right">Balance</TableHead>
                  <TableHead className="py-2 text-[11px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerData.map((item) => {
                  const isInflow = item.type === "Inflow";
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30 text-xs">
                      <TableCell className="py-2">
                        {format(new Date(item.date), "dd MMM yy")}
                      </TableCell>
                      <TableCell className={`py-2 text-right font-semibold tabular-nums ${isInflow ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-500"}`}>
                        <span className="inline-flex items-center gap-0.5">
                          {isInflow ? "+" : "-"}
                          {formatNumber(item.quantity, 1)}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-right font-bold tabular-nums">
                        {formatNumber(item.balance, 1)}
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground truncate max-w-[120px]" title={item.reference}>
                        {item.reference}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
