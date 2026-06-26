"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { ProductCards } from "@/components/products/product-cards";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function ProductsPage() {
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
      title="Products & Formula"
      description="Product catalog and material composition per unit"
    >
      <ProductCards />
    </DashboardShell>
  );
}
