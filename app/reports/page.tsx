"use client";

import { ConsumptionReport } from "@/components/reports/consumption-report";
import { ProductionReport } from "@/components/reports/production-report";
import { StockReport } from "@/components/reports/stock-report";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportsPage() {
  return (
    <DashboardShell
      title="Reports"
      description="Production, consumption, and inventory analytics"
    >
      <Tabs defaultValue="production">
        <TabsList>
          <TabsTrigger value="production">Production Report</TabsTrigger>
          <TabsTrigger value="consumption">Material Consumption</TabsTrigger>
          <TabsTrigger value="stock">Stock Report</TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="mt-6">
          <ProductionReport />
        </TabsContent>

        <TabsContent value="consumption" className="mt-6">
          <ConsumptionReport />
        </TabsContent>

        <TabsContent value="stock" className="mt-6">
          <StockReport />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
