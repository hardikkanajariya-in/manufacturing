import type { RawMaterial, StockStatus } from "@/lib/types";

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getStockStatus(material: RawMaterial): StockStatus {
  if (material.availableStock <= material.minimumStock * 0.5) {
    return "Critical";
  }
  if (material.availableStock <= material.minimumStock) {
    return "Low Stock";
  }
  return "Adequate";
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function isSameMonth(dateStr: string, reference = new Date()): boolean {
  const date = new Date(dateStr);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayString();
}
