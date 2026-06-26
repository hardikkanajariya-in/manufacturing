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
import type { Product } from "@/lib/types";

export function ProductCards() {
  const { products, materials, updateProductPrice } = useManufacturing();
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [formulaDialogOpen, setFormulaDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Price edit state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");

  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? null;

  const openFormula = (productId: string) => {
    setSelectedProductId(productId);
    setFormulaDialogOpen(true);
  };

  const startEditPrice = (productId: string, currentPrice: number) => {
    setEditingPriceId(productId);
    setPriceInput(currentPrice.toString());
  };

  const savePrice = (productId: string) => {
    const newPrice = Number(priceInput);
    if (!isNaN(newPrice) && newPrice >= 0) {
      updateProductPrice(productId, newPrice);
    }
    setEditingPriceId(null);
  };

  const calculateProductionCost = (product: Product) => {
    return product.formula.reduce((sum, item) => {
      const material = materials.find((m) => m.id === item.materialId);
      return sum + item.quantity * (material?.unitCost ?? 0);
    }, 0);
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
        {products.map((product) => {
          const productionCost = calculateProductionCost(product);
          const margin = product.sellingPrice > 0 
            ? ((product.sellingPrice - productionCost) / product.sellingPrice) * 100 
            : 0;
          const isEditingPrice = editingPriceId === product.id;

          return (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle className="text-base">{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Costing Section */}
                <div className="rounded-lg bg-muted/30 p-3 text-sm space-y-2 border">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Selling Price</span>
                    {isEditingPrice ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          className="w-20 rounded border border-border bg-background px-1 py-0.5 text-right text-xs font-medium focus:border-primary focus:outline-hidden"
                          min="0"
                          step="0.01"
                        />
                        <button
                          onClick={() => savePrice(product.id)}
                          className="text-[10px] bg-primary text-primary-foreground rounded px-1.5 py-0.5 hover:bg-primary/90 font-medium cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPriceId(null)}
                          className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">₹{formatNumber(product.sellingPrice, 2)}</span>
                        <button
                          onClick={() => startEditPrice(product.id, product.sellingPrice)}
                          className="text-muted-foreground hover:text-foreground text-xs underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Material Cost</span>
                    <span className="font-semibold text-foreground">₹{formatNumber(productionCost, 2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-border/50">
                    <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Gross Margin</span>
                    <span className={`font-bold tabular-nums ${margin >= 30 ? "text-emerald-600 dark:text-emerald-400" : margin >= 15 ? "text-amber-600 dark:text-amber-400" : "text-destructive"}`}>
                      {formatNumber(margin, 1)}%
                    </span>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
          );
        })}
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
