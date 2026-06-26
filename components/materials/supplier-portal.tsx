"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Truck,
  Plus,
  Trash2,
  FileText,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { SupplierDialog } from "@/components/materials/supplier-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, getSupplierRate, getTodayString } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { RestockRecord, Supplier } from "@/lib/types";

interface PurchaseLineItem {
  key: string;
  materialId: string;
  quantity: string;
  unitCost: string;
}

function createLineItem(materialId = "", unitCost = ""): PurchaseLineItem {
  return {
    key: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    materialId,
    quantity: "",
    unitCost,
  };
}

function groupPurchaseBills(restocks: RestockRecord[]) {
  const groups = new Map<string, RestockRecord[]>();

  restocks.forEach((record) => {
    const key = `${record.invoiceNumber ?? record.id}-${record.supplier}-${record.date}`;
    const existing = groups.get(key) ?? [];
    existing.push(record);
    groups.set(key, existing);
  });

  return Array.from(groups.values())
    .map((lines) => ({
      invoiceNumber: lines[0].invoiceNumber ?? "—",
      supplier: lines[0].supplier,
      date: lines[0].date,
      lines,
      total: lines.reduce((sum, line) => sum + line.totalCost, 0),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function SupplierPortal() {
  const { materials, restocks, suppliers, addRestock, deleteSupplier } = useManufacturing();

  const activeSuppliers = useMemo(() => suppliers.filter((s) => s.isActive), [suppliers]);

  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(getTodayString());
  const [lineItems, setLineItems] = useState<PurchaseLineItem[]>([createLineItem()]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!activeSuppliers.some((s) => s.id === selectedSupplierId)) {
      setSelectedSupplierId(activeSuppliers[0]?.id ?? "");
    }
  }, [activeSuppliers, selectedSupplierId]);

  const selectedSupplier = suppliers.find((supplier) => supplier.id === selectedSupplierId);

  const recentBills = useMemo(() => groupPurchaseBills(restocks).slice(0, 8), [restocks]);

  const billTotal = useMemo(
    () =>
      lineItems.reduce((sum, line) => {
        const qty = Number(line.quantity) || 0;
        const cost = Number(line.unitCost) || 0;
        return sum + qty * cost;
      }, 0),
    [lineItems]
  );

  const handleSupplierChange = (supplierId: string | null) => {
    if (!supplierId) return;
    setSelectedSupplierId(supplierId);
    const supplier = suppliers.find((item) => item.id === supplierId);
    setLineItems((prev) =>
      prev.map((line) => {
        if (!line.materialId) return line;
        const material = materials.find((item) => item.id === line.materialId);
        return {
          ...line,
          unitCost: getSupplierRate(supplier, line.materialId, material?.unitCost ?? 0).toString(),
        };
      })
    );
  };

  const handleMaterialChange = (key: string, materialId: string) => {
    const material = materials.find((item) => item.id === materialId);
    const unitCost = getSupplierRate(selectedSupplier, materialId, material?.unitCost ?? 0);
    setLineItems((prev) =>
      prev.map((line) =>
        line.key === key ? { ...line, materialId, unitCost: unitCost.toString() } : line
      )
    );
  };

  const handleLineFieldChange = (key: string, field: "quantity" | "unitCost", value: string) => {
    setLineItems((prev) =>
      prev.map((line) => (line.key === key ? { ...line, [field]: value } : line))
    );
  };

  const handleAddLine = () => {
    const defaultMaterial = materials[0];
    const unitCost = defaultMaterial
      ? getSupplierRate(selectedSupplier, defaultMaterial.id, defaultMaterial.unitCost)
      : 0;
    setLineItems((prev) => [
      ...prev,
      createLineItem(defaultMaterial?.id ?? "", unitCost.toString()),
    ]);
  };

  const handleRemoveLine = (key: string) => {
    setLineItems((prev) => (prev.length === 1 ? prev : prev.filter((line) => line.key !== key)));
  };

  const resetForm = () => {
    const defaultMaterial = materials[0];
    const unitCost = defaultMaterial
      ? getSupplierRate(selectedSupplier, defaultMaterial.id, defaultMaterial.unitCost)
      : 0;
    setInvoiceNumber("");
    setPurchaseDate(getTodayString());
    setLineItems([createLineItem(defaultMaterial?.id ?? "", unitCost.toString())]);
    setFormError(null);
  };

  const handleSubmitPurchase = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setSubmitSuccess(false);

    if (!selectedSupplier) {
      setFormError("Select a supplier for this purchase bill.");
      return;
    }

    if (!invoiceNumber.trim()) {
      setFormError("Enter the supplier invoice or bill number.");
      return;
    }

    const validLines = lineItems
      .map((line) => {
        const material = materials.find((item) => item.id === line.materialId);
        const qty = Number(line.quantity);
        const cost = Number(line.unitCost);
        return { line, material, qty, cost };
      })
      .filter((entry) => entry.material && entry.qty > 0 && entry.cost >= 0);

    if (validLines.length === 0) {
      setFormError("Add at least one material line with quantity and unit cost.");
      return;
    }

    validLines.forEach(({ material, qty, cost }) => {
      addRestock({
        materialId: material!.id,
        materialName: material!.name,
        quantity: qty,
        unit: material!.unit,
        unitCost: cost,
        totalCost: qty * cost,
        supplier: selectedSupplier.name,
        invoiceNumber: invoiceNumber.trim(),
        date: purchaseDate,
      });
    });

    setSubmitSuccess(true);
    resetForm();
    setTimeout(() => setSubmitSuccess(false), 2500);
  };

  const openAddSupplier = () => {
    setEditingSupplier(null);
    setDialogOpen(true);
  };

  const openEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setDialogOpen(true);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    if (
      !window.confirm(
        `Remove "${supplier.name}" from the supplier directory? Past purchase records will keep this name.`
      )
    ) {
      return;
    }
    deleteSupplier(supplier.id);
    if (selectedSupplierId === supplier.id) {
      setSelectedSupplierId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2 border-slate-200 bg-white shadow-xs">
          <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="size-4 text-slate-500" />
              Supplier Directory
            </CardTitle>
            <Button
              type="button"
              size="sm"
              onClick={openAddSupplier}
              className="text-[10px] font-bold uppercase tracking-wider h-8"
            >
              <Plus className="size-3.5" />
              Add supplier
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {suppliers.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                No suppliers yet.{" "}
                <button type="button" onClick={openAddSupplier} className="text-sky-600 underline">
                  Add your first supplier
                </button>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 pl-4">Supplier</th>
                    <th className="py-3">Contact</th>
                    <th className="py-3">Terms</th>
                    <th className="py-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className={cn(
                        "hover:bg-slate-50/40 cursor-pointer",
                        selectedSupplierId === supplier.id && "bg-sky-50/60",
                        !supplier.isActive && "opacity-60"
                      )}
                      onClick={() => supplier.isActive && handleSupplierChange(supplier.id)}
                    >
                      <td className="py-3.5 pl-4">
                        <span className="font-bold text-slate-700 block">{supplier.name}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {supplier.materialRates
                            .map((rate) => materials.find((m) => m.id === rate.materialId)?.name)
                            .filter(Boolean)
                            .join(", ") || "No rates set"}
                        </span>
                        {!supplier.isActive && (
                          <Badge variant="outline" className="mt-1 text-[9px]">Inactive</Badge>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-500">{supplier.contact}</td>
                      <td className="py-3.5">
                        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-slate-50">
                          {supplier.paymentTerms}
                        </Badge>
                      </td>
                      <td className="py-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openEditSupplier(supplier)}
                            className="p-1.5 text-slate-400 hover:text-sky-600 transition-colors"
                            aria-label={`Edit ${supplier.name}`}
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSupplier(supplier)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                            aria-label={`Delete ${supplier.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3 border-slate-200 bg-white shadow-xs">
          <CardHeader className="py-4 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="size-4 text-sky-600" />
              New Purchase Bill Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmitPurchase} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Supplier
                  </Label>
                  <Select value={selectedSupplierId} onValueChange={handleSupplierChange}>
                    <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-xs h-10">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200" align="start">
                      {activeSuppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invoice-number" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Invoice / Bill No.
                  </Label>
                  <Input
                    id="invoice-number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-2026-1042"
                    className="bg-slate-50 border-slate-200 text-xs h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="purchase-date" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Bill Date
                  </Label>
                  <Input
                    id="purchase-date"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-xs h-10"
                    required
                  />
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/75">
                    <TableRow className="border-b border-slate-150">
                      <TableHead className="font-bold text-[10px] text-slate-500 py-2.5 pl-3">Material</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-500 py-2.5 text-right w-28">Quantity</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-500 py-2.5 text-right w-32">Unit Cost (₹)</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-500 py-2.5 text-right w-28">Line Total</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-500 py-2.5 pr-3 w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((line) => {
                      const qty = Number(line.quantity) || 0;
                      const cost = Number(line.unitCost) || 0;
                      const lineTotal = qty * cost;
                      return (
                        <TableRow key={line.key} className="border-b border-slate-100">
                          <TableCell className="py-2 pl-3 min-w-0">
                            <Select
                              value={line.materialId}
                              onValueChange={(value) => value && handleMaterialChange(line.key, value)}
                            >
                              <SelectTrigger className="w-full bg-white border-slate-200 text-xs h-9">
                                <SelectValue placeholder="Select material" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200" align="start">
                                {materials.map((material) => (
                                  <SelectItem key={material.id} value={material.id}>
                                    {material.name} ({material.unit})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <Input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={line.quantity}
                              onChange={(e) => handleLineFieldChange(line.key, "quantity", e.target.value)}
                              placeholder="0"
                              className="bg-white border-slate-200 text-xs h-9 text-right font-mono"
                            />
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unitCost}
                              onChange={(e) => handleLineFieldChange(line.key, "unitCost", e.target.value)}
                              placeholder="0.00"
                              className="bg-white border-slate-200 text-xs h-9 text-right font-mono"
                            />
                          </TableCell>
                          <TableCell className="py-2 text-right font-mono font-bold text-slate-700 text-xs tabular-nums">
                            ₹{formatNumber(lineTotal, 2)}
                          </TableCell>
                          <TableCell className="py-2 pr-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(line.key)}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                              aria-label="Remove line"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddLine}
                  className="text-xs font-bold uppercase tracking-wider h-9 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="size-4" />
                  Add Material Line
                </Button>

                <div className="rounded-xl bg-slate-900 text-white px-4 py-3 flex items-center justify-between sm:min-w-[220px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bill Total</span>
                  <span className="text-lg font-black tabular-nums">₹{formatNumber(billTotal, 2)}</span>
                </div>
              </div>

              {formError && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                  {formError}
                </div>
              )}

              {submitSuccess && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Purchase bill logged. Stock levels updated for all line items.
                </div>
              )}

              <Button type="submit" className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider h-10 cursor-pointer">
                Post Purchase Bill & Restock
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="py-4 border-b border-slate-100 px-6">
          <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            Recent Purchase Bills
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentBills.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-400 border-t border-slate-100">
              No purchase bills recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 pl-6">Date</th>
                    <th className="py-3">Invoice No.</th>
                    <th className="py-3">Supplier</th>
                    <th className="py-3">Materials</th>
                    <th className="py-3 pr-6 text-right">Bill Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBills.map((bill) => (
                    <tr key={`${bill.invoiceNumber}-${bill.supplier}-${bill.date}`} className="hover:bg-slate-50/30">
                      <td className="py-3.5 pl-6 text-slate-500 font-medium">
                        {format(new Date(bill.date), "dd MMM yyyy")}
                      </td>
                      <td className="py-3.5 font-mono font-bold text-slate-700">{bill.invoiceNumber}</td>
                      <td className="py-3.5 text-slate-700">{bill.supplier}</td>
                      <td className="py-3.5 text-slate-500">
                        {bill.lines
                          .map((line) => `${line.materialName} (${formatNumber(line.quantity, 0)} ${line.unit})`)
                          .join(" · ")}
                      </td>
                      <td className="py-3.5 pr-6 text-right font-mono font-black text-emerald-600 tabular-nums">
                        ₹{formatNumber(bill.total, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <SupplierDialog open={dialogOpen} onOpenChange={setDialogOpen} supplier={editingSupplier} />
    </div>
  );
}
