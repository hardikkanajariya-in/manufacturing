"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { MaterialsTable } from "@/components/materials/materials-table";
import { RestockLedger } from "@/components/materials/restock-ledger";
import { StockCardLedger } from "@/components/materials/stock-card-ledger";
import { SupplierPortal } from "@/components/materials/supplier-portal";
import { DashboardShell } from "@/components/layout/dashboard-shell";

import { Card, CardContent } from "@/components/ui/card";
import { Boxes, AlertTriangle, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/helpers";
import { cn } from "@/lib/utils";

export default function RawMaterialsPage() {
  const { user, materials } = useManufacturing();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"stock" | "replenishment" | "suppliers">("stock");
  const [showLedger, setShowLedger] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

  useEffect(() => {
    if (user.role === "Operator") {
      router.push("/production");
    }
  }, [user, router]);

  // Set initial selected material once materials load
  useEffect(() => {
    if (!selectedMaterialId && materials.length > 0) {
      setSelectedMaterialId(materials[0].id);
    }
  }, [materials, selectedMaterialId]);

  if (user.role === "Operator") {
    return null;
  }

  // Calculate KPI Metrics
  const totalMaterials = materials.length;
  
  const lowStockCount = materials.filter(
    (m) => m.availableStock <= m.minimumStock
  ).length;

  const totalAssetValue = materials.reduce(
    (sum, m) => sum + m.availableStock * m.unitCost,
    0
  );

  const handleSelectMaterial = (id: string) => {
    setSelectedMaterialId(id);
    setShowLedger(true);
  };

  return (
    <DashboardShell
      title="Raw Materials"
      description="Inventory management and stock card audits"
    >
      <div className="space-y-6">
        {/* Screen-level Tabs Selector */}
        <div className="flex border-b border-slate-200 gap-6 mb-2 pb-0.5">
          <button
            onClick={() => {
              setActiveTab("stock");
              setShowLedger(false);
            }}
            className={cn(
              "pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer",
              activeTab === "stock"
                ? "border-sky-600 text-sky-600 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Stock Directory
          </button>
          <button
            onClick={() => {
              setActiveTab("replenishment");
              setShowLedger(false);
            }}
            className={cn(
              "pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer",
              activeTab === "replenishment"
                ? "border-sky-600 text-sky-600 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Replenishment Logs
          </button>
          <button
            onClick={() => {
              setActiveTab("suppliers");
              setShowLedger(false);
            }}
            className={cn(
              "pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer",
              activeTab === "suppliers"
                ? "border-sky-600 text-sky-600 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Suppliers & Purchases
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "stock" ? (
          showLedger && selectedMaterialId ? (
            <div className="animate-fadeIn">
              <StockCardLedger 
                materialId={selectedMaterialId} 
                onBack={() => setShowLedger(false)} 
              />
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {/* Inventory Summary KPI Row */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Material Types</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">{totalMaterials}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Registered raw items</p>
                    </div>
                    <div className="size-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                      <Boxes className="size-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Stock Warnings</p>
                      <p className={`text-2xl font-black mt-1 ${lowStockCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {lowStockCount}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">At or below minimum stock</p>
                    </div>
                    <div className={`size-10 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? "bg-amber-50 text-amber-600 animate-pulse" : "bg-emerald-50 text-emerald-600"}`}>
                      <AlertTriangle className="size-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inventory Value</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1">₹{formatNumber(totalAssetValue, 2)}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Current stock asset valuation</p>
                    </div>
                    <div className="size-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                      <TrendingUp className="size-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Full-width Materials Table */}
              <div className="w-full">
                <MaterialsTable
                  onSelectMaterial={handleSelectMaterial}
                  selectedMaterialId={selectedMaterialId}
                />
              </div>
            </div>
          )
        ) : activeTab === "replenishment" ? (
          /* Full-width Replenishment Logs */
          <div className="w-full animate-fadeIn">
            <RestockLedger />
          </div>
        ) : (
          /* Suppliers & purchase entry */
          <div className="w-full animate-fadeIn">
            <SupplierPortal />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

