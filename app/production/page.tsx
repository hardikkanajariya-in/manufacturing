"use client";

import { ProductionLogPanel } from "@/components/production/production-log-panel";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function ProductionPage() {
  return (
    <DashboardShell
      title="Production log"
      description="Record and review shop-floor production runs"
    >
      <ProductionLogPanel />
    </DashboardShell>
  );
}
