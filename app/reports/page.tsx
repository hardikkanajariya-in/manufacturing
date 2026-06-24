"use client";

import * as React from "react";
import { ConsumptionReport } from "@/components/reports/consumption-report";
import { ProductionReport } from "@/components/reports/production-report";
import { StockReport } from "@/components/reports/stock-report";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = React.useState("production");

  return (
    <DashboardShell
      title="Reports"
      description="Production, consumption, and inventory analytics"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="production">
        <TabsList>
          <TabsTrigger value="production">Production Report</TabsTrigger>
          <TabsTrigger value="consumption">Material Consumption</TabsTrigger>
          <TabsTrigger value="stock">Stock Report</TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="mt-6">
          {activeTab === "production" && <ProductionReport />}
        </TabsContent>

        <TabsContent value="consumption" className="mt-6">
          {activeTab === "consumption" && <ConsumptionReport />}
        </TabsContent>

        <TabsContent value="stock" className="mt-6">
          {activeTab === "stock" && <StockReport />}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
