"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import {
  Truck,
  TrendingDown,
  ClipboardCopy,
  Send,
  Check,
  Loader2,
  Info,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber, getTodayString } from "@/lib/helpers";
import { cn } from "@/lib/utils";

// Supplier profile structures
interface SupplierProfile {
  name: string;
  materialId: string;
  materialName: string;
  email: string;
  unitCost: number;
  moq: number;
  leadTime: number; // in days
}

const SUPPLIERS: SupplierProfile[] = [
  {
    name: "Ultratech Cement Ltd",
    materialId: "mat-cement",
    materialName: "Cement",
    email: "procurement@ultratechcement.com",
    unitCost: 12.0,
    moq: 1000,
    leadTime: 3,
  },
  {
    name: "Narmada Sands Ltd",
    materialId: "mat-sand",
    materialName: "Sand",
    email: "sales@narmadasands.co.in",
    unitCost: 2.5,
    moq: 2000,
    leadTime: 2,
  },
  {
    name: "Rajasthan Crushers",
    materialId: "mat-stone-dust",
    materialName: "Stone Dust",
    email: "supply@rajasthancrushers.com",
    unitCost: 1.8,
    moq: 1500,
    leadTime: 4,
  },
  {
    name: "NTPC Ash Division",
    materialId: "mat-fly-ash",
    materialName: "Fly Ash",
    email: "flyash.sales@ntpc.co.in",
    unitCost: 3.5,
    moq: 500,
    leadTime: 5,
  },
  {
    name: "Municipal Water Board",
    materialId: "mat-water",
    materialName: "Water",
    email: "support@waterboard.gov.in",
    unitCost: 0.15,
    moq: 2000,
    leadTime: 1,
  },
];

interface PurchaseOrderDraft {
  poNumber: string;
  subject: string;
  emailBody: string;
  deliveryCommitment: string;
  terms: string;
}

function generatePurchaseOrder(
  supplier: string,
  material: string,
  qty: number,
  unit: string,
  cost: number,
  lead: number
): PurchaseOrderDraft {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const poNumber = `PO-2026-${randNum}`;
  const total = qty * cost;
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + lead);
  const formattedDelivery = deliveryDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subject = `Urgent Supply Procurement Order: ${poNumber} - CementPro Factory`;

  const emailBody = `Dear Sales Team at ${supplier},\n\nPlease find this formal procurement order from CementPro Factory (Unit 4) for the replenishment of our concrete production aggregates. We would like to purchase the following materials:\n\n• Material: ${material}\n• Order Quantity: ${qty} ${unit}\n• Contract Rate: ₹${cost.toFixed(2)} / ${unit}\n• Total Amount: ₹${total.toFixed(2)} INR\n\nPlease dispatch this cargo to our central receiving bay. As per our supplier agreements, we expect delivery within the ${lead}-day window (no later than ${formattedDelivery}).\n\nKindly reply to confirm receipt and provide dispatch details.\n\nSincerely,\nRajesh Sharma\nPlant Procurement Manager\nCementPro MES`;

  const deliveryCommitment = `Expected on-site receiving date: ${formattedDelivery} (within ${lead} days of dispatch). Standard unloading hours apply.`;

  const terms = `Payment Terms: Net 30 days invoice settlement. Receiving address: CementPro Unit 4 Warehouse, Sector 12, Industrial Area, Gujarat.`;

  return {
    poNumber,
    subject,
    emailBody,
    deliveryCommitment,
    terms,
  };
}

export function SupplierPortal() {
  const { materials, productionRecords, addRestock } = useManufacturing();

  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierProfile | null>(null);
  const [orderQuantity, setOrderQuantity] = useState("");
  const [poLoading, setPoLoading] = useState(false);
  const [poData, setPoData] = useState<PurchaseOrderDraft | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [poSuccess, setPoSuccess] = useState(false);

  // Calculate daily burn rates based on last 3 days of logs
  const burnRates = useMemo(() => {
    const rates: Record<string, number> = {
      "mat-cement": 250,
      "mat-sand": 600,
      "mat-stone-dust": 450,
      "mat-fly-ash": 80,
      "mat-water": 120,
    };

    if (productionRecords.length === 0) return rates;

    // Calculate consumption from logs in last 72 hours
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const recentLogs = productionRecords.filter(
      (pr) => new Date(pr.productionDate) >= threeDaysAgo
    );

    if (recentLogs.length > 0) {
      // Sum up consumptions
      const totals: Record<string, number> = {};
      recentLogs.forEach((log) => {
        log.consumption.forEach((cons) => {
          totals[cons.materialId] = (totals[cons.materialId] || 0) + cons.quantity;
        });
      });

      // Divide by 3 for daily average
      Object.keys(totals).forEach((id) => {
        rates[id] = Math.max(10, Math.round(totals[id] / 3));
      });
    }

    return rates;
  }, [productionRecords]);

  // Inventory forecasts
  const forecasts = useMemo(() => {
    return materials.map((mat) => {
      const burnRate = burnRates[mat.id] || 100;
      const daysRemaining = mat.availableStock / burnRate;
      
      let status: "Adequate" | "Low Stock" | "Critical" = "Adequate";
      if (daysRemaining <= 2) {
        status = "Critical";
      } else if (daysRemaining <= 5) {
        status = "Low Stock";
      }

      return {
        ...mat,
        burnRate,
        daysRemaining,
        status,
      };
    });
  }, [materials, burnRates]);

  // Open PO drafter and calculate recommended replenishment
  const handleOpenPoDraft = (supplier: SupplierProfile) => {
    setSelectedSupplier(supplier);
    const mat = materials.find((m) => m.id === supplier.materialId);
    const burnRate = burnRates[supplier.materialId] || 100;
    const available = mat?.availableStock ?? 0;
    
    // Safety buffer target is 10 days of operations
    const targetStock = burnRate * 10;
    const deficit = targetStock - available;
    
    // Quantity recommended must respect MCQ/MOQ
    const recommended = Math.max(supplier.moq, Math.ceil(deficit));
    
    setOrderQuantity(recommended.toString());
    setPoData(null);
    setIsCopied(false);
    setPoSuccess(false);
    setPoDialogOpen(true);
  };

  const handleGeneratePo = () => {
    if (!selectedSupplier || !orderQuantity) return;
    setPoLoading(true);
    setPoData(null);

    const unit = materials.find((m) => m.id === selectedSupplier.materialId)?.unit || "Kg";

    try {
      const draft = generatePurchaseOrder(
        selectedSupplier.name,
        selectedSupplier.materialName,
        Number(orderQuantity),
        unit,
        selectedSupplier.unitCost,
        selectedSupplier.leadTime
      );
      setPoData(draft);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to draft procurement letter.");
    } finally {
      setPoLoading(false);
    }
  };

  const handleCopyPo = () => {
    if (!poData) return;
    const fullText = `Subject: ${poData.subject}\n\n${poData.emailBody}\n\nDelivery Terms: ${poData.deliveryCommitment}\n\nStandard Terms: ${poData.terms}`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirmRestock = () => {
    if (!selectedSupplier || !orderQuantity || !poData) return;

    // Trigger context addRestock to increase stock
    addRestock({
      materialId: selectedSupplier.materialId,
      materialName: selectedSupplier.materialName,
      quantity: Number(orderQuantity),
      unit: materials.find((m) => m.id === selectedSupplier.materialId)?.unit || "Kg",
      unitCost: selectedSupplier.unitCost,
      totalCost: Number(orderQuantity) * selectedSupplier.unitCost,
      supplier: selectedSupplier.name,
      date: getTodayString(),
    });

    setPoSuccess(true);
    setTimeout(() => {
      setPoDialogOpen(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* KPI Section */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-slate-900 text-white border-slate-800 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Inventory Burn Audit</span>
            <span className="text-xl font-black mt-1 block">Live Telemetry</span>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              Consumptions assessed over past 72h to calculate exact shop floor burn rates.
            </p>
          </CardContent>
        </Card>

        {forecasts.some((f) => f.status === "Critical") ? (
          <Card className="bg-rose-50 border-rose-250 text-rose-800 shadow-sm">
            <CardContent className="pt-4 pb-4 flex items-start gap-2.5">
              <AlertTriangle className="size-5 text-rose-600 shrink-0 mt-1 animate-pulse" />
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 block">Restock Warnings</span>
                <span className="text-xl font-black mt-0.5 block">Critical Materials</span>
                <p className="text-[10px] text-rose-600/90 mt-1 font-medium leading-relaxed">
                  Raw materials depletion forecast indicates under 48 hours of supply remaining.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-emerald-50 border-emerald-250 text-emerald-800 shadow-sm">
            <CardContent className="pt-4 pb-4 flex items-start gap-2.5">
              <Check className="size-5 text-emerald-600 shrink-0 mt-1" />
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 block">Inventory Health</span>
                <span className="text-xl font-black mt-0.5 block">All Stocks Safe</span>
                <p className="text-[10px] text-emerald-600/90 mt-1 font-medium leading-relaxed">
                  Daily safety limits met. Minimum 5 days buffer of aggregate and binder.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Active Suppliers</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800">{SUPPLIERS.length}</span>
              <span className="text-xs text-slate-400 font-medium">vendors contracted</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-relaxed">
              Standard Net-30 contracts. Pricing reviewed against lead-time records.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Stock Depletion Forecast Table */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="py-4 border-b border-slate-100 px-6">
          <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            Material depletion & burn rates forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 pl-6">Material</th>
                  <th className="py-3 text-right">Available Stock</th>
                  <th className="py-3 text-right">Daily Burn Rate</th>
                  <th className="py-3 text-right">Days Remaining</th>
                  <th className="py-3 pl-6">Depletion Forecast</th>
                  <th className="py-3 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forecasts.map((forecast) => {
                  const supplier = SUPPLIERS.find((s) => s.materialId === forecast.id);
                  return (
                    <tr key={forecast.id} className="hover:bg-slate-50/30">
                      <td className="py-3.5 pl-6 font-bold text-slate-700">
                        {forecast.name}
                        <span className="text-[10px] font-mono text-slate-400 block font-normal">
                          ({forecast.unit})
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-mono font-semibold text-slate-650">
                        {formatNumber(forecast.availableStock)} {forecast.unit}
                      </td>
                      <td className="py-3.5 text-right font-mono font-medium text-slate-500">
                        {forecast.burnRate} {forecast.unit}/day
                      </td>
                      <td className={cn(
                        "py-3.5 text-right font-mono font-black",
                        forecast.status === "Critical"
                          ? "text-rose-600"
                          : forecast.status === "Low Stock"
                            ? "text-amber-600"
                            : "text-emerald-600"
                      )}>
                        {forecast.daysRemaining.toFixed(1)} Days
                      </td>
                      <td className="py-3.5 pl-6">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border",
                            forecast.status === "Adequate"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                              : forecast.status === "Low Stock"
                                ? "bg-amber-50 text-amber-700 border-amber-250 animate-pulse"
                                : "bg-rose-50 text-rose-700 border-rose-250 animate-pulse"
                          )}
                        >
                          {forecast.status === "Adequate" && "Adequate Cushion"}
                          {forecast.status === "Low Stock" && "Restock Suggested"}
                          {forecast.status === "Critical" && "CRITICAL SHORTAGE"}
                        </Badge>
                      </td>
                      <td className="py-3.5 pr-6 text-right">
                        {supplier && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPoDraft(supplier)}
                            className="text-xs flex gap-1 items-center shrink-0 ml-auto border-sky-200 hover:border-sky-500 hover:bg-sky-50 text-sky-700 cursor-pointer"
                          >
                            <Truck className="size-3.5" />
                            Draft restock PO
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Supplier contact directories */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="py-4 border-b border-slate-100">
            <CardTitle className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Truck className="size-4 text-slate-400" />
              Contracted Supplier Directory
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs">
            <div className="divide-y divide-slate-100">
              {SUPPLIERS.map((supplier) => (
                <div key={supplier.name} className="p-4 flex justify-between items-start hover:bg-slate-50/20">
                  <div>
                    <h4 className="font-extrabold text-slate-700">{supplier.name}</h4>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{supplier.email}</span>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                      Material: {supplier.materialName}
                    </span>
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-500 space-y-1">
                    <span className="block">Rate: ₹{supplier.unitCost}/{supplier.materialId === "mat-water" ? "L" : "Kg"}</span>
                    <span className="block text-slate-400">MOQ: {supplier.moq} units</span>
                    <span className="block text-sky-600 font-bold bg-sky-50 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                      Lead: {supplier.leadTime} days
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info card */}
        <Card className="border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <CardHeader className="py-4 border-b border-slate-100">
            <CardTitle className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Info className="size-4 text-slate-400" />
              Procurement & Restock Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs text-slate-500 leading-relaxed font-medium">
            <p>
              • <strong>Inventory Targets:</strong> CementPro targets maintaining a minimum of 10 days operating buffer in central storage silos.
            </p>
            <p>
              • <strong>PO Drafting:</strong> Click the "Draft restock PO" button next to any depletion row. The system calculates inventory deficits and generates a formal procurement letter.
            </p>
            <p>
              • <strong>Automated Booking:</strong> Confirming the generated PO instantly logs the transaction into our **Replenishment Ledger** and adds raw stock to our active inventory.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Log Restock / Draft PO Dialog */}
      <Dialog open={poDialogOpen} onOpenChange={setPoDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border border-slate-200 rounded-xl shadow-lg">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Truck className="size-5 text-sky-600" />
              Draft Restock Order: {selectedSupplier?.materialName}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              Select replenishment quantities to generate a formal procurement letter.
            </DialogDescription>
          </DialogHeader>

          {poSuccess ? (
            <div className="py-12 text-center space-y-3">
              <div className="size-12 rounded-full bg-emerald-100 border border-emerald-250 flex items-center justify-center mx-auto text-emerald-600">
                <Check className="size-6" />
              </div>
              <p className="text-sm font-bold text-slate-700 animate-pulse">Restock Logged Successfully!</p>
              <p className="text-xs text-slate-400">Inventory levels have been refilled in storage silos.</p>
            </div>
          ) : (
            <div className="space-y-4 py-4 text-xs">
              {/* Supplier information cards */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Supplier Vendor</span>
                  <span className="text-xs font-black text-slate-700 mt-0.5 block">{selectedSupplier?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Contract Rate</span>
                  <span className="text-xs font-black text-slate-700 mt-0.5 block font-mono">
                    ₹{selectedSupplier?.unitCost}/{selectedSupplier?.materialId === "mat-water" ? "L" : "Kg"}
                  </span>
                </div>
              </div>

              {/* Order quantity input */}
              <div className="space-y-1.5">
                <Label htmlFor="po-qty" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Replenishment Order Size ({materials.find((m) => m.id === selectedSupplier?.materialId)?.unit || "Kg"})
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="po-qty"
                    type="number"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 text-xs h-9 flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleGeneratePo}
                    disabled={poLoading || !orderQuantity || Number(orderQuantity) < (selectedSupplier?.moq || 0)}
                    className="h-9 px-4 text-xs flex gap-1.5 items-center cursor-pointer shrink-0"
                  >
                    {poLoading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Drafting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="size-3.5" />
                        Draft PO
                      </>
                    )}
                  </Button>
                </div>
                {selectedSupplier && Number(orderQuantity) < selectedSupplier.moq && (
                  <span className="text-[9px] text-rose-500 font-bold block">
                    Quantity is below Supplier Minimum Order (MOQ: {selectedSupplier.moq} units).
                  </span>
                )}
              </div>

              {poData && (
                <div className="space-y-2 border-t border-slate-100 pt-3 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-sky-700 uppercase tracking-wider">
                      Drafted Purchase Order ({poData.poNumber})
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPo}
                      className="text-[9px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer uppercase bg-sky-50 border border-sky-100 rounded-md px-1.5 py-0.5"
                    >
                      {isCopied ? (
                        <>
                          <Check className="size-3 text-emerald-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="size-3" />
                          Copy PO
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Subject */}
                  <div className="p-2 border border-slate-200 bg-slate-50/50 rounded-lg text-slate-700 leading-tight">
                    <strong className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Subject</strong>
                    {poData.subject}
                  </div>

                  {/* Body text area */}
                  <textarea
                    readOnly
                    value={poData.emailBody}
                    rows={6}
                    className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-lg text-[10px] font-mono text-slate-600 focus:outline-hidden"
                  />

                  {/* Commit check warning */}
                  <div className="flex items-start gap-2 bg-emerald-50/30 border border-emerald-250 p-2.5 rounded-lg text-[10px] text-slate-600">
                    <Info className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      Clicking <strong>Confirm PO Restock</strong> will book this replenishment to storage levels, adding <strong>{formatNumber(Number(orderQuantity))}</strong> units of {selectedSupplier?.materialName}.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-slate-100 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPoDialogOpen(false)}
              className="text-xs h-9 cursor-pointer"
            >
              Cancel
            </Button>
            {poData && !poSuccess && (
              <Button
                type="button"
                onClick={handleConfirmRestock}
                className="text-xs h-9 bg-sky-600 hover:bg-sky-500 text-white cursor-pointer flex gap-1 items-center"
              >
                <Check className="size-3.5" />
                Confirm PO Restock
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
