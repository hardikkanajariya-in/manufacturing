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

export function MaterialsTable() {
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
              Manage stock levels and minimum thresholds
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
                <TableHead className="text-right">Minimum Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>{material.unit}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(material.availableStock, 1)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(material.minimumStock)}
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
              ))}
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
