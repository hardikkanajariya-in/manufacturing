"use client";

import * as React from "react";
import { ProductionForm } from "@/components/production/production-form";
import { WorkOrdersList } from "@/components/production/work-orders";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProductionPage() {
  const [activeTab, setActiveTab] = React.useState("entry");

  return (
    <DashboardShell
      title="Shop Floor Operations"
      description="Record direct outputs or manage scheduled work orders"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="entry">
        <TabsList>
          <TabsTrigger value="entry">Production Logging</TabsTrigger>
          <TabsTrigger value="work-orders">Work Orders Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="mt-6">
          {activeTab === "entry" && <ProductionForm />}
        </TabsContent>

        <TabsContent value="work-orders" className="mt-6">
          {activeTab === "work-orders" && <WorkOrdersList />}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
