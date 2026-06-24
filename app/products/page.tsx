"use client";

import { ProductCards } from "@/components/products/product-cards";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function ProductsPage() {
  return (
    <DashboardShell
      title="Products & Formula"
      description="Product catalog and material composition per unit"
    >
      <ProductCards />
    </DashboardShell>
  );
}
