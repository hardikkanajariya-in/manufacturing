"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnitDialog({ open, onOpenChange }: UnitDialogProps) {
  const { addUnit } = useManufacturing();
  const [newUnitCode, setNewUnitCode] = useState("");
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitLocation, setNewUnitLocation] = useState("");

  const reset = () => {
    setNewUnitCode("");
    setNewUnitName("");
    setNewUnitLocation("");
  };

  const handleAddUnit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newUnitCode.trim() || !newUnitName.trim()) return;

    addUnit({
      code: newUnitCode.trim().toUpperCase(),
      name: newUnitName.trim(),
      location: newUnitLocation.trim() || "—",
      isActive: true,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register new unit</DialogTitle>
          <DialogDescription>Add another plant or production site.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddUnit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="unit-code">Unit code</Label>
            <Input id="unit-code" value={newUnitCode} onChange={(e) => setNewUnitCode(e.target.value)} placeholder="U8" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit-name">Plant name</Label>
            <Input id="unit-name" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} placeholder="CementPro Factory — Unit 8" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit-location">Location</Label>
            <Input id="unit-location" value={newUnitLocation} onChange={(e) => setNewUnitLocation(e.target.value)} placeholder="City, State" />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="size-4" />
              Add unit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
