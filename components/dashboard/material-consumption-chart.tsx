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
import type { ProductionRecord } from "@/lib/types";

interface MaterialConsumptionChartProps {
  records: ProductionRecord[];
}

export function MaterialConsumptionChart({ records }: MaterialConsumptionChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = React.useMemo(() => {
    const consumptionMap = new Map<string, number>();
    records.forEach((record) => {
      record.consumption.forEach((item) => {
        const current = consumptionMap.get(item.materialName) ?? 0;
        consumptionMap.set(item.materialName, current + item.quantity);
      });
    });
    return Array.from(consumptionMap.entries())
      .map(([name, quantity]) => ({ name, quantity: Math.round(quantity) }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [records]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Material consumption</CardTitle>
        <p className="text-sm text-muted-foreground">Raw material usage in selected period</p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full sm:h-72">
          {mounted && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={88}
                />
                <Tooltip />
                <Bar dataKey="quantity" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-muted/10 text-sm text-muted-foreground">
              No consumption data in this period.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
