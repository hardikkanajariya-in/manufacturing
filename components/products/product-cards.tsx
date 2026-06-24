"use client";

import { useState } from "react";
import { FlaskConical, Plus } from "lucide-react";
import { FormulaDialog } from "@/components/products/formula-dialog";
import { ProductDialog } from "@/components/products/product-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useManufacturing } from "@/context/manufacturing-context";
import { formatNumber } from "@/lib/helpers";

export function ProductCards() {
  const { products, materials } = useManufacturing();
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [formulaDialogOpen, setFormulaDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? null;

  const openFormula = (productId: string) => {
    setSelectedProductId(productId);
    setFormulaDialogOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setProductDialogOpen(true)}>
          <Plus className="size-4" />
          Add Product
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="text-base">{product.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Formula (per unit)
                </p>
                {product.formula.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No formula defined yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {product.formula.map((item) => {
                      const material = materials.find((m) => m.id === item.materialId);
                      return (
                        <li
                          key={item.materialId}
                          className="flex justify-between text-sm"
                        >
                          <span>{material?.name ?? "Unknown"}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {formatNumber(item.quantity, 1)} {material?.unit ?? "Kg"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <Separator />

              <Button
                variant="outline"
                className="w-full"
                onClick={() => openFormula(product.id)}
              >
                <FlaskConical className="size-4" />
                {product.formula.length === 0 ? "Add Formula" : "Edit Formula"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProductDialog open={productDialogOpen} onOpenChange={setProductDialogOpen} />

      <FormulaDialog
        open={formulaDialogOpen}
        onOpenChange={setFormulaDialogOpen}
        product={selectedProduct}
      />
    </>
  );
}
