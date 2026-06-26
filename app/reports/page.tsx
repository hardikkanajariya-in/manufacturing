"use client";

import * as React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { ConsumptionReport } from "@/components/reports/consumption-report";
import { ProductionReport } from "@/components/reports/production-report";
import { QualityReport } from "@/components/reports/quality-report";
import { StockReport } from "@/components/reports/stock-report";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportsPage() {
  const { user } = useManufacturing();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("production");

  useEffect(() => {
    if (user.role === "Operator") {
      router.push("/production");
    }
  }, [user, router]);

  if (user.role === "Operator") {
    return null;
  }

  return (
    <DashboardShell
      title="Reports"
      description="Production, consumption, and inventory analytics"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="production">
        <TabsList>
          <TabsTrigger value="production">Production & Finance</TabsTrigger>
          <TabsTrigger value="consumption">Material Consumption</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
          <TabsTrigger value="stock">Stock Report</TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="mt-6">
          {activeTab === "production" && <ProductionReport />}
        </TabsContent>

        <TabsContent value="consumption" className="mt-6">
          {activeTab === "consumption" && <ConsumptionReport />}
        </TabsContent>

        <TabsContent value="quality" className="mt-6">
          {activeTab === "quality" && <QualityReport />}
        </TabsContent>

        <TabsContent value="stock" className="mt-6">
          {activeTab === "stock" && <StockReport />}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
