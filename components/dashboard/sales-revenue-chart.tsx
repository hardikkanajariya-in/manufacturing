"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { eachDayOfInterval, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/helpers";
import type { SaleRecord } from "@/lib/types";
import type { DateRange } from "@/lib/date-range";

interface SalesRevenueChartProps {
  sales: SaleRecord[];
  range: DateRange;
}

export function SalesRevenueChart({ sales, range }: SalesRevenueChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = React.useMemo(() => {
    if (!range.start || !range.end) return [];
    const days = eachDayOfInterval({ start: range.start, end: range.end });
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const daySales = sales.filter((s) => s.saleDate === dateStr);
      return {
        date: format(day, "dd MMM"),
        revenue: daySales.reduce((sum, s) => sum + s.totalAmount, 0),
        units: daySales.reduce((sum, s) => sum + s.quantity, 0),
      };
    });
  }, [sales, range]);

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sales revenue</CardTitle>
        <p className="text-sm text-muted-foreground">
          ₹{formatNumber(totalRevenue, 0)} total in period
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full sm:h-72">
          {mounted && totalRevenue > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => [`₹${formatNumber(Number(v ?? 0), 0)}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" fill="url(#revenueFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-muted/10 text-sm text-muted-foreground">
              No sales in this period.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
