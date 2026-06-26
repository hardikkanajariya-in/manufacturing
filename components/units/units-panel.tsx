"use client";

import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function UnitsPanel() {
  const { units, activeUnitId, addUnit } = useManufacturing();
  const [newUnitCode, setNewUnitCode] = useState("");
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitLocation, setNewUnitLocation] = useState("");

  const handleAddUnit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newUnitCode.trim() || !newUnitName.trim()) return;

    addUnit({
      code: newUnitCode.trim().toUpperCase(),
      name: newUnitName.trim(),
      location: newUnitLocation.trim() || "—",
      isActive: true,
    });
    setNewUnitCode("");
    setNewUnitName("");
    setNewUnitLocation("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-primary" />
            Manufacturing units
          </CardTitle>
          <CardDescription>
            Plants and factories in your organisation. Use the unit switcher in the header to
            change the active unit.
          </CardDescription>
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
                  unit.isActive ? "text-success border-success/30" : "text-muted-foreground"
                }
              >
                {unit.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Register new unit</CardTitle>
          <CardDescription>Add another plant or production site.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddUnit} className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="unit-code">Unit code</Label>
              <Input
                id="unit-code"
                value={newUnitCode}
                onChange={(e) => setNewUnitCode(e.target.value)}
                placeholder="U8"
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="unit-name">Plant name</Label>
              <Input
                id="unit-name"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="CementPro Factory — Unit 8"
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-3">
              <Label htmlFor="unit-location">Location</Label>
              <Input
                id="unit-location"
                value={newUnitLocation}
                onChange={(e) => setNewUnitLocation(e.target.value)}
                placeholder="City, State"
              />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit">
                <Plus className="size-4" />
                Add unit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
