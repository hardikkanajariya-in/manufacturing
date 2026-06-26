"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { ProductCards } from "@/components/products/product-cards";
import { ProductEditor } from "@/components/products/product-editor";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function ProductsPage() {
  const { user } = useManufacturing();
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<"list" | "editor">("list");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

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
      {viewMode === "list" ? (
        <ProductCards 
          onAddProduct={() => {
            setSelectedProductId(null);
            setViewMode("editor");
          }}
          onEditProduct={(id) => {
            setSelectedProductId(id);
            setViewMode("editor");
          }}
        />
      ) : (
        <ProductEditor 
          productId={selectedProductId}
          onClose={() => setViewMode("list")}
        />
      )}
    </DashboardShell>
  );
}
