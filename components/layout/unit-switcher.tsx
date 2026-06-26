"use client";

import { Building2, ChevronDown } from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface UnitSwitcherProps {
  compact?: boolean;
}

export function UnitSwitcher({ compact }: UnitSwitcherProps) {
  const { units, activeUnit, activeUnitId, setActiveUnit } = useManufacturing();
  const activeUnits = units.filter((unit) => unit.isActive);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-button)] border border-border bg-card text-left hover:bg-muted brand-transition cursor-pointer",
          compact ? "px-2 py-1.5 max-w-[140px] sm:max-w-[200px]" : "px-3 py-2 min-w-0 max-w-[220px]"
        )}
      >
        <Building2 className="size-4 shrink-0 text-brand-steel stroke-[2]" />
        <div className="min-w-0 flex-1 hidden sm:block">
          <p className="truncate text-xs font-semibold text-foreground">{activeUnit.code}</p>
          {!compact && (
            <p className="truncate text-[10px] text-muted-foreground">{activeUnit.name}</p>
          )}
        </div>
        <span className="sm:hidden text-xs font-semibold truncate">{activeUnit.code}</span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Manufacturing unit</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {activeUnits.map((unit) => (
          <DropdownMenuItem
            key={unit.id}
            onClick={() => setActiveUnit(unit.id)}
            className={cn("cursor-pointer flex flex-col items-start gap-0.5 py-2", unit.id === activeUnitId && "bg-muted")}
          >
            <span className="text-xs font-semibold">{unit.code} — {unit.name}</span>
            <span className="text-[10px] text-muted-foreground">{unit.location}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
