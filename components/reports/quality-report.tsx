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
import { formatNumber } from "@/lib/helpers";
import type { ProductionRecord } from "@/lib/types";

interface QualityReportProps {
  filteredRecords?: ProductionRecord[];
}

export function QualityReport({ filteredRecords }: QualityReportProps) {
  const { productionRecords: contextRecords } = useManufacturing();
  const productionRecords = filteredRecords || contextRecords;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Compute metrics
  const totalPassed = productionRecords.reduce((sum, r) => sum + r.quantity, 0);
  const totalScrap = productionRecords.reduce((sum, r) => sum + (r.scrapQuantity || 0), 0);
  const totalProduced = totalPassed + totalScrap;
  const firstPassYield = totalProduced > 0 ? (totalPassed / totalProduced) * 100 : 100;

  const scrapByProduct = productionRecords.reduce<Record<string, number>>((acc, record) => {
    acc[record.productName] = (acc[record.productName] ?? 0) + (record.scrapQuantity || 0);
    return acc;
  }, {});

  const chartData = Object.entries(scrapByProduct)
    .map(([name, total]) => ({
      name,
      total,
    }))
    .filter((d) => d.total > 0);

  const defectRecords = productionRecords.filter((r) => (r.scrapQuantity || 0) > 0 || r.qualityStatus !== "Passed");

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Pass Yield (FPY)</p>
            <p className={`text-xl font-bold mt-1 ${firstPassYield >= 98 ? "text-emerald-600 dark:text-emerald-400" : firstPassYield >= 95 ? "text-amber-600 dark:text-amber-400" : "text-destructive"}`}>
              {formatNumber(firstPassYield, 1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Output (Passed)</p>
            <p className="text-xl font-bold text-foreground mt-1">{formatNumber(totalPassed)} units</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Defective (Scrap)</p>
            <p className="text-xl font-bold text-destructive mt-1">{formatNumber(totalScrap)} units</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quality Defect Rate</p>
            <p className={`text-xl font-bold mt-1 ${firstPassYield >= 98 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
              {formatNumber(100 - firstPassYield, 1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scrap Waste by Product Line</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {mounted && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="total" name="Defective Units" fill="var(--destructive)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-muted/10 rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                  {chartData.length === 0 ? "No scrap waste recorded yet." : "Loading..."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yield Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {productionRecords.reduce<Array<{ name: string; passed: number; scrap: number }>>((acc, record) => {
                const existing = acc.find((x) => x.name === record.productName);
                if (existing) {
                  existing.passed += record.quantity;
                  existing.scrap += record.scrapQuantity || 0;
                } else {
                  acc.push({
                    name: record.productName,
                    passed: record.quantity,
                    scrap: record.scrapQuantity || 0,
                  });
                }
                return acc;
              }, []).map((row) => {
                const total = row.passed + row.scrap;
                const yieldPct = total > 0 ? (row.passed / total) * 100 : 100;
                return (
                  <div key={row.name} className="flex justify-between border-b border-border pb-2 text-sm">
                    <dt className="font-medium text-muted-foreground">{row.name}</dt>
                    <dd className="font-semibold text-foreground tabular-nums flex gap-3">
                      <span>{formatNumber(row.passed)} / {formatNumber(total)} OK</span>
                      <span className={yieldPct >= 98 ? "text-emerald-600" : "text-amber-600"}>({yieldPct.toFixed(1)}% Yield)</span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Defect & Scrap Quality Log</CardTitle>
          <p className="text-xs text-muted-foreground">Audit list of production runs containing scrap or flags.</p>
        </CardHeader>
        <CardContent>
          {defectRecords.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              All logged production runs have 100% Passed quality.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Passed Yield</TableHead>
                  <TableHead className="text-right">Scrap Quantity</TableHead>
                  <TableHead className="text-right">Scrap Rate</TableHead>
                  <TableHead>Quality Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defectRecords.map((record) => {
                  const total = record.quantity + (record.scrapQuantity || 0);
                  const rate = total > 0 ? ((record.scrapQuantity || 0) / total) * 100 : 0;
                  return (
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
                      <TableCell className="text-right tabular-nums font-semibold text-destructive">
                        {rate.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.qualityStatus === "Passed" ? "outline" : "destructive"}>
                          {record.qualityStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
