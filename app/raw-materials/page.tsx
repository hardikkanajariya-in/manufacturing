"use client";

import { MaterialsTable } from "@/components/materials/materials-table";
import { RestockLedger } from "@/components/materials/restock-ledger";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function RawMaterialsPage() {
  return (
    <DashboardShell
      title="Raw Materials"
      description="Inventory management for cement factory inputs"
    >
      <div className="space-y-6">
        <MaterialsTable />
        <RestockLedger />
      </div>
    </DashboardShell>
  );
}
