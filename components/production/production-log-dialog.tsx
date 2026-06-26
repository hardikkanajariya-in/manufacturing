"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { formatNumber, getTodayString } from "@/lib/helpers";
import { cn } from "@/lib/utils";

interface ProductionLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ProductionLogDialog({ open, onOpenChange, onSuccess }: ProductionLogDialogProps) {
  const { products, materials, submitProduction } = useManufacturing();

  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [scrapQuantity, setScrapQuantity] = useState("");
  const [qualityStatus, setQualityStatus] = useState("Passed");
  const [productionDate, setProductionDate] = useState(getTodayString());
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === productId);
  const totalQtyToProduce = Number(quantity || 0) + Number(scrapQuantity || 0);

  const previewConsumption =
    selectedProduct && totalQtyToProduce > 0
      ? selectedProduct.formula.map((item) => {
          const material = materials.find((m) => m.id === item.materialId);
          const consumed = item.quantity * totalQtyToProduce;
          const sufficient = material !== undefined && material.availableStock >= consumed;
          return {
            materialId: item.materialId,
            name: material?.name ?? "Unknown",
            unit: material?.unit ?? "Kg",
            consumed,
            available: material?.availableStock ?? 0,
            sufficient,
          };
        })
      : [];

  useEffect(() => {
    if (open) {
      setProductId(products[0]?.id ?? "");
      setQuantity("");
      setScrapQuantity("");
      setQualityStatus("Passed");
      setProductionDate(getTodayString());
      setError(null);
    }
  }, [open, products]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const qty = Number(quantity);
    const scrap = Number(scrapQuantity || 0);
    if (!productId || qty <= 0) {
      setError("Please select a product and enter a valid quantity.");
      return;
    }
    if (scrap < 0) {
      setError("Scrap quantity cannot be negative.");
      return;
    }
    if (!selectedProduct?.formula.length) {
      setError("Selected product has no formula defined.");
      return;
    }

    const record = submitProduction(productId, qty, scrap, qualityStatus as "Passed" | "Rework" | "Failed", productionDate);
    if (!record) {
      setError("Insufficient stock for one or more raw materials.");
      return;
    }

    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Log production run</DialogTitle>
          <DialogDescription>
            Record yield, scrap, and material consumption for a batch.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Product</Label>
            <Select value={productId} onValueChange={(v) => v && setProductId(v)}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Choose product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="prod-qty">Passed yield</Label>
              <Input id="prod-qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-scrap">Scrap quantity</Label>
              <Input id="prod-scrap" type="number" min="0" value={scrapQuantity} onChange={(e) => setScrapQuantity(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Quality status</Label>
              <Select value={qualityStatus} onValueChange={(v) => v && setQualityStatus(v)}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Passed">Passed</SelectItem>
                  <SelectItem value="Rework">Rework</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-date">Production date</Label>
              <Input id="prod-date" type="date" value={productionDate} onChange={(e) => setProductionDate(e.target.value)} required />
            </div>
          </div>

          {previewConsumption.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <p className="bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Material preview ({totalQtyToProduce} units total)
              </p>
              <ul className="divide-y divide-border text-xs">
                {previewConsumption.map((item) => (
                  <li key={item.materialId} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="font-medium truncate">{item.name}</span>
                    <span className="shrink-0 font-mono tabular-nums">
                      {formatNumber(item.consumed, 1)} {item.unit}
                    </span>
                    <Badge
                      variant={item.sufficient ? "outline" : "destructive"}
                      className={cn("shrink-0 text-[9px]", item.sufficient && "text-success border-success/30")}
                    >
                      {item.sufficient ? "OK" : "Low"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit run</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
