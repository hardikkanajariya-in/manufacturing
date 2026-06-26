"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Plus, ShoppingCart, Calendar } from "lucide-react";
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
import { DataTable, type DataTableColumn, type DataTableFilter } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { useManufacturing } from "@/context/manufacturing-context";
import { formatNumber, getSupplierRate, getTodayString } from "@/lib/helpers";
import type { RestockRecord } from "@/lib/types";

export function RestockLedger() {
  const { restocks, materials, suppliers, addRestock } = useManufacturing();
  const activeSuppliers = suppliers.filter((s) => s.isActive);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [restockDate, setRestockDate] = useState(getTodayString());

  const selectedMaterial = materials.find((m) => m.id === materialId);
  const selectedSupplier = activeSuppliers.find((s) => s.id === supplierId);

  useEffect(() => {
    if (selectedMaterial) {
      const rate = getSupplierRate(selectedSupplier, materialId, selectedMaterial.unitCost);
      setUnitCost(rate.toString());
    } else {
      setUnitCost("");
    }
  }, [materialId, selectedMaterial, selectedSupplier]);

  useEffect(() => {
    if (dialogOpen && materials.length > 0) {
      setMaterialId(materials[0].id);
      setQuantity("");
      setSupplierId(activeSuppliers[0]?.id ?? "");
      setInvoiceNumber("");
      setRestockDate(getTodayString());
    }
  }, [dialogOpen, materials, activeSuppliers]);

  const table = useDataTable<RestockRecord>({
    data: restocks,
    pageSize: 10,
    initialSort: { columnId: "date", direction: "desc" },
    searchFn: (row, q) =>
      [row.materialName, row.supplier, row.invoiceNumber ?? ""].join(" ").toLowerCase().includes(q),
    filterFn: (row, filters) => {
      if (filters.material && filters.material !== "all" && row.materialId !== filters.material) {
        return false;
      }
      return true;
    },
    getSortValue: (row, col) => {
      if (col === "date") return new Date(row.date);
      if (col === "material") return row.materialName;
      if (col === "qty") return row.quantity;
      if (col === "unitCost") return row.unitCost;
      if (col === "total") return row.totalCost;
      return row.supplier;
    },
  });

  const columns: DataTableColumn<RestockRecord>[] = useMemo(
    () => [
      {
        id: "date",
        header: "Date",
        sortable: true,
        cell: (item) => format(new Date(item.date), "dd MMM yyyy"),
      },
      {
        id: "material",
        header: "Material",
        sortable: true,
        cell: (item) => <span className="font-medium">{item.materialName}</span>,
      },
      {
        id: "qty",
        header: "Quantity",
        sortable: true,
        className: "text-right font-mono",
        headerClassName: "text-right",
        cell: (item) => `${formatNumber(item.quantity, 1)} ${item.unit}`,
      },
      {
        id: "unitCost",
        header: "Unit cost",
        sortable: true,
        className: "text-right font-mono",
        headerClassName: "text-right",
        cell: (item) => `₹${formatNumber(item.unitCost, 2)}`,
      },
      {
        id: "total",
        header: "Total",
        sortable: true,
        className: "text-right font-mono font-semibold text-success",
        headerClassName: "text-right",
        cell: (item) => `₹${formatNumber(item.totalCost, 2)}`,
      },
      {
        id: "invoice",
        header: "Invoice",
        cell: (item) => (
          <span className="font-mono text-xs">{item.invoiceNumber ?? "—"}</span>
        ),
      },
      {
        id: "supplier",
        header: "Supplier",
        sortable: true,
        cell: (item) => item.supplier,
      },
    ],
    []
  );

  const filters: DataTableFilter[] = useMemo(
    () => [
      {
        id: "material",
        label: "Material",
        allLabel: "All materials",
        options: materials.map((m) => ({ value: m.id, label: m.name })),
      },
    ],
    [materials]
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const qty = Number(quantity);
    const cost = Number(unitCost);

    if (!materialId || !selectedMaterial || qty <= 0 || cost < 0 || !selectedSupplier) {
      return;
    }

    addRestock({
      materialId,
      materialName: selectedMaterial.name,
      quantity: qty,
      unit: selectedMaterial.unit,
      unitCost: cost,
      totalCost: qty * cost,
      supplier: selectedSupplier.name,
      invoiceNumber: invoiceNumber.trim() || undefined,
      date: restockDate,
    });

    setDialogOpen(false);
  };

  return (
    <>
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Replenishment ledger</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              History of raw materials purchased and received
            </p>
          </div>
          <Button variant="outline" onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="size-4" />
            Log restock
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            table={table}
            columns={columns}
            getRowKey={(item) => item.id}
            searchPlaceholder="Search restocks…"
            filters={filters}
            emptyMessage="No restocking records logged."
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="size-5 text-primary" />
              Log material restock
            </DialogTitle>
            <DialogDescription>
              Record a raw material purchase order to update stock levels.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5 min-w-0">
              <Label>Select raw material</Label>
              <Select value={materialId} onValueChange={(value) => value && setMaterialId(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent align="start">
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
                <Label htmlFor="restock-quantity">Quantity received</Label>
                <Input
                  id="restock-quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="restock-unit-cost">
                  Unit cost (₹/{selectedMaterial?.unit ?? "unit"})
                </Label>
                <Input
                  id="restock-unit-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5 min-w-0">
                <Label>Supplier / vendor</Label>
                <Select value={supplierId} onValueChange={(v) => v && setSupplierId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {activeSuppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invoice-number">Invoice / bill no.</Label>
                <Input
                  id="invoice-number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-2026-1042"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="restock-date">Date received</Label>
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
              <div className="rounded-lg bg-muted p-3 text-sm flex justify-between">
                <span className="text-muted-foreground">Estimated total</span>
                <span className="font-semibold font-mono">
                  ₹{formatNumber(Number(quantity) * Number(unitCost), 2)}
                </span>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Log restock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
