"use client";

import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { UnitDialog } from "@/components/units/unit-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function UnitsPanel() {
  const { units, activeUnitId } = useManufacturing();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-primary" />
              Manufacturing units
            </CardTitle>
            <CardDescription>
              Plants and factories in your organisation. Use the unit switcher in the header to change the active unit.
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="self-start sm:self-center">
            <Plus className="size-4" />
            Add unit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm">
                  {unit.code} — {unit.name}
                  {unit.id === activeUnitId && (
                    <span className="ml-2 text-xs font-normal text-primary">(active)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">{unit.location}</p>
              </div>
              <Badge
                variant="outline"
                className={
                  unit.isActive ? "text-success border-success/30 self-start sm:self-center" : "text-muted-foreground self-start sm:self-center"
                }
              >
                {unit.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <UnitDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
