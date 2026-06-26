"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SalesModule } from "@/components/sales/sales-module";

export default function SalesPage() {
  const { user } = useManufacturing();
  const router = useRouter();

  useEffect(() => {
    if (user.role === "Operator") {
      router.push("/production");
    }
  }, [user, router]);

  if (user.role === "Operator") return null;

  return (
    <DashboardShell
      title="Sales"
      description="Record dispatches and track revenue from finished goods"
    >
      <SalesModule />
    </DashboardShell>
  );
}
