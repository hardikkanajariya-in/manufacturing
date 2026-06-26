export type DateRangeMode = "monthly" | "quarterly" | "yearly" | "custom";

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangeFilterState {
  mode: DateRangeMode;
  selectedMonth: string;
  selectedQuarter: string;
  selectedYear: string;
  customStartDate: string;
  customEndDate: string;
}

export function getDefaultMonthValue(reference = new Date()): string {
  const year = reference.getFullYear();
  const month = String(reference.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getDefaultQuarterValue(reference = new Date()): string {
  const quarter = Math.floor(reference.getMonth() / 3) + 1;
  return `${reference.getFullYear()}-${quarter}`;
}

export function getDefaultYearValue(reference = new Date()): string {
  return String(reference.getFullYear());
}

export function createDefaultDateRangeFilter(reference = new Date()): DateRangeFilterState {
  const today = reference.toISOString().split("T")[0];
  const monthStart = `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, "0")}-01`;
  return {
    mode: "monthly",
    selectedMonth: getDefaultMonthValue(reference),
    selectedQuarter: getDefaultQuarterValue(reference),
    selectedYear: getDefaultYearValue(reference),
    customStartDate: monthStart,
    customEndDate: today,
  };
}

export function resolveDateRange(filter: DateRangeFilterState): DateRange {
  let start: Date | null = null;
  let end: Date | null = null;

  if (filter.mode === "monthly") {
    const [year, month] = filter.selectedMonth.split("-").map(Number);
    start = new Date(year, month - 1, 1);
    end = new Date(year, month, 0);
  } else if (filter.mode === "quarterly") {
    const [year, quarter] = filter.selectedQuarter.split("-").map(Number);
    const startMonth = (quarter - 1) * 3;
    start = new Date(year, startMonth, 1);
    end = new Date(year, startMonth + 3, 0);
  } else if (filter.mode === "yearly") {
    const year = Number(filter.selectedYear);
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31);
  } else if (filter.mode === "custom") {
    start = filter.customStartDate ? new Date(filter.customStartDate) : null;
    end = filter.customEndDate ? new Date(filter.customEndDate) : null;
  }

  return { start, end };
}

export function isDateInRange(dateStr: string, range: DateRange): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return true;

  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);

  if (range.start) {
    const s = new Date(range.start);
    s.setHours(0, 0, 0, 0);
    if (normalized < s) return false;
  }
  if (range.end) {
    const e = new Date(range.end);
    e.setHours(23, 59, 59, 999);
    if (normalized > e) return false;
  }
  return true;
}

export function filterByDateRange<T>(
  items: T[],
  getDate: (item: T) => string,
  range: DateRange
): T[] {
  return items.filter((item) => isDateInRange(getDate(item), range));
}

export function getMonthOptions(monthsBack = 12, reference = new Date()): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    options.push({ value, label });
  }
  return options;
}

export function getYearOptions(yearsBack = 3, reference = new Date()): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < yearsBack; i++) {
    const year = reference.getFullYear() - i;
    options.push({ value: String(year), label: String(year) });
  }
  return options;
}

export const QUARTER_OPTIONS = [
  { value: "2026-1", label: "Q1 (Jan – Mar) 2026" },
  { value: "2026-2", label: "Q2 (Apr – Jun) 2026" },
  { value: "2026-3", label: "Q3 (Jul – Sep) 2026" },
  { value: "2026-4", label: "Q4 (Oct – Dec) 2026" },
  { value: "2025-1", label: "Q1 (Jan – Mar) 2025" },
  { value: "2025-2", label: "Q2 (Apr – Jun) 2025" },
  { value: "2025-3", label: "Q3 (Jul – Sep) 2025" },
  { value: "2025-4", label: "Q4 (Oct – Dec) 2025" },
];
