"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, ShoppingCart, Calendar, Truck, Layers, DollarSign } from "lucide-react";
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
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-base font-extrabold text-slate-800">Replenishment Ledger</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              History of raw materials purchased and received
            </p>
          </div>
          <Button variant="outline" onClick={() => setDialogOpen(true)} className="font-bold uppercase tracking-wider text-xs border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs cursor-pointer">
            <Plus className="size-4" />
            Log Restock
          </Button>
        </CardHeader>
        <CardContent>
          {restocks.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-400 border border-dashed rounded-xl">
              No restocking records logged.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <Table>
                <TableHeader className="bg-slate-50/75">
                  <TableRow className="border-b border-slate-150">
                    <TableHead className="font-bold text-xs text-slate-500 py-3 pl-4">Date</TableHead>
                    <TableHead className="font-bold text-xs text-slate-500 py-3">Material</TableHead>
                    <TableHead className="font-bold text-xs text-slate-500 py-3 text-right">Quantity</TableHead>
                    <TableHead className="font-bold text-xs text-slate-500 py-3 text-right">Unit Cost</TableHead>
                    <TableHead className="font-bold text-xs text-slate-500 py-3 text-right">Total Cost</TableHead>
                    <TableHead className="font-bold text-xs text-slate-500 py-3 pr-4">Supplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restocks.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/60 border-b border-slate-100">
                      <TableCell className="text-slate-500 py-3.5 pl-4 font-medium text-xs">
                        {format(new Date(item.date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700 py-3.5 text-xs">
                        {item.materialName}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-slate-800 py-3.5 text-xs tabular-nums">
                        {formatNumber(item.quantity, 1)} {item.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-400 py-3.5 text-xs tabular-nums">
                        ₹{formatNumber(item.unitCost, 2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600 py-3.5 text-xs tabular-nums">
                        ₹{formatNumber(item.totalCost, 2)}
                      </TableCell>
                      <TableCell className="text-slate-600 py-3.5 pr-4 text-xs">
                        {item.supplier}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="size-5 text-sky-600" />
              Log Material Restock
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Record a raw material purchase order to update stock levels.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Select Raw Material</Label>
              <Select
                value={materialId}
                onValueChange={(value) => value && setMaterialId(value)}
              >
                <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-xs h-10">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="restock-quantity" className="text-xs font-bold text-slate-700">Quantity Received</Label>
                <Input
                  id="restock-quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 500"
                  className="bg-slate-50 border-slate-200 focus:bg-white text-xs h-10"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="restock-unit-cost" className="text-xs font-bold text-slate-700">
                  Unit Cost (₹/{selectedMaterial?.unit ?? "Unit"})
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-3 text-[10px] font-bold text-slate-400 font-mono">₹</span>
                  <Input
                    id="restock-unit-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    placeholder="e.g. 12.00"
                    className="pl-5 bg-slate-50 border-slate-200 focus:bg-white text-xs h-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="supplier-name" className="text-xs font-bold text-slate-700">Supplier / Vendor</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-3 text-slate-400">
                    <Truck className="size-3.5" />
                  </span>
                  <Input
                    id="supplier-name"
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g. Ultratech Cement"
                    className="pl-8 bg-slate-50 border-slate-200 focus:bg-white text-xs h-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="restock-date" className="text-xs font-bold text-slate-700">Date Received</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-3 text-slate-400">
                    <Calendar className="size-3.5" />
                  </span>
                  <Input
                    id="restock-date"
                    type="date"
                    value={restockDate}
                    onChange={(e) => setRestockDate(e.target.value)}
                    className="pl-8 bg-slate-50 border-slate-200 focus:bg-white text-xs h-10"
                    required
                  />
                </div>
              </div>
            </div>

            {selectedMaterial && quantity && unitCost ? (
              <div className="rounded-xl bg-slate-50 p-4 text-xs flex justify-between items-center border border-slate-100 mt-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Estimated Invoice Total</span>
                <span className="text-base font-black text-slate-800 tabular-nums">
                  ₹{formatNumber(Number(quantity) * Number(unitCost), 2)}
                </span>
              </div>
            ) : null}

            <DialogFooter className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                className="text-xs font-bold uppercase tracking-wider h-10 border-slate-200 cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="text-xs font-bold uppercase tracking-wider h-10 cursor-pointer"
              >
                Log Restock
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
