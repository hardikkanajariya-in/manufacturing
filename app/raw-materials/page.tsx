"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { MaterialsTable } from "@/components/materials/materials-table";
import { RestockLedger } from "@/components/materials/restock-ledger";
import { StockCardLedger } from "@/components/materials/stock-card-ledger";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function RawMaterialsPage() {
  const { user, materials } = useManufacturing();
  const router = useRouter();

  useEffect(() => {
    if (user.role === "Operator") {
      router.push("/production");
    }
  }, [user, router]);

  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(
    materials[0]?.id ?? null
  );

  // Fallback to first material if none selected but materials exist
  useEffect(() => {
    if (!selectedMaterialId && materials.length > 0) {
      setSelectedMaterialId(materials[0].id);
    }
  }, [materials, selectedMaterialId]);

  if (user.role === "Operator") {
    return null;
  }

  return (
    <DashboardShell
      title="Raw Materials"
      description="Inventory management and stock card audits"
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <MaterialsTable
            onSelectMaterial={setSelectedMaterialId}
            selectedMaterialId={selectedMaterialId}
          />
          <RestockLedger />
        </div>
        <div className="xl:col-span-1">
          <StockCardLedger materialId={selectedMaterialId} />
        </div>
      </div>
    </DashboardShell>
  );
}
