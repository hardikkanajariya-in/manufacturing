"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useManufacturing } from "@/context/manufacturing-context";
import { formatNumber, getTodayString } from "@/lib/helpers";

export function RestockLedger() {
  const { restocks, materials, addRestock } = useManufacturing();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Dialog state variables
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [restockDate, setRestockDate] = useState(getTodayString());

  const selectedMaterial = materials.find((m) => m.id === materialId);

  // Auto-populate unit cost when material changes
  useEffect(() => {
    if (selectedMaterial) {
      setUnitCost(selectedMaterial.unitCost.toString());
    } else {
      setUnitCost("");
    }
  }, [materialId, selectedMaterial]);

  // Set default material when dialog opens
  useEffect(() => {
    if (dialogOpen && materials.length > 0) {
      setMaterialId(materials[0].id);
      setQuantity("");
      setSupplier("");
      setRestockDate(getTodayString());
    }
  }, [dialogOpen, materials]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const qty = Number(quantity);
    const cost = Number(unitCost);

    if (!materialId || !selectedMaterial || qty <= 0 || cost < 0 || !supplier.trim()) {
      return;
    }

    addRestock({
      materialId,
      materialName: selectedMaterial.name,
      quantity: qty,
      unit: selectedMaterial.unit,
      unitCost: cost,
      totalCost: qty * cost,
      supplier: supplier.trim(),
      date: restockDate,
    });

    setDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Replenishment Ledger</CardTitle>
            <p className="text-sm text-muted-foreground">
              History of raw materials purchased and received
            </p>
          </div>
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Log Restock
          </Button>
        </CardHeader>
        <CardContent>
          {restocks.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No restocking records found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restocks.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {format(new Date(item.date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">{item.materialName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(item.quantity, 1)} {item.unit}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      ₹{formatNumber(item.unitCost, 2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      ₹{formatNumber(item.totalCost, 2)}
                    </TableCell>
                    <TableCell>{item.supplier}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Material Restock</DialogTitle>
            <DialogDescription>
              Record a raw material purchase order to update stock levels.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Raw Material</Label>
              <Select
                value={materialId}
                onValueChange={(value) => value && setMaterialId(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="restock-quantity">Quantity Received</Label>
                <Input
                  id="restock-quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restock-unit-cost">
                  Unit Cost (₹/{selectedMaterial?.unit ?? "Unit"})
                </Label>
                <Input
                  id="restock-unit-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="e.g. 12.00"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplier-name">Supplier / Vendor</Label>
                <Input
                  id="supplier-name"
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="e.g. Ultratech Cement"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restock-date">Date Received</Label>
                <Input
                  id="restock-date"
                  type="date"
                  value={restockDate}
                  onChange={(e) => setRestockDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {selectedMaterial && quantity && unitCost ? (
              <div className="rounded-lg bg-muted/30 p-3 text-sm flex justify-between items-center border">
                <span className="text-muted-foreground font-medium">Estimated Invoice Total</span>
                <span className="text-lg font-bold text-foreground tabular-nums">
                  ₹{formatNumber(Number(quantity) * Number(unitCost), 2)}
                </span>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Log Restock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
