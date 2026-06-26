"use client";

import * as React from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { eachDayOfInterval, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/helpers";
import type { ProductionRecord } from "@/lib/types";
import type { DateRange } from "@/lib/date-range";

interface ProfitTrendChartProps {
  records: ProductionRecord[];
  range: DateRange;
}

export function ProfitTrendChart({ records, range }: ProfitTrendChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = React.useMemo(() => {
    if (!range.start || !range.end) return [];
    const days = eachDayOfInterval({ start: range.start, end: range.end });
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayRecords = records.filter((r) => r.productionDate === dateStr);
      const profit = dayRecords.reduce((sum, r) => sum + (r.profit ?? 0), 0);
      const revenue = dayRecords.reduce((sum, r) => sum + (r.revenue ?? 0), 0);
      return {
        date: format(day, "dd MMM"),
        profit: Math.round(profit),
        revenue: Math.round(revenue),
      };
    });
  }, [records, range]);

  const hasData = chartData.some((d) => d.profit !== 0 || d.revenue !== 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profit trend</CardTitle>
        <p className="text-sm text-muted-foreground">Daily net profit from production runs</p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full sm:h-72">
          {mounted && hasData ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v, name) => [`₹${formatNumber(Number(v ?? 0), 0)}`, name === "profit" ? "Profit" : "Revenue"]} />
                <Line type="monotone" dataKey="profit" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-muted/10 text-sm text-muted-foreground">
              No profit data in this period.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
