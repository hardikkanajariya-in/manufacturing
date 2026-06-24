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

  return (
    <div className="space-y-6">
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
            <CardTitle className="text-base">Summary</CardTitle>
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
                <dt className="text-sm font-medium">Total Entries</dt>
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
          <CardTitle className="text-base">Production Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Cement Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionRecords.map((record) => {
                const cement = record.consumption.find((c) =>
                  c.materialName.toLowerCase().includes("cement")
                );
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(new Date(record.productionDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">{record.productName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(record.quantity)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {cement ? `${formatNumber(cement.quantity, 1)} Kg` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
