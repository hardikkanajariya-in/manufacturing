"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { SupplierDialog } from "@/components/materials/supplier-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Supplier } from "@/lib/types";

export function SupplierDirectory() {
  const { materials, suppliers, deleteSupplier } = useManufacturing();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const openAddSupplier = () => {
    setEditingSupplier(null);
    setDialogOpen(true);
  };

  const openEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setDialogOpen(true);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    if (
      !window.confirm(
        `Remove "${supplier.name}" from the supplier directory? Past purchase records will keep this name.`
      )
    ) {
      return;
    }
    deleteSupplier(supplier.id);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="size-4 text-primary" />
              Supplier directory
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage vendors, contacts, and negotiated material rates.
            </p>
          </div>
          <Button type="button" size="sm" onClick={openAddSupplier} className="self-start sm:self-center">
            <Plus className="size-4" />
            Add supplier
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {suppliers.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground px-4">
              No suppliers yet.{" "}
              <button type="button" onClick={openAddSupplier} className="text-primary underline">
                Add your first supplier
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="py-3 pl-4 font-semibold">Supplier</th>
                    <th className="py-3 font-semibold">Contact</th>
                    <th className="py-3 font-semibold">Terms</th>
                    <th className="py-3 pr-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {suppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className={cn("hover:bg-muted/30", !supplier.isActive && "opacity-60")}
                    >
                      <td className="py-3 pl-4">
                        <span className="font-medium block">{supplier.name}</span>
                        <span className="text-xs text-muted-foreground mt-0.5 block">
                          {supplier.materialRates
                            .map((rate) => materials.find((m) => m.id === rate.materialId)?.name)
                            .filter(Boolean)
                            .join(", ") || "No rates set"}
                        </span>
                        {!supplier.isActive && (
                          <Badge variant="outline" className="mt-1 text-[10px]">Inactive</Badge>
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground">{supplier.contact}</td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-[10px]">{supplier.paymentTerms}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditSupplier(supplier)}
                            aria-label={`Edit ${supplier.name}`}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteSupplier(supplier)}
                            aria-label={`Delete ${supplier.name}`}
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <SupplierDialog open={dialogOpen} onOpenChange={setDialogOpen} supplier={editingSupplier} />
    </>
  );
}
