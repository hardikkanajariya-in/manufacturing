"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { MaterialsTable } from "@/components/materials/materials-table";
import { StockCardLedger } from "@/components/materials/stock-card-ledger";
import { PurchaseBillsPanel } from "@/components/materials/purchase-bills-panel";
import { SupplierDirectory } from "@/components/materials/supplier-directory";
import { RestockLedger } from "@/components/materials/restock-ledger";
import { FinishedGoodsWarehouse } from "@/components/inventory/finished-goods-warehouse";
import { RawMaterialLedger } from "@/components/inventory/raw-material-ledger";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageTabs } from "@/components/layout/page-tabs";

type InventoryTab = "raw" | "raw-ledger" | "finished" | "purchases";
type PurchaseSubTab = "bills" | "suppliers" | "lines";

export function InventoryPageContent() {
  const { user } = useManufacturing();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const initialTab: InventoryTab =
    tabParam === "finished" || tabParam === "purchases" || tabParam === "raw-ledger"
      ? tabParam
      : "raw";

  const [activeTab, setActiveTab] = useState<InventoryTab>(initialTab);
  const [purchaseSubTab, setPurchaseSubTab] = useState<PurchaseSubTab>("bills");
  const [showLedger, setShowLedger] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

  useEffect(() => {
    if (user.role === "Operator") {
      router.push("/production");
    }
  }, [user, router]);

  useEffect(() => {
    if (
      tabParam === "finished" ||
      tabParam === "purchases" ||
      tabParam === "raw-ledger" ||
      tabParam === "raw"
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  if (user.role === "Operator") {
    return null;
  }

  const handleSelectMaterial = (id: string) => {
    setSelectedMaterialId(id);
    setShowLedger(true);
  };

  return (
    <DashboardShell
      title="Inventory"
      description="Raw materials, finished goods warehouse, and stock movement ledgers"
    >
      <div className="space-y-6">
        <PageTabs
          tabs={[
            { id: "raw", label: "Raw materials" },
            { id: "raw-ledger", label: "Raw inflow / outflow" },
            { id: "finished", label: "Finished warehouse" },
            { id: "purchases", label: "Purchases" },
          ]}
          activeTab={activeTab}
          onChange={(id) => {
            setActiveTab(id as InventoryTab);
            setShowLedger(false);
          }}
          className="mb-4"
        />

        {activeTab === "raw" ? (
          showLedger && selectedMaterialId ? (
            <StockCardLedger
              materialId={selectedMaterialId}
              onBack={() => setShowLedger(false)}
            />
          ) : (
            <MaterialsTable
              onSelectMaterial={handleSelectMaterial}
              selectedMaterialId={selectedMaterialId}
            />
          )
        ) : activeTab === "raw-ledger" ? (
          <RawMaterialLedger />
        ) : activeTab === "finished" ? (
          <FinishedGoodsWarehouse />
        ) : (
          <div className="space-y-4">
            <PageTabs
              tabs={[
                { id: "bills", label: "Purchase bills" },
                { id: "suppliers", label: "Suppliers" },
                { id: "lines", label: "Line items" },
              ]}
              activeTab={purchaseSubTab}
              onChange={(id) => setPurchaseSubTab(id as PurchaseSubTab)}
            />
            {purchaseSubTab === "bills" && <PurchaseBillsPanel />}
            {purchaseSubTab === "suppliers" && <SupplierDirectory />}
            {purchaseSubTab === "lines" && <RestockLedger />}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
