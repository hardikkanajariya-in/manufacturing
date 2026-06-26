"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/helpers";
import type { ProductionRecord } from "@/lib/types";

interface QualityYieldChartProps {
  records: ProductionRecord[];
}

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function QualityYieldChart({ records }: QualityYieldChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const byProduct = React.useMemo(() => {
    const map = new Map<string, { passed: number; scrap: number }>();
    records.forEach((r) => {
      const existing = map.get(r.productName) ?? { passed: 0, scrap: 0 };
      existing.passed += r.quantity;
      existing.scrap += r.scrapQuantity ?? 0;
      map.set(r.productName, existing);
    });
    return Array.from(map.entries()).map(([name, data]) => {
      const total = data.passed + data.scrap;
      const yieldPct = total > 0 ? (data.passed / total) * 100 : 100;
      return { name, yieldPct: Math.round(yieldPct * 10) / 10, scrap: data.scrap };
    });
  }, [records]);

  const scrapByProduct = byProduct.filter((d) => d.scrap > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">First-pass yield by product</CardTitle>
        <p className="text-sm text-muted-foreground">Quality performance in selected period</p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full sm:h-72">
          {mounted && byProduct.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={byProduct} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={0} angle={-15} textAnchor="end" height={48} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} width={40} />
                <Tooltip formatter={(v) => [`${Number(v ?? 0)}%`, "FPY"]} />
                <Bar dataKey="yieldPct" radius={[4, 4, 0, 0]}>
                  {byProduct.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-muted/10 text-sm text-muted-foreground">
              No quality data in this period.
            </div>
          )}
        </div>
        {scrapByProduct.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Scrap units: {scrapByProduct.map((d) => `${d.name} (${formatNumber(d.scrap)})`).join(" · ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
