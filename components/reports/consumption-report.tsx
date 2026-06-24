"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { formatNumber } from "@/lib/helpers";

export function ConsumptionReport() {
  const { productionRecords } = useManufacturing();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const consumptionTotals = new Map<
    string,
    { unit: string; total: number; entries: number }
  >();

  productionRecords.forEach((record) => {
    record.consumption.forEach((item) => {
      const existing = consumptionTotals.get(item.materialName) ?? {
        unit: item.unit,
        total: 0,
        entries: 0,
      };
      consumptionTotals.set(item.materialName, {
        unit: item.unit,
        total: existing.total + item.quantity,
        entries: existing.entries + 1,
      });
    });
  });

  const tableData = Array.from(consumptionTotals.entries())
    .map(([name, data]) => ({
      name,
      unit: data.unit,
      total: data.total,
      entries: data.entries,
      average: data.total / data.entries,
    }))
    .sort((a, b) => b.total - a.total);

  const chartData = tableData.map((row) => ({
    name: row.name,
    total: Math.round(row.total),
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Total Material Consumption</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cumulative usage across all production records
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total Consumed" fill="var(--chart-3)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-muted/10 rounded-lg animate-pulse" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consumption Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Total Consumed</TableHead>
                <TableHead className="text-right">Avg per Entry</TableHead>
                <TableHead className="text-right">Entries</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.total, 1)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatNumber(row.average, 1)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.entries}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
