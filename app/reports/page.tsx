"use client";

import * as React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { ProductionReport } from "@/components/reports/production-report";
import { QualityReport } from "@/components/reports/quality-report";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageTabs } from "@/components/layout/page-tabs";
import { TimeRangeFilter } from "@/components/layout/time-range-filter";
import { useDateRangeFilter } from "@/hooks/use-date-range-filter";
import { filterByDateRange } from "@/lib/date-range";

export default function ReportsPage() {
  const { user, productionRecords } = useManufacturing();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"production" | "quality">("production");
  const { filter, range, setMode, update } = useDateRangeFilter();

  useEffect(() => {
    if (user.role === "Operator") {
      router.push("/production");
    }
  }, [user, router]);

  const filteredProductionRecords = React.useMemo(
    () => filterByDateRange(productionRecords, (r) => r.productionDate, range),
    [productionRecords, range]
  );

  if (user.role === "Operator") {
    return null;
  }

  return (
    <DashboardShell
      title="Reports"
      description="Production log and quality for the selected period"
    >
      <div className="space-y-6">
        <TimeRangeFilter filter={filter} onModeChange={setMode} onUpdate={update} />

        <PageTabs
          tabs={[
            { id: "production", label: "Production log" },
            { id: "quality", label: "Quality" },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as "production" | "quality")}
        />

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
