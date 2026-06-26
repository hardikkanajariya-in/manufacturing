"use client";

import * as React from "react";
import { useManufacturing } from "@/context/manufacturing-context";
import { filterByDateRange } from "@/lib/date-range";
import { formatNumber } from "@/lib/helpers";
import { useDateRangeFilter } from "@/hooks/use-date-range-filter";
import { TimeRangeFilter } from "@/components/layout/time-range-filter";
import { Card, CardContent } from "@/components/ui/card";
import { ProductionChart } from "@/components/dashboard/production-chart";
import { MaterialConsumptionChart } from "@/components/dashboard/material-consumption-chart";
import { SalesRevenueChart } from "@/components/dashboard/sales-revenue-chart";
import { PurchasesSpendChart } from "@/components/dashboard/purchases-spend-chart";
import { ProfitTrendChart } from "@/components/dashboard/profit-trend-chart";
import { QualityYieldChart } from "@/components/dashboard/quality-yield-chart";
import { cn } from "@/lib/utils";

type ChartView = "overview" | "sales" | "materials" | "quality";

const CHART_TABS: { id: ChartView; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "sales", label: "Sales & profit" },
  { id: "materials", label: "Materials" },
  { id: "quality", label: "Quality" },
];

export function DashboardContent() {
  const { productionRecords, sales, restocks, products, materials } = useManufacturing();
  const { filter, range, setMode, update } = useDateRangeFilter();
  const [chartView, setChartView] = React.useState<ChartView>("overview");

  const filteredProduction = React.useMemo(
    () => filterByDateRange(productionRecords, (r) => r.productionDate, range),
    [productionRecords, range]
  );

  const filteredSales = React.useMemo(
    () => filterByDateRange(sales, (s) => s.saleDate, range),
    [sales, range]
  );

  const filteredRestocks = React.useMemo(
    () => filterByDateRange(restocks, (r) => r.date, range),
    [restocks, range]
  );

  const productNames = React.useMemo(
    () => [...new Set(products.map((p) => p.name))],
    [products]
  );

  const kpis = React.useMemo(() => {
    const output = filteredProduction.reduce((sum, r) => sum + r.quantity, 0);
    const revenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const profit = filteredProduction.reduce((sum, r) => sum + (r.profit ?? 0), 0);
    const purchaseSpend = filteredRestocks.reduce((sum, r) => sum + r.totalCost, 0);
    const lowStock = materials.filter((m) => m.availableStock <= m.minimumStock).length;
    return { output, revenue, profit, purchaseSpend, lowStock, runs: filteredProduction.length };
  }, [filteredProduction, filteredSales, filteredRestocks, materials]);

  return (
    <div className="space-y-6">
      <TimeRangeFilter filter={filter} onModeChange={setMode} onUpdate={update} />

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="kpi-label">Production runs</p>
            <p className="text-xl font-bold mt-0.5">{kpis.runs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="kpi-label">Units produced</p>
            <p className="text-xl font-bold mt-0.5">{formatNumber(kpis.output)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="kpi-label">Sales revenue</p>
            <p className="text-xl font-bold mt-0.5 text-primary">₹{formatNumber(kpis.revenue, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="kpi-label">Net profit</p>
            <p className={cn("text-xl font-bold mt-0.5", kpis.profit >= 0 ? "text-success" : "text-destructive")}>
              ₹{formatNumber(kpis.profit, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="kpi-label">Purchases</p>
            <p className="text-xl font-bold mt-0.5">₹{formatNumber(kpis.purchaseSpend, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="kpi-label">Low stock items</p>
            <p className={cn("text-xl font-bold mt-0.5", kpis.lowStock > 0 ? "text-warning-foreground" : "")}>
              {kpis.lowStock}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border pb-0.5 scrollbar-none">
        {CHART_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setChartView(tab.id)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer sm:text-sm",
              chartView === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {chartView === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ProductionChart records={filteredProduction} range={range} productNames={productNames} />
          <SalesRevenueChart sales={filteredSales} range={range} />
          <MaterialConsumptionChart records={filteredProduction} />
          <ProfitTrendChart records={filteredProduction} range={range} />
        </div>
      )}

      {chartView === "sales" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SalesRevenueChart sales={filteredSales} range={range} />
          <ProfitTrendChart records={filteredProduction} range={range} />
        </div>
      )}

      {chartView === "materials" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <MaterialConsumptionChart records={filteredProduction} />
          <PurchasesSpendChart restocks={filteredRestocks} />
        </div>
      )}

      {chartView === "quality" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <QualityYieldChart records={filteredProduction} />
          <ProductionChart records={filteredProduction} range={range} productNames={productNames} />
        </div>
      )}
    </div>
  );
}
