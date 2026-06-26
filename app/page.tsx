"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { ProductionChart } from "@/components/dashboard/production-chart";
import { MaterialConsumptionChart } from "@/components/dashboard/material-consumption-chart";
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
    <DashboardShell title="Dashboard" description="Production and material usage trends">
      <div className="grid gap-6 xl:grid-cols-2">
        <ProductionChart />
        <MaterialConsumptionChart />
      </div>
    </DashboardShell>
  );
}
