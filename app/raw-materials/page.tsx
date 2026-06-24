"use client";

import { MaterialsTable } from "@/components/materials/materials-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function RawMaterialsPage() {
  return (
    <DashboardShell
      title="Raw Materials"
      description="Inventory management for cement factory inputs"
    >
      <MaterialsTable />
    </DashboardShell>
  );
}
