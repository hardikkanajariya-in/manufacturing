"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useManufacturing } from "@/context/manufacturing-context";
import { formatNumber, getStockStatus } from "@/lib/helpers";

export function LowStockAlertCard() {
  const { materials } = useManufacturing();

  const lowStockMaterials = materials
    .map((material) => ({ material, status: getStockStatus(material) }))
    .filter(
      ({ status }) => status === "Low Stock" || status === "Critical"
    );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">Low Stock Alerts</CardTitle>
          <p className="text-sm text-muted-foreground">
            Materials below minimum threshold
          </p>
        </div>
        <AlertTriangle className="size-5 text-destructive" />
      </CardHeader>
      <CardContent>
        {lowStockMaterials.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All materials are above minimum stock levels.
          </p>
        ) : (
          <ul className="space-y-3">
            {lowStockMaterials.map(({ material, status }) => (
              <li
                key={material.id}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{material.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(material.availableStock)} {material.unit} available ·
                    Min {formatNumber(material.minimumStock)} {material.unit}
                  </p>
                </div>
                <Badge
                  variant={status === "Critical" ? "destructive" : "secondary"}
                >
                  {status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
