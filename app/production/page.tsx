"use client";

import * as React from "react";
import { ProductionForm } from "@/components/production/production-form";
import { WorkOrdersList } from "@/components/production/work-orders";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageTabs } from "@/components/layout/page-tabs";

export default function ProductionPage() {
  const [activeTab, setActiveTab] = React.useState<"entry" | "work-orders">("entry");

  return (
    <DashboardShell
      title="Shop Floor Operations"
      description="Record direct outputs or manage scheduled work orders"
    >
      <div className="space-y-6">
        <PageTabs
          tabs={[
            { id: "entry", label: "Production logging" },
            { id: "work-orders", label: "Work orders schedule" },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as "entry" | "work-orders")}
        />

        {activeTab === "entry" ? (
          <div className="animate-fadeIn">
            <ProductionForm />
          </div>
        ) : (
          <div className="animate-fadeIn">
            <WorkOrdersList />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
