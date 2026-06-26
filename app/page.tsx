"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { OwnerSnapshot } from "@/components/dashboard/owner-snapshot";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardPage() {
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
    <DashboardShell title="Dashboard" description="Business overview at a glance">
      <OwnerSnapshot />
    </DashboardShell>
  );
}
