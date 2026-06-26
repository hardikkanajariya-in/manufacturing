"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { UnitsPanel } from "@/components/units/units-panel";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function UnitsPage() {
  const { user } = useManufacturing();
  const router = useRouter();

  useEffect(() => {
    if (user.role === "Operator") {
      router.push("/production");
    }
  }, [user, router]);

  if (user.role === "Operator") {
    return null;
  }

  return (
    <DashboardShell
      title="Units"
      description="Manage manufacturing plants and factory locations"
    >
      <UnitsPanel />
    </DashboardShell>
  );
}
