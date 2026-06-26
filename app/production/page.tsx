"use client";

import * as React from "react";
import { ProductionForm } from "@/components/production/production-form";
import { WorkOrdersList } from "@/components/production/work-orders";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { cn } from "@/lib/utils";

export default function ProductionPage() {
  const [activeTab, setActiveTab] = React.useState<"entry" | "work-orders">("entry");

  return (
    <DashboardShell
      title="Shop Floor Operations"
      description="Record direct outputs or manage scheduled work orders"
    >
      <div className="space-y-6">
        {/* Custom Tab Selector */}
        <div className="flex border-b border-slate-200 gap-6 mb-2 pb-0.5">
          <button
            onClick={() => setActiveTab("entry")}
            className={cn(
              "pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer",
              activeTab === "entry"
                ? "border-sky-600 text-sky-600 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Production Logging
          </button>
          <button
            onClick={() => setActiveTab("work-orders")}
            className={cn(
              "pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer",
              activeTab === "work-orders"
                ? "border-sky-600 text-sky-600 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Work Orders Schedule
          </button>
        </div>

        {/* Tab Contents */}
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
