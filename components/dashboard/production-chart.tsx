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
import { useManufacturing } from "@/context/manufacturing-context";
import { format, subDays } from "date-fns";

export function ProductionChart() {
  const { productionRecords } = useManufacturing();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = Array.from({ length: 7 }, (_, index) => {
    const date = subDays(new Date(), 6 - index);
    const dateStr = format(date, "yyyy-MM-dd");
    const label = format(date, "dd MMM");

    const dayRecords = productionRecords.filter(
      (record) => record.productionDate === dateStr
    );

    return {
      date: label,
      "Paver Blocks": dayRecords
        .filter((r) => r.productName === "Paver Blocks")
        .reduce((sum, r) => sum + r.quantity, 0),
      "Kerb Stones": dayRecords
        .filter((r) => r.productName === "Kerb Stones")
        .reduce((sum, r) => sum + r.quantity, 0),
      "RCC Pipes": dayRecords
        .filter((r) => r.productName === "RCC Pipes")
        .reduce((sum, r) => sum + r.quantity, 0),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Production Overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Daily output by product (last 7 days)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Paver Blocks" fill="var(--chart-1)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Kerb Stones" fill="var(--chart-2)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="RCC Pipes" fill="var(--chart-3)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full bg-muted/10 rounded-lg animate-pulse" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
