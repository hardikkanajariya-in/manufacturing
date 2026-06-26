"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, getSupplierRate, getTodayString } from "@/lib/helpers";

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

interface PurchaseBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PurchaseBillDialog({ open, onOpenChange, onSuccess }: PurchaseBillDialogProps) {
  const { materials, suppliers, addRestock } = useManufacturing();
  const activeSuppliers = useMemo(() => suppliers.filter((s) => s.isActive), [suppliers]);

  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(getTodayString());
  const [lineItems, setLineItems] = useState<PurchaseLineItem[]>([createLineItem()]);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  useEffect(() => {
    if (open) {
      const defaultSupplier = activeSuppliers[0];
      const defaultMaterial = materials[0];
      const unitCost = defaultMaterial
        ? getSupplierRate(defaultSupplier, defaultMaterial.id, defaultMaterial.unitCost)
        : 0;
      setSelectedSupplierId(defaultSupplier?.id ?? "");
      setInvoiceNumber("");
      setPurchaseDate(getTodayString());
      setLineItems([createLineItem(defaultMaterial?.id ?? "", unitCost.toString())]);
      setFormError(null);
    }
  }, [open, activeSuppliers, materials]);

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

  const handleAddLine = () => {
    const defaultMaterial = materials[0];
    const unitCost = defaultMaterial
      ? getSupplierRate(selectedSupplier, defaultMaterial.id, defaultMaterial.unitCost)
      : 0;
    setLineItems((prev) => [...prev, createLineItem(defaultMaterial?.id ?? "", unitCost.toString())]);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

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

    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New purchase bill</DialogTitle>
          <DialogDescription>Log a supplier invoice and restock raw materials.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 min-w-0 sm:col-span-1">
              <Label>Supplier</Label>
              <Select value={selectedSupplierId} onValueChange={handleSupplierChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {activeSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bill-invoice">Invoice no.</Label>
              <Input id="bill-invoice" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-2026-1042" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bill-date">Bill date</Label>
              <Input id="bill-date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right w-24">Qty</TableHead>
                  <TableHead className="text-right w-28">Unit ₹</TableHead>
                  <TableHead className="text-right w-24">Total</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((line) => {
                  const qty = Number(line.quantity) || 0;
                  const cost = Number(line.unitCost) || 0;
                  return (
                    <TableRow key={line.key}>
                      <TableCell className="min-w-[140px]">
                        <Select value={line.materialId} onValueChange={(v) => v && handleMaterialChange(line.key, v)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((material) => (
                              <SelectItem key={material.id} value={material.id}>
                                {material.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0.1" step="0.1" value={line.quantity} onChange={(e) => setLineItems((prev) => prev.map((l) => l.key === line.key ? { ...l, quantity: e.target.value } : l))} className="h-9 text-right font-mono text-xs" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" step="0.01" value={line.unitCost} onChange={(e) => setLineItems((prev) => prev.map((l) => l.key === line.key ? { ...l, unitCost: e.target.value } : l))} className="h-9 text-right font-mono text-xs" />
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold tabular-nums">
                        ₹{formatNumber(qty * cost, 2)}
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setLineItems((prev) => prev.length === 1 ? prev : prev.filter((l) => l.key !== line.key))} aria-label="Remove line">
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
              <Plus className="size-4" />
              Add line
            </Button>
            <p className="text-sm font-semibold tabular-nums">
              Bill total: <span className="text-primary">₹{formatNumber(billTotal, 2)}</span>
            </p>
          </div>

          {formError && <p className="text-xs text-destructive">{formError}</p>}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Post bill & restock</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
