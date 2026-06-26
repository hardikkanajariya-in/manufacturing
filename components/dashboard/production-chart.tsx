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
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductionRecord } from "@/lib/types";
import type { DateRange } from "@/lib/date-range";

interface ProductionChartProps {
  records: ProductionRecord[];
  range: DateRange;
  productNames: string[];
}

export function ProductionChart({ records, range, productNames }: ProductionChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = React.useMemo(() => {
    if (!range.start || !range.end) return [];

    const days = eachDayOfInterval({ start: range.start, end: range.end });
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const label = format(day, "dd MMM");
      const dayRecords = records.filter((r) => r.productionDate === dateStr);

      const row: Record<string, string | number> = { date: label };
      productNames.forEach((name) => {
        row[name] = dayRecords
          .filter((r) => r.productName === name)
          .reduce((sum, r) => sum + r.quantity, 0);
      });
      return row;
    });
  }, [records, range, productNames]);

  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Production output</CardTitle>
        <p className="text-sm text-muted-foreground">Daily passed yield by product</p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full sm:h-72">
          {mounted && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                <Tooltip />
                <Legend />
                {productNames.map((name, i) => (
                  <Bar key={name} dataKey={name} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-muted/10 text-sm text-muted-foreground">
              No production in this period.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
