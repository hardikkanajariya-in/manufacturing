"use client";

import { format } from "date-fns";
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

export function RecentProductionTable() {
  const { productionRecords } = useManufacturing();
  const recent = productionRecords.slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Production</CardTitle>
        <p className="text-sm text-muted-foreground">
          Latest production entries across all lines
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Materials Used</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  {format(new Date(record.productionDate), "dd MMM yyyy")}
                </TableCell>
                <TableCell className="font-medium">{record.productName}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(record.quantity)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {record.consumption.length} items
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
