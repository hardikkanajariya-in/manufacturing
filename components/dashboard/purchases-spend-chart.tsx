"use client";

import * as React from "react";
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
import { formatNumber } from "@/lib/helpers";
import type { RestockRecord } from "@/lib/types";

interface PurchasesSpendChartProps {
  restocks: RestockRecord[];
}

export function PurchasesSpendChart({ restocks }: PurchasesSpendChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = React.useMemo(() => {
    const byMaterial = new Map<string, number>();
    restocks.forEach((r) => {
      byMaterial.set(r.materialName, (byMaterial.get(r.materialName) ?? 0) + r.totalCost);
    });
    return Array.from(byMaterial.entries())
      .map(([name, spend]) => ({ name, spend: Math.round(spend) }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 8);
  }, [restocks]);

  const totalSpend = restocks.reduce((sum, r) => sum + r.totalCost, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Purchase spend</CardTitle>
        <p className="text-sm text-muted-foreground">
          ₹{formatNumber(totalSpend, 0)} on raw materials in period
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full sm:h-72">
          {mounted && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={0} angle={-20} textAnchor="end" height={56} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => [`₹${formatNumber(Number(v ?? 0), 0)}`, "Spend"]} />
                <Bar dataKey="spend" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-muted/10 text-sm text-muted-foreground">
              No purchases in this period.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
