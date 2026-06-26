"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Search, AlertCircle, ChevronRight } from "lucide-react";
import { MaterialDialog } from "@/components/materials/material-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDataTable } from "@/hooks/use-data-table";
import { DATA_TABLE_MIN_HEIGHT } from "@/lib/data-table-types";
import { useManufacturing } from "@/context/manufacturing-context";
import { formatCurrency, formatNumber, getStockStatus } from "@/lib/helpers";
import type { RawMaterial } from "@/lib/types";
import { cn } from "@/lib/utils";

function StatusBadge({ material }: { material: RawMaterial }) {
  const status = getStockStatus(material);

  if (status === "Critical") {
    return (
      <Badge variant="destructive" className="text-[10px] font-medium uppercase tracking-wide">
        Critical
      </Badge>
    );
  }

  if (status === "Low Stock") {
    return (
      <Badge className="bg-warning/15 text-warning-foreground border-warning/30 text-[10px] font-medium uppercase tracking-wide">
        Low stock
      </Badge>
    );
  }

  return (
    <Badge className="bg-success/10 text-success border-success/20 text-[10px] font-medium uppercase tracking-wide">
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Low/Critical" | "Adequate">("All");

  const summary = useMemo(() => {
    const lowCount = materials.filter((m) => {
      const s = getStockStatus(m);
      return s === "Critical" || s === "Low Stock";
    }).length;
    const totalValue = materials.reduce((sum, m) => sum + m.availableStock * m.unitCost, 0);
    return { lowCount, totalValue };
  }, [materials]);

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getStockStatus(material);
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Low/Critical" && (status === "Critical" || status === "Low Stock")) ||
      (statusFilter === "Adequate" && status === "Adequate");
    return matchesSearch && matchesStatus;
  });

  const materialsTable = useDataTable<RawMaterial>({
    data: filteredMaterials,
    pageSize: 8,
    initialSort: { columnId: "name", direction: "asc" },
    getSortValue: (row, col) => {
      if (col === "name") return row.name;
      if (col === "stock") return row.availableStock;
      if (col === "value") return row.availableStock * row.unitCost;
      return row.minimumStock;
    },
  });

  const { paginatedData, page, setPage, totalPages, filteredCount, pageSize } = materialsTable;
  const rangeStart = filteredCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, filteredCount);

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
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">Raw materials</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {materials.length} materials · {formatCurrency(summary.totalValue)} on hand
                {summary.lowCount > 0 && (
                  <span className="text-warning-foreground"> · {summary.lowCount} need attention</span>
                )}
              </p>
            </div>
            <Button onClick={openAdd} size="sm" className="shrink-0">
              <Plus className="size-4" />
              Add material
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search materials…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["All", "All"],
                  ["Low/Critical", "Needs reorder"],
                  ["Adequate", "In stock"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredCount === 0 ? (
            <div className={cn("rounded-lg border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground", DATA_TABLE_MIN_HEIGHT)}>
              No materials match your search or filter.
            </div>
          ) : (
            <>
            <div className={cn("divide-y divide-border rounded-lg border border-border overflow-hidden flex flex-col", DATA_TABLE_MIN_HEIGHT)}>
              <div className="flex-1">
              {paginatedData.map((material) => {
                const status = getStockStatus(material);
                const isLow = status === "Critical" || status === "Low Stock";
                const fillPercent = Math.min(
                  100,
                  Math.round((material.availableStock / Math.max(1, material.minimumStock * 2)) * 100)
                );
                const stockValue = material.availableStock * material.unitCost;
                const isSelected = selectedMaterialId === material.id;

                return (
                  <div
                    key={material.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectMaterial(material.id)}
                    onKeyDown={(e) => e.key === "Enter" && onSelectMaterial(material.id)}
                    className={cn(
                      "group flex flex-col gap-3 p-4 transition-colors cursor-pointer sm:flex-row sm:items-center sm:gap-4",
                      isSelected ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : "hover:bg-muted/40",
                      isLow && !isSelected && "bg-warning/5"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isLow && <AlertCircle className="size-4 shrink-0 text-warning" />}
                        <span className="font-medium text-foreground">{material.name}</span>
                        <span className="text-xs text-muted-foreground">{material.unit}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 max-w-[140px] flex-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              status === "Critical"
                                ? "bg-destructive"
                                : status === "Low Stock"
                                  ? "bg-warning"
                                  : "bg-success"
                            )}
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Min {formatNumber(material.minimumStock)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 sm:gap-8">
                      <div className="text-right">
                        <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
                          {formatNumber(material.availableStock, 1)}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          On hand
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="font-mono text-sm font-medium tabular-nums">
                          {formatCurrency(material.unitCost, 2)}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Per {material.unit}
                        </p>
                      </div>
                      <div className="hidden text-right md:block">
                        <p className="font-mono text-sm font-semibold tabular-nums">
                          {formatCurrency(stockValue)}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Value
                        </p>
                      </div>
                      <StatusBadge material={material} />
                      <div
                        className="flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(material)}
                          aria-label={`Edit ${material.name}`}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => deleteMaterial(material.id)}
                          className="text-destructive hover:text-destructive"
                          aria-label={`Delete ${material.name}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                        <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hidden sm:block" />
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-border bg-muted/20 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Showing {rangeStart}–{rangeEnd} of {filteredCount}
                </p>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</Button>
                  <span className="min-w-[80px] text-center text-xs font-medium">Page {page} / {totalPages}</span>
                  <Button type="button" variant="outline" size="icon-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</Button>
                </div>
              </div>
            </div>
            </>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            Click a row to open the stock card ledger. Quantity edits from the edit dialog are logged
            under Inventory → Raw inflow / outflow.
          </p>
        </CardContent>
      </Card>

      <MaterialDialog open={dialogOpen} onOpenChange={setDialogOpen} material={editingMaterial} />
    </>
  );
}
