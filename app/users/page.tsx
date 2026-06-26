"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmployeePanel } from "@/components/users/employee-panel";

export default function UsersPage() {
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
      title="Team"
      description="Manage employees and access roles for this manufacturing unit"
    >
      <EmployeePanel />
    </DashboardShell>
  );
}
