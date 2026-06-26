"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
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

export function ProductionReport() {
  const { productionRecords } = useManufacturing();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const productTotals = productionRecords.reduce<Record<string, number>>(
    (acc, record) => {
      acc[record.productName] = (acc[record.productName] ?? 0) + record.quantity;
      return acc;
    },
    {}
  );

  const chartData = Object.entries(productTotals).map(([name, total]) => ({
    name,
    total,
  }));

  const financialTotals = productionRecords.reduce(
    (acc, record) => {
      acc.revenue += record.revenue ?? 0;
      acc.cost += record.materialCost ?? 0;
      acc.profit += record.profit ?? 0;
      return acc;
    },
    { revenue: 0, cost: 0, profit: 0 }
  );

  const overallMargin = financialTotals.revenue > 0
    ? (financialTotals.profit / financialTotals.revenue) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Cost Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Revenue</p>
            <p className="text-xl font-bold text-foreground mt-1">₹{formatNumber(financialTotals.revenue, 2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Material Input Cost</p>
            <p className="text-xl font-bold text-foreground mt-1">₹{formatNumber(financialTotals.cost, 2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Operating Profit</p>
            <p className="text-xl font-bold text-foreground mt-1">₹{formatNumber(financialTotals.profit, 2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gross Profit Margin</p>
            <p className={`text-xl font-bold mt-1 ${overallMargin >= 30 ? "text-emerald-600 dark:text-emerald-400" : overallMargin >= 15 ? "text-amber-600 dark:text-amber-400" : "text-destructive"}`}>
              {formatNumber(overallMargin, 1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Production by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="total" fill="var(--chart-1)" radius={[2, 2, 0, 0]} />
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
            <CardTitle className="text-base">Product Quantity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {Object.entries(productTotals).map(([name, total]) => (
                <div key={name} className="flex justify-between border-b border-border pb-2">
                  <dt className="text-sm text-muted-foreground">{name}</dt>
                  <dd className="text-sm font-medium tabular-nums">
                    {formatNumber(total)} units
                  </dd>
                </div>
              ))}
              <div className="flex justify-between pt-1">
                <dt className="text-sm font-medium">Total Logs</dt>
                <dd className="text-sm font-medium tabular-nums">
                  {productionRecords.length}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shop Floor Production Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Passed Yield</TableHead>
                <TableHead className="text-right">Scrap Qty</TableHead>
                <TableHead className="text-right">Material Cost</TableHead>
                <TableHead className="text-right">Est. Revenue</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(new Date(record.productionDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="font-semibold">{record.productName}</TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatNumber(record.quantity)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-destructive">
                    {formatNumber(record.scrapQuantity || 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    ₹{formatNumber(record.materialCost || 0, 2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₹{formatNumber(record.revenue || 0, 2)}
                  </TableCell>
                  <TableCell className={`text-right tabular-nums font-semibold ${record.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    ₹{formatNumber(record.profit || 0, 2)}
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
