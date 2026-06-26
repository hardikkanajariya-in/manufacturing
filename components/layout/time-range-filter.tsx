"use client";

import { CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMonthOptions,
  getYearOptions,
  QUARTER_OPTIONS,
  type DateRangeFilterState,
  type DateRangeMode,
} from "@/lib/date-range";

interface TimeRangeFilterProps {
  filter: DateRangeFilterState;
  onModeChange: (mode: DateRangeMode) => void;
  onUpdate: (patch: Partial<DateRangeFilterState>) => void;
  className?: string;
}

const MODES: { id: DateRangeMode; label: string }[] = [
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly", label: "Yearly" },
  { id: "custom", label: "Custom" },
];

export function TimeRangeFilter({
  filter,
  onModeChange,
  onUpdate,
  className,
}: TimeRangeFilterProps) {
  const monthOptions = getMonthOptions(18);
  const yearOptions = getYearOptions(4);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-xs",
        className
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <CalendarRange className="size-4 text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Period
          </span>
          <div className="inline-flex flex-wrap rounded-lg border border-border bg-muted/50 p-1">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => onModeChange(mode.id)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer sm:px-3",
                  filter.mode === mode.id
                    ? "bg-card text-foreground shadow-xs border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filter.mode === "monthly" && (
            <select
              value={filter.selectedMonth}
              onChange={(e) => onUpdate({ selectedMonth: e.target.value })}
              className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-hidden sm:w-auto"
              aria-label="Select month"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {filter.mode === "quarterly" && (
            <select
              value={filter.selectedQuarter}
              onChange={(e) => onUpdate({ selectedQuarter: e.target.value })}
              className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-hidden sm:w-auto"
              aria-label="Select quarter"
            >
              {QUARTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {filter.mode === "yearly" && (
            <select
              value={filter.selectedYear}
              onChange={(e) => onUpdate({ selectedYear: e.target.value })}
              className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-hidden sm:w-auto"
              aria-label="Select year"
            >
              {yearOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {filter.mode === "custom" && (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <input
                type="date"
                value={filter.customStartDate}
                onChange={(e) => onUpdate({ customStartDate: e.target.value })}
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-hidden sm:flex-none"
                aria-label="Start date"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="date"
                value={filter.customEndDate}
                onChange={(e) => onUpdate({ customEndDate: e.target.value })}
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-hidden sm:flex-none"
                aria-label="End date"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
