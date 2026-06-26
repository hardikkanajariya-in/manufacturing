"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { LowStockAlertCard } from "@/components/dashboard/low-stock-alert";
import { MaterialConsumptionChart } from "@/components/dashboard/material-consumption-chart";
import { ProductionChart } from "@/components/dashboard/production-chart";
import { RecentProductionTable } from "@/components/dashboard/recent-production-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardPage() {
  const { user } = useManufacturing();
  const router = useRouter();

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
      title="Dashboard"
      description="Factory overview and production monitoring"
    >
      <div className="space-y-6">
        <KpiCards />

        <div className="grid gap-6 xl:grid-cols-2">
          <ProductionChart />
          <MaterialConsumptionChart />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RecentProductionTable />
          </div>
          <LowStockAlertCard />
        </div>
      </div>
    </DashboardShell>
  );
}
