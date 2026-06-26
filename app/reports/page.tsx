"use client";

import * as React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { ProductionReport } from "@/components/reports/production-report";
import { QualityReport } from "@/components/reports/quality-report";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const { user, productionRecords } = useManufacturing();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"production" | "quality">("production");

  // Timeline Filter State
  const [filterMode, setFilterMode] = React.useState<"monthly" | "quarterly" | "yearly" | "custom">("monthly");
  const [selectedMonth, setSelectedMonth] = React.useState("2026-06");
  const [selectedQuarter, setSelectedQuarter] = React.useState("2026-2");
  const [selectedYear, setSelectedYear] = React.useState("2026");
  const [customStartDate, setCustomStartDate] = React.useState("2026-06-01");
  const [customEndDate, setCustomEndDate] = React.useState("2026-06-26");

  useEffect(() => {
    if (user.role === "Operator") {
      router.push("/production");
    }
  }, [user, router]);

  const getDateRange = React.useMemo(() => {
    let start: Date | null = null;
    let end: Date | null = null;

    if (filterMode === "monthly") {
      const [year, month] = selectedMonth.split("-").map(Number);
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0);
    } else if (filterMode === "quarterly") {
      const [year, quarter] = selectedQuarter.split("-").map(Number);
      if (quarter === 1) {
        start = new Date(year, 0, 1);
        end = new Date(year, 2, 31);
      } else if (quarter === 2) {
        start = new Date(year, 3, 1);
        end = new Date(year, 5, 30);
      } else if (quarter === 3) {
        start = new Date(year, 6, 1);
        end = new Date(year, 8, 30);
      } else if (quarter === 4) {
        start = new Date(year, 9, 1);
        end = new Date(year, 11, 31);
      }
    } else if (filterMode === "yearly") {
      const year = Number(selectedYear);
      start = new Date(year, 0, 1);
      end = new Date(year, 11, 31);
    } else if (filterMode === "custom") {
      start = customStartDate ? new Date(customStartDate) : null;
      end = customEndDate ? new Date(customEndDate) : null;
    }

    return { start, end };
  }, [filterMode, selectedMonth, selectedQuarter, selectedYear, customStartDate, customEndDate]);

  const filteredProductionRecords = React.useMemo(() => {
    const { start, end } = getDateRange;
    return productionRecords.filter((record) => {
      const date = new Date(record.productionDate);
      if (isNaN(date.getTime())) return true;
      
      if (start) {
        const s = new Date(start);
        s.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        if (date < s) return false;
      }
      if (end) {
        const e = new Date(end);
        e.setHours(23, 59, 59, 999);
        date.setHours(0, 0, 0, 0);
        if (date > e) return false;
      }
      return true;
    });
  }, [productionRecords, getDateRange]);

  if (user.role === "Operator") {
    return null;
  }

  return (
    <DashboardShell
      title="Reports"
      description="Production log and quality — inventory ledgers are under Inventory"
    >
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Time Filter:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                {(["monthly", "quarterly", "yearly", "custom"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFilterMode(mode)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      filterMode === mode
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* DYNAMIC CONTROLS */}
            <div className="flex flex-wrap items-center gap-3">
              {filterMode === "monthly" && (
                <div>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-sky-500 focus:outline-hidden"
                  >
                    <option value="2026-06">June 2026</option>
                    <option value="2026-05">May 2026</option>
                    <option value="2026-04">April 2026</option>
                    <option value="2026-03">March 2026</option>
                    <option value="2026-02">February 2026</option>
                    <option value="2026-01">January 2026</option>
                  </select>
                </div>
              )}

              {filterMode === "quarterly" && (
                <div>
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-sky-500 focus:outline-hidden"
                  >
                    <option value="2026-1">Q1 (Jan - Mar) 2026</option>
                    <option value="2026-2">Q2 (Apr - Jun) 2026</option>
                    <option value="2026-3">Q3 (Jul - Sep) 2026</option>
                    <option value="2026-4">Q4 (Oct - Dec) 2026</option>
                    <option value="2025-1">Q1 (Jan - Mar) 2025</option>
                    <option value="2025-2">Q2 (Apr - Jun) 2025</option>
                    <option value="2025-3">Q3 (Jul - Sep) 2025</option>
                    <option value="2025-4">Q4 (Oct - Dec) 2025</option>
                  </select>
                </div>
              )}

              {filterMode === "yearly" && (
                <div>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-sky-500 focus:outline-hidden"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              )}

              {filterMode === "custom" && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium focus:border-sky-500 focus:outline-hidden"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

      <div className="space-y-6">
        {/* Custom Tab Selector */}
        <div className="flex border-b border-slate-200 gap-6 mb-2 pb-0.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("production")}
            className={cn(
              "pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap",
              activeTab === "production"
                ? "border-sky-600 text-sky-600 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Production log
          </button>
          <button
            onClick={() => setActiveTab("quality")}
            className={cn(
              "pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap",
              activeTab === "quality"
                ? "border-sky-600 text-sky-600 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Quality
          </button>
        </div>

        {activeTab === "production" && (
          <div className="animate-fadeIn">
            <ProductionReport filteredRecords={filteredProductionRecords} />
          </div>
        )}
        {activeTab === "quality" && (
          <div className="animate-fadeIn">
            <QualityReport filteredRecords={filteredProductionRecords} />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
