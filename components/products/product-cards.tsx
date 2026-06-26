"use client";

import { useState } from "react";
import { FlaskConical, Plus, Package, TrendingUp, ArrowUpRight, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useManufacturing } from "@/context/manufacturing-context";
import { formatNumber } from "@/lib/helpers";
import type { Product } from "@/lib/types";

interface ProductCardsProps {
  onAddProduct: () => void;
  onEditProduct: (id: string) => void;
}

export function ProductCards({ onAddProduct, onEditProduct }: ProductCardsProps) {
  const { products, materials, updateProductPrice } = useManufacturing();

  // Price edit state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");

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

  // Compute Catalog Statistics
  const totalProducts = products.length;
  const productMargins = products.map((product) => {
    const cost = calculateProductionCost(product);
    const margin = product.sellingPrice > 0 
      ? ((product.sellingPrice - cost) / product.sellingPrice) * 100 
      : 0;
    return { product, cost, margin };
  });

  const avgMargin = productMargins.length > 0
    ? productMargins.reduce((sum, item) => sum + item.margin, 0) / productMargins.length
    : 0;

  const highestMarginItem = productMargins.length > 0
    ? [...productMargins].sort((a, b) => b.margin - a.margin)[0]
    : null;

  return (
    <div className="space-y-6">
      {/* Catalog KPI Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Products</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{totalProducts}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Active precast catalog</p>
            </div>
            <div className="size-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
              <Package className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Margin</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{formatNumber(avgMargin, 1)}%</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Plant-wide aggregate</p>
            </div>
            <div className="size-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
              <TrendingUp className="size-5" />
            </div>
          </CardContent>
        </Card>

        {highestMarginItem && (
          <Card className="bg-white border-slate-200">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Top Margin Item</p>
                <p className="text-sm font-extrabold text-slate-800 mt-1.5 truncate max-w-[170px]">
                  {highestMarginItem.product.name}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                  ₹{formatNumber(highestMarginItem.product.sellingPrice, 0)} · {formatNumber(highestMarginItem.margin, 0)}% margin
                </p>
              </div>
              <div className="size-10 bg-sky-50 rounded-lg flex items-center justify-center text-sky-600 shrink-0">
                <ArrowUpRight className="size-5" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Catalog Listing Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Product List</h2>
          <p className="text-xs text-slate-400">Configure prices and recipe ratios</p>
        </div>
        <Button onClick={onAddProduct} className="flex items-center gap-1.5 shadow-xs">
          <Plus className="size-4" />
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const productionCost = calculateProductionCost(product);
          const margin = product.sellingPrice > 0 
            ? ((product.sellingPrice - productionCost) / product.sellingPrice) * 100 
            : 0;
          const isEditingPrice = editingPriceId === product.id;

          return (
            <Card key={product.id} className="hover:shadow-md transition-shadow duration-150 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-bold text-slate-800">{product.name}</CardTitle>
                  <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 shrink-0">
                    {product.formula.length} Raws
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 min-h-[32px]">{product.description}</p>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {/* Costing Section */}
                <div className="rounded-xl bg-slate-50 p-3.5 text-xs space-y-2.5 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Selling Price</span>
                    {isEditingPrice ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          className="w-16 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-right text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden"
                          min="0"
                          step="0.01"
                          required
                        />
                        <button
                          onClick={() => savePrice(product.id)}
                          className="text-[9px] bg-sky-600 text-white rounded px-2 py-0.5 hover:bg-sky-500 font-bold uppercase cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPriceId(null)}
                          className="text-[9px] text-slate-400 hover:text-slate-600 font-bold uppercase cursor-pointer px-1"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 text-sm">₹{formatNumber(product.sellingPrice, 2)}</span>
                        <button
                          onClick={() => startEditPrice(product.id, product.sellingPrice)}
                          className="text-sky-600 hover:text-sky-500 text-[10px] font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Material Cost</span>
                    <span className="font-semibold text-slate-800">₹{formatNumber(productionCost, 2)}</span>
                  </div>

                  {/* Margin Gauge and Progress Bar */}
                  <div className="pt-2 border-t border-slate-200/60 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Gross Profit Margin</span>
                      <span className={`font-black tabular-nums ${margin >= 30 ? "text-emerald-600" : margin >= 15 ? "text-amber-500" : "text-rose-500"}`}>
                        {formatNumber(margin, 1)}%
                      </span>
                    </div>
                    {/* Visual Progress bar */}
                    <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden mt-1">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${margin >= 30 ? "bg-emerald-500" : margin >= 15 ? "bg-amber-500" : "bg-rose-500"}`} 
                        style={{ width: `${Math.max(0, Math.min(100, margin))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Formula Section */}
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Formula Ratios
                  </p>
                  {product.formula.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      No formula defined yet.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {product.formula.map((item) => {
                        const material = materials.find((m) => m.id === item.materialId);
                        return (
                          <Badge 
                            key={item.materialId}
                            variant="outline" 
                            className="bg-white border-slate-200 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-md"
                          >
                            {material?.name ?? "Raw"}: {formatNumber(item.quantity, 1)} {material?.unit ?? "Kg"}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Separator className="my-2" />

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs border-slate-200 hover:bg-slate-50 cursor-pointer"
                  onClick={() => onEditProduct(product.id)}
                >
                  <FlaskConical className="size-3.5" />
                  Edit Recipe
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
