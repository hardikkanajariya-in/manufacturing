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

  useEffect(() => {
    if (open) {
      setName(material?.name ?? "");
      setUnit(material?.unit ?? "Kg");
      setAvailableStock(material?.availableStock.toString() ?? "");
      setMinimumStock(material?.minimumStock.toString() ?? "");
    }
  }, [open, material]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      name: name.trim(),
      unit,
      availableStock: Number(availableStock),
      minimumStock: Number(minimumStock),
    };

    if (!payload.name || payload.availableStock < 0 || payload.minimumStock < 0) {
      return;
    }

    if (isEditing && material) {
      updateMaterial(material.id, payload);
    } else {
      addMaterial(payload);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Material" : "Add Material"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update raw material details and stock levels."
              : "Register a new raw material in the inventory."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material-name">Material Name</Label>
            <Input
              id="material-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cement"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Unit</Label>
            <Select
              value={unit}
              onValueChange={(value) => value && setUnit(value as MaterialUnit)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kg">Kg</SelectItem>
                <SelectItem value="Litre">Litre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="available-stock">Available Stock</Label>
              <Input
                id="available-stock"
                type="number"
                min="0"
                step="0.1"
                value={availableStock}
                onChange={(e) => setAvailableStock(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimum-stock">Minimum Stock</Label>
              <Input
                id="minimum-stock"
                type="number"
                min="0"
                step="0.1"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditing ? "Save Changes" : "Add Material"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
