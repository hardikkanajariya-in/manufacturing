"use client";

import { WorkOrdersList } from "@/components/production/work-orders";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function ProductionSchedulePage() {
  return (
    <DashboardShell
      title="Work orders"
      description="Schedule production batches and track their lifecycle"
    >
      <WorkOrdersList />
    </DashboardShell>
  );
}
