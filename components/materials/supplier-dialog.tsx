"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useManufacturing } from "@/context/manufacturing-context";
import type { Supplier, SupplierMaterialRate } from "@/lib/types";

interface RateLine {
  key: string;
  materialId: string;
  unitCost: string;
}

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
}

function createRateLine(materialId = "", unitCost = ""): RateLine {
  return {
    key: `rate-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    materialId,
    unitCost,
  };
}

export function SupplierDialog({ open, onOpenChange, supplier }: SupplierDialogProps) {
  const { materials, addSupplier, updateSupplier } = useManufacturing();
  const isEditing = supplier !== null;

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [isActive, setIsActive] = useState(true);
  const [rateLines, setRateLines] = useState<RateLine[]>([createRateLine()]);

  useEffect(() => {
    if (!open) return;

    setName(supplier?.name ?? "");
    setContact(supplier?.contact ?? "");
    setPaymentTerms(supplier?.paymentTerms ?? "Net 30");
    setIsActive(supplier?.isActive ?? true);
    setRateLines(
      supplier?.materialRates.length
        ? supplier.materialRates.map((rate) =>
            createRateLine(rate.materialId, rate.unitCost.toString())
          )
        : [createRateLine(materials[0]?.id ?? "", materials[0]?.unitCost.toString() ?? "")]
    );
  }, [open, supplier, materials]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedContact = contact.trim();
    if (!trimmedName || !trimmedContact) return;

    const materialRates: SupplierMaterialRate[] = rateLines
      .filter((line) => line.materialId && Number(line.unitCost) >= 0)
      .map((line) => ({
        materialId: line.materialId,
        unitCost: Number(line.unitCost),
      }));

    const payload = {
      name: trimmedName,
      contact: trimmedContact,
      paymentTerms: paymentTerms.trim() || "Net 30",
      materialRates,
      isActive,
    };

    if (isEditing && supplier) {
      updateSupplier(supplier.id, payload);
    } else {
      addSupplier(payload);
    }

    onOpenChange(false);
  };

  const handleAddRate = () => {
    const defaultMaterial = materials[0];
    setRateLines((prev) => [
      ...prev,
      createRateLine(defaultMaterial?.id ?? "", defaultMaterial?.unitCost.toString() ?? ""),
    ]);
  };

  const handleRemoveRate = (key: string) => {
    setRateLines((prev) => (prev.length === 1 ? prev : prev.filter((line) => line.key !== key)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white border border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Truck className="size-5 text-sky-600" />
            {isEditing ? "Edit Supplier" : "Add Supplier"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            {isEditing
              ? "Update vendor details and negotiated material rates."
              : "Register a new supplier for purchase bills and restocking."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="supplier-name" className="text-xs font-bold text-slate-700">
              Supplier name
            </Label>
            <Input
              id="supplier-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ultratech Cement Ltd"
              className="bg-slate-50 border-slate-200 text-sm h-10"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="supplier-contact" className="text-xs font-bold text-slate-700">
                Contact (email / phone)
              </Label>
              <Input
                id="supplier-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="procurement@vendor.com"
                className="bg-slate-50 border-slate-200 text-sm h-10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier-terms" className="text-xs font-bold text-slate-700">
                Payment terms
              </Label>
              <Input
                id="supplier-terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Net 30"
                className="bg-slate-50 border-slate-200 text-sm h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700">Material rates</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRate}
                className="h-7 text-[10px] font-bold uppercase"
              >
                <Plus className="size-3.5" />
                Add rate
              </Button>
            </div>
            <div className="space-y-2 rounded-lg border border-slate-100 p-3">
              {rateLines.map((line) => (
                <div key={line.key} className="flex items-center gap-2">
                  <Select
                    value={line.materialId}
                    onValueChange={(value) =>
                      value &&
                      setRateLines((prev) =>
                        prev.map((item) =>
                          item.key === line.key ? { ...item, materialId: value } : item
                        )
                      )
                    }
                  >
                    <SelectTrigger className="w-full flex-1 bg-white border-slate-200 text-xs h-9">
                      <SelectValue placeholder="Material" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitCost}
                    onChange={(e) =>
                      setRateLines((prev) =>
                        prev.map((item) =>
                          item.key === line.key ? { ...item, unitCost: e.target.value } : item
                        )
                      )
                    }
                    placeholder="₹/unit"
                    className="w-28 bg-white border-slate-200 text-xs h-9 text-right font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRate(line.key)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    aria-label="Remove rate"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="supplier-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300"
            />
            <Label htmlFor="supplier-active" className="text-xs text-slate-600 cursor-pointer">
              Active supplier (available for purchase bills)
            </Label>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs font-bold uppercase h-10"
            >
              Cancel
            </Button>
            <Button type="submit" className="text-xs font-bold uppercase h-10">
              {isEditing ? "Save changes" : "Add supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
