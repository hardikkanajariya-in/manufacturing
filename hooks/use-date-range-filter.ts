"use client";

import * as React from "react";
import {
  createDefaultDateRangeFilter,
  resolveDateRange,
  type DateRange,
  type DateRangeFilterState,
  type DateRangeMode,
} from "@/lib/date-range";

export function useDateRangeFilter(initial?: Partial<DateRangeFilterState>) {
  const [filter, setFilter] = React.useState<DateRangeFilterState>(() => ({
    ...createDefaultDateRangeFilter(),
    ...initial,
  }));

  const range = React.useMemo(() => resolveDateRange(filter), [filter]);

  const setMode = (mode: DateRangeMode) => setFilter((prev) => ({ ...prev, mode }));

  const update = (patch: Partial<DateRangeFilterState>) =>
    setFilter((prev) => ({ ...prev, ...patch }));

  return { filter, range, setMode, update, setFilter };
}

export type { DateRange, DateRangeFilterState, DateRangeMode };
