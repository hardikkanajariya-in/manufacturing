"use client";

import { useEffect, useState } from "react";
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
import type { MaterialUnit, RawMaterial } from "@/lib/types";
import { AlertCircle, Layers } from "lucide-react";
import { formatNumber } from "@/lib/helpers";

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: RawMaterial | null;
}

export function MaterialDialog({
  open,
  onOpenChange,
  material,
}: MaterialDialogProps) {
  const { addMaterial, updateMaterial } = useManufacturing();
  const isEditing = material !== null;

  const [name, setName] = useState("");
  const [unit, setUnit] = useState<MaterialUnit>("Kg");
  const [availableStock, setAvailableStock] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [unitCost, setUnitCost] = useState("");

  useEffect(() => {
    if (open) {
      setName(material?.name ?? "");
      setUnit(material?.unit ?? "Kg");
      setAvailableStock(material?.availableStock.toString() ?? "");
      setMinimumStock(material?.minimumStock.toString() ?? "");
      setUnitCost(material?.unitCost.toString() ?? "");
    }
  }, [open, material]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      name: name.trim(),
      unit,
      availableStock: Number(availableStock),
      minimumStock: Number(minimumStock),
      unitCost: Number(unitCost),
    };

    if (!payload.name || payload.availableStock < 0 || payload.minimumStock < 0 || payload.unitCost < 0) {
      return;
    }

    if (isEditing && material) {
      updateMaterial(material.id, payload);
    } else {
      addMaterial(payload);
    }

    onOpenChange(false);
  };

  const isLowStockWarning = 
    availableStock !== "" && 
    minimumStock !== "" && 
    Number(availableStock) <= Number(minimumStock);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="size-5 text-sky-600" />
            {isEditing ? "Edit Material" : "Add New Material"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditing
              ? "Update material details. Changing available quantity creates an adjustment entry in the raw material ledger."
              : "Register a new raw material. Opening stock is logged as an inventory adjustment."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="material-name" className="text-xs font-bold text-slate-700">Material Name</Label>
            <Input
              id="material-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cement (Grade 53)"
              className="bg-slate-50 border-slate-200 focus:bg-white text-xs h-10"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Measurement Unit</Label>
            <Select
              value={unit}
              onValueChange={(value) => value && setUnit(value as MaterialUnit)}
            >
              <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-xs h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="Kg">Kg (Kilogram)</SelectItem>
                <SelectItem value="Litre">Litre (L)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="available-stock" className="text-xs font-bold text-slate-700">Available</Label>
              <Input
                id="available-stock"
                type="number"
                min="0"
                step="0.1"
                value={availableStock}
                onChange={(e) => setAvailableStock(e.target.value)}
                className="bg-slate-50 border-slate-200 focus:bg-white text-xs h-10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="minimum-stock" className="text-xs font-bold text-slate-700">Min Threshold</Label>
              <Input
                id="minimum-stock"
                type="number"
                min="0"
                step="0.1"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                className="bg-slate-50 border-slate-200 focus:bg-white text-xs h-10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit-cost" className="text-xs font-bold text-slate-700">Cost (₹/{unit})</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-3 text-[10px] font-bold text-slate-400 font-mono">₹</span>
                <Input
                  id="unit-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="pl-5 bg-slate-50 border-slate-200 focus:bg-white text-xs h-10"
                  required
                />
              </div>
            </div>
          </div>

          {isEditing && availableStock !== "" && material && Number(availableStock) !== material.availableStock && (
            <div className="flex items-start gap-2 rounded-lg bg-muted p-3 border border-border text-[11px] text-muted-foreground">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>
                Stock will change from{" "}
                <strong className="font-mono text-foreground">
                  {formatNumber(material.availableStock, 1)}
                </strong>{" "}
                to{" "}
                <strong className="font-mono text-foreground">
                  {formatNumber(Number(availableStock), 1)} {unit}
                </strong>
                . This will be recorded in the raw material transaction ledger.
              </span>
            </div>
          )}

          {/* Dynamic Warning Alert */}
          {isLowStockWarning && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 border border-amber-200 text-[11px] text-amber-800">
              <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Stock Warning!</span> The entered available stock is below or equal to the minimum safety threshold. This material will report alert status.
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="text-xs font-bold uppercase tracking-wider h-10 border-slate-200 cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="text-xs font-bold uppercase tracking-wider h-10 cursor-pointer"
            >
              {isEditing ? "Save Changes" : "Register Material"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
