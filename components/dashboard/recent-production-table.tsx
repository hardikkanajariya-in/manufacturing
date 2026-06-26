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
  const { productionRecords, user } = useManufacturing();
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
              <TableHead className="text-right">Yield</TableHead>
              <TableHead className="text-right">Scrap</TableHead>
              {user.role === "Manager" && <TableHead className="text-right">Net Profit</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  {format(new Date(record.productionDate), "dd MMM yyyy")}
                </TableCell>
                <TableCell className="font-medium">{record.productName}</TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatNumber(record.quantity)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-destructive">
                  {formatNumber(record.scrapQuantity || 0)}
                </TableCell>
                {user.role === "Manager" && (
                  <TableCell className={`text-right tabular-nums font-bold ${record.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    ₹{formatNumber(record.profit || 0, 0)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
