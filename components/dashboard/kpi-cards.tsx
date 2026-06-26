"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useManufacturing } from "@/context/manufacturing-context";
import { brand } from "@/lib/brand";
import { formatNumber, isSameMonth, isToday } from "@/lib/helpers";
import { Boxes, ClipboardList, Package, TrendingUp } from "lucide-react";

export function KpiCards() {
  const { materials, productionRecords } = useManufacturing();

  const totalMaterials = materials.length;
  const availableStock = materials.reduce(
    (sum, material) => sum + material.availableStock,
    0
  );
  const todaysProduction = productionRecords
    .filter((record) => isToday(record.productionDate))
    .reduce((sum, record) => sum + record.quantity, 0);
  const monthlyProduction = productionRecords
    .filter((record) => isSameMonth(record.productionDate))
    .reduce((sum, record) => sum + record.quantity, 0);

  const cards = [
    {
      title: "Total Materials",
      value: formatNumber(totalMaterials),
      subtitle: "Raw material types",
      icon: Boxes,
      color: brand.modules.inventory,
    },
    {
      title: "Available Stock",
      value: formatNumber(availableStock),
      subtitle: "Combined units (Kg/L)",
      icon: Package,
      color: brand.modules.dispatch,
    },
    {
      title: "Today's Production",
      value: formatNumber(todaysProduction),
      subtitle: "Units produced today",
      icon: ClipboardList,
      color: brand.modules.production,
    },
    {
      title: "Monthly Production",
      value: formatNumber(monthlyProduction),
      subtitle: "Current month total",
      icon: TrendingUp,
      color: brand.modules.finance,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div
                className="flex size-8 items-center justify-center rounded-[var(--radius-button)]"
                style={{ backgroundColor: `${card.color}14` }}
              >
                <Icon className="size-4 stroke-[2]" style={{ color: card.color }} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-data text-2xl font-semibold">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
