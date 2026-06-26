"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Search, AlertCircle } from "lucide-react";
import { MaterialDialog } from "@/components/materials/material-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

  if (status === "Critical") {
    return (
      <Badge variant="destructive" className="animate-pulse font-bold text-[10px] tracking-wider uppercase px-2 py-0.5">
        Critical
      </Badge>
    );
  }

  if (status === "Low Stock") {
    return (
      <Badge className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200 font-bold text-[10px] tracking-wider uppercase px-2 py-0.5">
        Low Stock
      </Badge>
    );
  }

  return (
    <Badge className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 font-bold text-[10px] tracking-wider uppercase px-2 py-0.5">
      Adequate
    </Badge>
  );
}

interface MaterialsTableProps {
  onSelectMaterial: (id: string) => void;
  selectedMaterialId: string | null;
}

export function MaterialsTable({ onSelectMaterial, selectedMaterialId }: MaterialsTableProps) {
  const { materials, deleteMaterial } = useManufacturing();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  // Search and status filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Low/Critical" | "Adequate">("All");

  const openAdd = () => {
    setEditingMaterial(null);
    setDialogOpen(true);
  };

  const openEdit = (material: RawMaterial) => {
    setEditingMaterial(material);
    setDialogOpen(true);
  };

  // Filter raw materials array
  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getStockStatus(material);
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Low/Critical" && (status === "Critical" || status === "Low Stock")) ||
      (statusFilter === "Adequate" && status === "Adequate");

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-base font-extrabold text-slate-800">Raw Materials Inventory</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a material to inspect its in-depth Stock Card ledger
            </p>
          </div>
          <Button onClick={openAdd} className="sm:self-center self-start font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 shadow-sm cursor-pointer">
            <Plus className="size-4" />
            Add Material
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 size-4 text-slate-400" />
              <Input
                placeholder="Search raw materials by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white text-xs h-10"
              />
            </div>
            <div className="flex items-center gap-1.5 self-start md:self-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => setStatusFilter("All")}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer transition-colors border",
                  statusFilter === "All"
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Low/Critical")}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer transition-colors border",
                  statusFilter === "Low/Critical"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white text-amber-600 border-slate-200 hover:bg-amber-50"
                )}
              >
                Low / Critical
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Adequate")}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer transition-colors border",
                  statusFilter === "Adequate"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-emerald-600 border-slate-200 hover:bg-emerald-50"
                )}
              >
                In Stock
              </button>
            </div>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-400 border border-dashed rounded-xl">
              No raw materials match the search or filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <Table>
                <TableHeader className="bg-slate-50/75">
                  <TableRow className="border-b border-slate-150">
                    <TableHead className="font-bold text-xs text-slate-500 py-3 pl-4">Material Name</TableHead>
                    <TableHead className="font-bold text-xs text-slate-500 py-3">Unit</TableHead>
                    <TableHead className="font-bold text-xs text-slate-500 py-3 text-right">Available Stock</TableHead>
                    <TableHead className="font-bold text-xs text-slate-500 py-3 min-w-32">Stock Level Gauge</TableHead>
                    <TableHead className="font-bold text-xs text-slate-500 py-3 text-right">Minimum Stock</TableHead>
                    <TableHead className="font-bold text-xs text-slate-500 py-3 text-right">Unit Cost</TableHead>
                    <TableHead className="font-bold text-xs text-slate-500 py-3">Status</TableHead>
                    <TableHead className="font-bold text-xs text-slate-500 py-3 pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material) => {
                    const fillPercent = Math.min(
                      100,
                      Math.round((material.availableStock / Math.max(1, material.minimumStock * 2.0)) * 100)
                    );
                    const status = getStockStatus(material);
                    const isLow = status === "Critical" || status === "Low Stock";
                    
                    const barColor =
                      status === "Critical"
                        ? "bg-rose-500 animate-pulse"
                        : status === "Low Stock"
                          ? "bg-amber-500"
                          : "bg-emerald-500";

                    return (
                      <TableRow
                        key={material.id}
                        className={cn(
                          "cursor-pointer transition-all border-b border-slate-100",
                          selectedMaterialId === material.id
                            ? "bg-sky-50/45 border-l-4 border-sky-600 font-semibold"
                            : isLow
                              ? "border-l-4 border-amber-400 bg-amber-50/15 hover:bg-amber-50/25"
                              : "border-l-4 border-transparent hover:bg-slate-50/60"
                        )}
                        onClick={() => onSelectMaterial(material.id)}
                      >
                        <TableCell className="font-semibold text-slate-700 py-3.5 pl-4">
                          <div className="flex items-center gap-1.5">
                            {isLow && <AlertCircle className="size-3.5 text-amber-500 shrink-0" />}
                            {material.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 py-3.5">{material.unit}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-slate-800 py-3.5 tabular-nums">
                          {formatNumber(material.availableStock, 1)}
                        </TableCell>
                        <TableCell className="w-40 py-3.5">
                          <div className="flex flex-col gap-1">
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-300", barColor)}
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider font-mono">
                              {fillPercent}% of target capacity
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-500 py-3.5 tabular-nums">
                          {formatNumber(material.minimumStock)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-slate-700 py-3.5 tabular-nums">
                          ₹{formatNumber(material.unitCost, 2)}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <StatusBadge material={material} />
                        </TableCell>
                        <TableCell className="text-right py-3.5 pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEdit(material)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              aria-label={`Edit ${material.name}`}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => deleteMaterial(material.id)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              aria-label={`Delete ${material.name}`}
                            >
                              <Trash2 className="size-3.5 text-rose-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
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
