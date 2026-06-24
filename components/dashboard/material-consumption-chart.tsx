"use client";

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
import { useManufacturing } from "@/context/manufacturing-context";
import { isSameMonth } from "@/lib/helpers";

export function MaterialConsumptionChart() {
  const { productionRecords } = useManufacturing();

  const consumptionMap = new Map<string, number>();

  productionRecords
    .filter((record) => isSameMonth(record.productionDate))
    .forEach((record) => {
      record.consumption.forEach((item) => {
        const current = consumptionMap.get(item.materialName) ?? 0;
        consumptionMap.set(item.materialName, current + item.quantity);
      });
    });

  const chartData = Array.from(consumptionMap.entries())
    .map(([name, quantity]) => ({ name, quantity: Math.round(quantity) }))
    .sort((a, b) => b.quantity - a.quantity);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Material Consumption</CardTitle>
        <p className="text-sm text-muted-foreground">
          Monthly raw material usage (Kg / Litre)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
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
                fontSize={12}
                width={90}
              />
              <Tooltip />
              <Bar dataKey="quantity" fill="var(--chart-2)" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
