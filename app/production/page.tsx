"use client";

import { ProductionForm } from "@/components/production/production-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function ProductionPage() {
  return (
    <DashboardShell
      title="Production Entry"
      description="Record output and track material consumption"
    >
      <ProductionForm />
    </DashboardShell>
  );
}
