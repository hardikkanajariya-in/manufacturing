"use client";

import * as React from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useManufacturing } from "@/context/manufacturing-context";
import { formatNumber, getStockStatus } from "@/lib/helpers";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

import type { ProductionRecord, RestockRecord } from "@/lib/types";

interface StockReportProps {
  filteredProductionRecords?: ProductionRecord[];
  filteredRestocks?: RestockRecord[];
}

export function StockReport({ filteredProductionRecords, filteredRestocks }: StockReportProps) {
  const { materials, productionRecords: contextProduction, restocks: contextRestocks } = useManufacturing();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const productions = filteredProductionRecords || contextProduction;
  const restockRecords = filteredRestocks || contextRestocks;

  // Calculate Inflow and Outflow per material in this period
  const materialStats = React.useMemo(() => {
    const stats = materials.reduce<
      Record<string, { inflow: number; outflow: number }>
    >((acc, m) => {
      acc[m.id] = { inflow: 0, outflow: 0 };
      return acc;
    }, {});

    restockRecords.forEach((r) => {
      if (stats[r.materialId]) {
        stats[r.materialId].inflow += r.quantity;
      }
    });

    productions.forEach((p) => {
      p.consumption.forEach((c) => {
        if (stats[c.materialId]) {
          stats[c.materialId].outflow += c.quantity;
        }
      });
    });

    return stats;
  }, [materials, productions, restockRecords]);

  const chartData = materials.map((material) => ({
    name: material.name,
    value: material.availableStock,
  }));

  const totalStock = materials.reduce((sum, m) => sum + m.availableStock, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">
              Current inventory by material
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-muted/10 rounded-lg animate-pulse" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Total Materials</dt>
                <dd className="text-sm font-medium">{materials.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Combined Stock</dt>
                <dd className="text-sm font-medium tabular-nums">
                  {formatNumber(totalStock, 1)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Low Stock Items</dt>
                <dd className="text-sm font-medium">
                  {
                    materials.filter(
                      (m) => getStockStatus(m) !== "Adequate"
                    ).length
                  }
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Available Stock</TableHead>
                <TableHead className="text-right">Period Inflow (+)</TableHead>
                <TableHead className="text-right">Period Outflow (-)</TableHead>
                <TableHead className="text-right">Net Change</TableHead>
                <TableHead className="text-right">Minimum</TableHead>
                <TableHead className="text-right">Fill %</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => {
                const status = getStockStatus(material);
                const fillPercent = Math.min(
                  100,
                  Math.round(
                    (material.availableStock / (material.minimumStock * 2)) * 100
                  )
                );
                const variant =
                  status === "Critical"
                    ? "destructive"
                    : status === "Low Stock"
                      ? "secondary"
                      : "outline";

                const stats = materialStats[material.id] || { inflow: 0, outflow: 0 };
                const netChange = stats.inflow - stats.outflow;

                return (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(material.availableStock, 1)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-600 font-medium">
                      +{formatNumber(stats.inflow, 1)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-rose-600 font-medium">
                      -{formatNumber(stats.outflow, 1)}
                    </TableCell>
                    <TableCell className={`text-right tabular-nums font-bold ${netChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {netChange > 0 ? "+" : ""}{formatNumber(netChange, 1)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatNumber(material.minimumStock)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fillPercent}%
                    </TableCell>
                    <TableCell>
                      <Badge variant={variant}>{status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
