"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { WorkOrdersList } from "@/components/production/work-orders";
import { ProductionLogDialog } from "@/components/production/production-log-dialog";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

export default function ProductionPage() {
  const [logDialogOpen, setLogDialogOpen] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  return (
    <DashboardShell
      title="Shop Floor Operations"
      description="Manage work orders and log production runs"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Schedule batches on the timeline below, or log an ad-hoc production run.
          </p>
          <Button onClick={() => setLogDialogOpen(true)} className="self-start sm:self-auto shrink-0">
            <Plus className="size-4" />
            Log production run
          </Button>
        </div>

        {successMsg && (
          <p className="text-xs text-success rounded-lg bg-success/10 border border-success/20 px-3 py-2">
            {successMsg}
          </p>
        )}

        <WorkOrdersList />

        <ProductionLogDialog
          open={logDialogOpen}
          onOpenChange={setLogDialogOpen}
          onSuccess={() => {
            setSuccessMsg("Production run logged successfully.");
            setTimeout(() => setSuccessMsg(null), 4000);
          }}
        />
      </div>
    </DashboardShell>
  );
}
