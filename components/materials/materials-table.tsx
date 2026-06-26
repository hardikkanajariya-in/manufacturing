"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { MaterialDialog } from "@/components/materials/material-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useManufacturing } from "@/context/manufacturing-context";
import { formatNumber, getStockStatus } from "@/lib/helpers";
import type { RawMaterial } from "@/lib/types";
import { cn } from "@/lib/utils";

function StatusBadge({ material }: { material: RawMaterial }) {
  const status = getStockStatus(material);
  const variant =
    status === "Critical"
      ? "destructive"
      : status === "Low Stock"
        ? "secondary"
        : "outline";

  return <Badge variant={variant}>{status}</Badge>;
}

interface MaterialsTableProps {
  onSelectMaterial: (id: string) => void;
  selectedMaterialId: string | null;
}

export function MaterialsTable({ onSelectMaterial, selectedMaterialId }: MaterialsTableProps) {
  const { materials, deleteMaterial } = useManufacturing();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  const openAdd = () => {
    setEditingMaterial(null);
    setDialogOpen(true);
  };

  const openEdit = (material: RawMaterial) => {
    setEditingMaterial(material);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Raw Materials Inventory</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select a material to inspect its in-depth Stock Card ledger
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="size-4" />
            Add Material
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Available Stock</TableHead>
                <TableHead className="min-w-28">Stock Level Gauge</TableHead>
                <TableHead className="text-right">Minimum Stock</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => {
                const fillPercent = Math.min(
                  100,
                  Math.round((material.availableStock / (material.minimumStock * 2.5)) * 100)
                );
                const status = getStockStatus(material);
                const barColor =
                  status === "Critical"
                    ? "bg-destructive animate-pulse"
                    : status === "Low Stock"
                      ? "bg-amber-500"
                      : "bg-emerald-500";

                return (
                  <TableRow
                    key={material.id}
                    className={`cursor-pointer ${selectedMaterialId === material.id ? "bg-muted/60 font-semibold border-l-2 border-primary" : ""}`}
                    onClick={() => onSelectMaterial(material.id)}
                  >
                    <TableCell className="font-semibold">{material.name}</TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(material.availableStock, 1)}
                    </TableCell>
                    <TableCell className="w-36">
                      <div className="flex flex-col gap-1">
                        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-300", barColor)}
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{fillPercent}% fill</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(material.minimumStock)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ₹{formatNumber(material.unitCost, 2)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge material={material} />
                    </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(material)}
                        aria-label={`Edit ${material.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteMaterial(material.id)}
                        aria-label={`Delete ${material.name}`}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MaterialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        material={editingMaterial}
      />
    </>
  );
}
