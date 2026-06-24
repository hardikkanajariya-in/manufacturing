"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import type { FormulaItem, Product } from "@/lib/types";

interface FormulaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

interface FormulaRow {
  materialId: string;
  quantity: string;
}

export function FormulaDialog({ open, onOpenChange, product }: FormulaDialogProps) {
  const { materials, updateProductFormula } = useManufacturing();
  const [rows, setRows] = useState<FormulaRow[]>([]);

  useEffect(() => {
    if (open && product) {
      setRows(
        product.formula.length > 0
          ? product.formula.map((item) => ({
              materialId: item.materialId,
              quantity: item.quantity.toString(),
            }))
          : [{ materialId: materials[0]?.id ?? "", quantity: "" }]
      );
    }
  }, [open, product, materials]);

  const addRow = () => {
    const unused = materials.find(
      (m) => !rows.some((row) => row.materialId === m.id)
    );
    setRows((prev) => [
      ...prev,
      { materialId: unused?.id ?? materials[0]?.id ?? "", quantity: "" },
    ]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof FormulaRow, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!product) return;

    const formula: FormulaItem[] = rows
      .filter((row) => row.materialId && Number(row.quantity) > 0)
      .map((row) => ({
        materialId: row.materialId,
        quantity: Number(row.quantity),
      }));

    updateProductFormula(product.id, formula);
    onOpenChange(false);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Formula — {product.name}</DialogTitle>
          <DialogDescription>
            Define raw material quantities required per unit of product.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label>Material</Label>
                  <Select
                    value={row.materialId}
                    onValueChange={(value) =>
                      value && updateRow(index, "materialId", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28 space-y-2">
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, "quantity", e.target.value)}
                    placeholder="0.0"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(index)}
                  disabled={rows.length === 1}
                  aria-label="Remove row"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-4" />
            Add Material
          </Button>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Formula</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
