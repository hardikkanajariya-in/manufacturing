"use client";

import { Suspense } from "react";
import { InventoryPageContent } from "@/components/inventory/inventory-page-content";
import { DashboardShell } from "@/components/layout/dashboard-shell";

function InventoryFallback() {
  return (
    <DashboardShell
      title="Inventory"
      description="Raw materials, finished goods warehouse, and stock movement ledgers"
    >
      <p className="text-sm text-muted-foreground">Loading inventory…</p>
    </DashboardShell>
  );
}

export default function RawMaterialsPage() {
  return (
    <Suspense fallback={<InventoryFallback />}>
      <InventoryPageContent />
    </Suspense>
  );
}
