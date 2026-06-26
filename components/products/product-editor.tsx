"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Trash2, Plus, Sparkles, AlertTriangle, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useManufacturing } from "@/context/manufacturing-context";
import type { FormulaItem } from "@/lib/types";
import { formatNumber } from "@/lib/helpers";

interface ProductEditorProps {
  productId: string | null; // null means Create Product, otherwise Edit Product/Formula
  onClose: () => void;
}

interface FormulaRow {
  materialId: string;
  quantity: string;
}

function getColorForMaterial(name: string): string {
  const lowercase = name.toLowerCase();
  if (lowercase.includes("cement")) return "bg-slate-500 border-slate-600 text-white";
  if (lowercase.includes("sand")) return "bg-amber-400 border-amber-500 text-slate-900";
  if (lowercase.includes("stone")) return "bg-stone-400 border-stone-500 text-slate-900";
  if (lowercase.includes("ash")) return "bg-zinc-600 border-zinc-700 text-white";
  if (lowercase.includes("water")) return "bg-sky-400 border-sky-500 text-slate-900";
  return "bg-slate-300 border-slate-400 text-slate-800";
}

export function ProductEditor({ productId, onClose }: ProductEditorProps) {
  const { products, materials, addProduct, updateProductFormula, updateProductPrice } = useManufacturing();

  const isEditMode = productId !== null;
  const existingProduct = useMemo(() => {
    return isEditMode ? products.find((p) => p.id === productId) || null : null;
  }, [productId, products, isEditMode]);

  // Product Fields State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  // Formula Mixer State
  const [rows, setRows] = useState<FormulaRow[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [savingState, setSavingState] = useState(false);

  // Initialize fields
  useEffect(() => {
    if (isEditMode && existingProduct) {
      setName(existingProduct.name);
      setDescription(existingProduct.description);
      setSellingPrice(existingProduct.sellingPrice.toString());
      setRows(
        existingProduct.formula.map((item) => ({
          materialId: item.materialId,
          quantity: item.quantity.toString(),
        }))
      );
    } else {
      setName("");
      setDescription("");
      setSellingPrice("");
      setRows([]);
    }
  }, [isEditMode, existingProduct]);

  // Drag & Drop logic
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      handleAddMaterial(id);
    }
  };

  const handleAddMaterial = (id: string) => {
    if (rows.some((r) => r.materialId === id)) return;
    setRows((prev) => [...prev, { materialId: id, quantity: "1.0" }]);
  };

  const handleRemoveMaterial = (id: string) => {
    setRows((prev) => prev.filter((row) => row.materialId !== id));
  };

  const handleUpdateQuantity = (id: string, value: string) => {
    if (value === "" || Number(value) >= 0) {
      setRows((prev) =>
        prev.map((row) => (row.materialId === id ? { ...row, quantity: value } : row))
      );
    }
  };

  // Submit Handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || Number(sellingPrice) < 0) return;

    setSavingState(true);

    // Blending animation delay for MES aesthetic
    setTimeout(() => {
      const formulaItems: FormulaItem[] = rows
        .filter((row) => row.materialId && Number(row.quantity) > 0)
        .map((row) => ({
          materialId: row.materialId,
          quantity: Number(row.quantity),
        }));

      if (isEditMode && existingProduct) {
        // Update price & formula
        updateProductPrice(existingProduct.id, Number(sellingPrice));
        updateProductFormula(existingProduct.id, formulaItems);
      } else {
        // Create product first
        addProduct({
          name: name.trim(),
          description: description.trim() || "Cement product for factory output.",
          sellingPrice: Number(sellingPrice),
        });

        // The addProduct function generates a product in the context.
        // Let's find the newly added product from the updated list to update its formula.
        // Because of React batching, we will update the formula on the newly matched product by name
        // (or let the context handle it, but wait! The context addProduct initiates the product list,
        // so we find it or we match by name since name is unique).
        // Let's call the formula update inside the context if possible, or just call it here:
        setTimeout(() => {
          const freshProduct = products.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
          if (freshProduct) {
            updateProductFormula(freshProduct.id, formulaItems);
          }
        }, 100);
      }

      setSavingState(false);
      onClose();
    }, 1200);
  };

  // Live Formula Calculations
  const totalWeight = rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const materialCost = rows.reduce((sum, row) => {
    const mat = materials.find((m) => m.id === row.materialId);
    return sum + Number(row.quantity || 0) * (mat?.unitCost ?? 0);
  }, 0);

  const priceNum = Number(sellingPrice) || 0;
  const profit = priceNum - materialCost;
  const margin = priceNum > 0 ? (profit / priceNum) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Upper Navigation Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {isEditMode ? `Edit Formula: ${existingProduct?.name}` : "Create New Product"}
            </h1>
            <p className="text-xs text-slate-500">
              {isEditMode ? "Modify product price and ingredient blend" : "Configure name, unit price, and mix formula"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={savingState || !name.trim() || rows.length === 0} className="flex items-center gap-1.5">
            {savingState ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Blending Vat...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                {isEditMode ? "Save Changes" : "Create & Save Product"}
              </>
            )}
          </Button>
        </div>
      </div>

      {savingState ? (
        <Card className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="size-12 text-sky-600 animate-spin" />
          <p className="text-sm font-bold text-slate-800 animate-pulse">Blending Raw Materials in the Vat...</p>
          <p className="text-xs text-slate-400">Compacting and saving formula ratio structures.</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-5">
          {/* LEFT COLUMN: Product Metadata Form */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Product details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="edit-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Product Name
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isEditMode}
                    placeholder="e.g. Hollow Blocks"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed py-2 px-3 text-sm focus:border-sky-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-desc" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Description
                  </label>
                  <textarea
                    id="edit-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isEditMode}
                    placeholder="Brief description of application..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed py-2 px-3 text-sm focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-price" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Selling Price per Unit (₹)
                  </label>
                  <input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="e.g. 18.00"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-sky-500 focus:outline-hidden"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* ERP Cost Summary Card */}
            {rows.length > 0 && (
              <Card className="bg-slate-900 text-white border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base text-slate-200">ERP Profitability Projection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Target Unit Revenue</span>
                      <span className="font-bold text-slate-200">₹{priceNum.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Recipe Material Cost</span>
                      <span className="font-bold text-slate-200">₹{materialCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Total Batch Weight</span>
                      <span className="font-bold text-slate-200">{totalWeight.toFixed(1)} Kg/L</span>
                    </div>
                    <hr className="border-slate-800" />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">Net Profit margin</span>
                      <div className="text-right">
                        <span className={`font-bold text-base ${profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          ₹{profit.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {profit >= 0 ? `(${margin.toFixed(0)}% Margin)` : `(${margin.toFixed(0)}% Deficit)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {profit < 0 && (
                    <div className="flex items-start gap-2 bg-rose-500/15 border border-rose-500/30 rounded-lg p-3 text-xs text-rose-300">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5 text-rose-400" />
                      <span>This recipe is unprofitable. Material input cost exceeds your selling price. Lower the ingredient ratios or increase the unit selling price.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN: Formula Mixer Workspace */}
          <div className="md:col-span-3 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Materials Palette Bin */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Raw Material Bin</p>
                <div className="grid gap-2 max-h-[480px] overflow-y-auto pr-1">
                  {materials.map((material) => {
                    const isAdded = rows.some((r) => r.materialId === material.id);
                    return (
                      <div
                        key={material.id}
                        draggable={!isAdded}
                        onDragStart={(e) => handleDragStart(e, material.id)}
                        onClick={() => !isAdded && handleAddMaterial(material.id)}
                        className={`group relative rounded-xl border p-3 flex flex-col justify-between transition-all select-none ${
                          isAdded
                            ? "bg-slate-50 border-slate-100 opacity-45 cursor-not-allowed"
                            : "bg-white border-slate-200 hover:border-sky-400 hover:shadow-sm cursor-grab active:cursor-grabbing"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`size-3 rounded-full ${getColorForMaterial(material.name).split(" ")[0]}`} />
                            <span className="text-xs font-extrabold text-slate-800">{material.name}</span>
                          </div>
                          {!isAdded && (
                            <span className="text-[9px] text-sky-600 font-bold bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                              Drag or Click +
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500 font-mono">
                          <span>₹{material.unitCost}/{material.unit}</span>
                          <span className={material.availableStock <= material.minimumStock ? "text-amber-600 font-semibold" : ""}>
                            Stock: {formatNumber(material.availableStock)} {material.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-[10px] text-slate-500">
                  <HelpCircle className="size-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>Draggable items can be dragged into the dropzone. Clicking a card also adds it directly.</span>
                </div>
              </div>

              {/* Mixer Dropzone Vat */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mixing Vat Dropzone</p>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`rounded-xl border-2 border-dashed p-4 flex flex-col justify-between transition-all min-h-[420px] ${
                    isDraggingOver
                      ? "border-sky-500 bg-sky-50/20"
                      : "border-slate-300 bg-slate-50/50"
                  }`}
                >
                  {rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center my-auto text-center p-6 space-y-2.5">
                      <div className="flex size-14 items-center justify-center rounded-full bg-slate-200 border-2 border-slate-300/40 text-slate-400 animate-pulse">
                        <Plus className="size-6" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-700">Mixer Vat is Empty</p>
                        <p className="text-xs text-slate-400 max-w-[200px] mt-1 mx-auto">
                          Drop ingredients from the bin to build the product formula.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1 flex-1">
                      {rows.map((row) => {
                        const mat = materials.find((m) => m.id === row.materialId);
                        if (!mat) return null;

                        const proportion = totalWeight > 0 ? (Number(row.quantity || 0) / totalWeight) * 100 : 0;

                        return (
                          <div
                            key={row.materialId}
                            className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`size-3 rounded-full ${getColorForMaterial(mat.name).split(" ")[0]}`} />
                                <span className="text-xs font-bold text-slate-800">{mat.name}</span>
                                <span className="text-[9px] text-slate-400 font-mono">({mat.unit})</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveMaterial(row.materialId)}
                                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                aria-label="Remove Ingredient"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>

                            {/* Range slider & Input Row */}
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="range"
                                min="0.1"
                                max="10"
                                step="0.1"
                                value={row.quantity || "0.1"}
                                onChange={(e) => handleUpdateQuantity(row.materialId, e.target.value)}
                                className="flex-1 accent-sky-600 cursor-pointer h-1.5 rounded-lg bg-slate-100"
                              />
                              <div className="flex items-center gap-1.5 shrink-0">
                                <input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  value={row.quantity}
                                  onChange={(e) => handleUpdateQuantity(row.materialId, e.target.value)}
                                  className="w-14 rounded-md border border-slate-200 bg-slate-50 py-0.5 px-1 text-right text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden"
                                />
                                <span className="text-[10px] text-slate-500 font-semibold">{mat.unit}</span>
                              </div>
                            </div>

                            {/* Ratio indicator */}
                            <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mr-2 max-w-[120px]">
                                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${proportion}%` }} />
                              </div>
                              <span>Ratio: {proportion.toFixed(0)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
