"use client";

import { GanttScheduler } from "@/components/production/gantt-scheduler";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function ProductionTimelinePage() {
  return (
    <DashboardShell
      title="Gantt timeline"
      description="Visualize, reschedule, and manage shop floor work order distribution"
    >
      <GanttScheduler />
    </DashboardShell>
  );
}
