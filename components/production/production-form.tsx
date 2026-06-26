"use client";

import { useState } from "react";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useManufacturing } from "@/context/manufacturing-context";
import { formatNumber, getTodayString } from "@/lib/helpers";
import type { ProductionRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductionForm() {
  const { products, materials, submitProduction, user } = useManufacturing();

  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [scrapQuantity, setScrapQuantity] = useState("");
  const [qualityStatus, setQualityStatus] = useState("Passed");
  const [productionDate, setProductionDate] = useState(getTodayString());
  const [error, setError] = useState<string | null>(null);
  const [lastRecord, setLastRecord] = useState<ProductionRecord | null>(null);

  const selectedProduct = products.find((p) => p.id === productId);
  const totalQtyToProduce = Number(quantity || 0) + Number(scrapQuantity || 0);

  const previewConsumption =
    selectedProduct && totalQtyToProduce > 0
      ? selectedProduct.formula.map((item) => {
          const material = materials.find((m) => m.id === item.materialId);
          const consumed = item.quantity * totalQtyToProduce;
          const sufficient =
            material !== undefined && material.availableStock >= consumed;
          return {
            materialId: item.materialId,
            name: material?.name ?? "Unknown",
            unit: material?.unit ?? "Kg",
            consumed,
            available: material?.availableStock ?? 0,
            after: (material?.availableStock ?? 0) - consumed,
            sufficient,
          };
        })
      : [];

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLastRecord(null);

    const qty = Number(quantity);
    const scrap = Number(scrapQuantity || 0);
    if (!productId || qty <= 0) {
      setError("Please select a product and enter a valid quantity.");
      return;
    }

    if (scrap < 0) {
      setError("Scrap quantity cannot be negative.");
      return;
    }

    if (!selectedProduct?.formula.length) {
      setError("Selected product has no formula defined.");
      return;
    }

    const record = submitProduction(productId, qty, scrap, qualityStatus as any, productionDate);
    if (!record) {
      setError("Insufficient stock for one or more raw materials.");
      return;
    }

    setLastRecord(record);
    setQuantity("");
    setScrapQuantity("");
    setQualityStatus("Passed");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-extrabold text-slate-800">Production Entry</CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">
            Record yield totals, scrap waste, and audit material consumption
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Select Product</Label>
              <Select
                value={productId}
                onValueChange={(value) => value && setProductId(value)}
              >
                <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-xs h-10">
                  <SelectValue placeholder="Choose product" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="quantity" className="text-xs font-bold text-slate-700">Quantity Produced (Yield)</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 100"
                  className="bg-slate-50 border-slate-200 focus:bg-white text-xs h-10"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="scrapQuantity" className="text-xs font-bold text-slate-700">Scrap / Defective Quantity</Label>
                <Input
                  id="scrapQuantity"
                  type="number"
                  min="0"
                  value={scrapQuantity}
                  onChange={(e) => setScrapQuantity(e.target.value)}
                  placeholder="e.g. 5"
                  className="bg-slate-50 border-slate-200 focus:bg-white text-xs h-10"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Quality Status</Label>
                <Select
                  value={qualityStatus}
                  onValueChange={(value) => value && setQualityStatus(value)}
                >
                  <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="Passed">Passed (100% OK)</SelectItem>
                    <SelectItem value="Rework">Rework Required</SelectItem>
                    <SelectItem value="Failed">Failed (Discarded)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="production-date" className="text-xs font-bold text-slate-700">Production Date</Label>
                <Input
                  id="production-date"
                  type="date"
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus:bg-white text-xs h-10"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 border border-rose-200 text-xs text-rose-800">
                <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full font-bold uppercase tracking-wider text-xs h-10 cursor-pointer shadow-sm">
              Submit Production Run
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {previewConsumption.length > 0 ? (
          <Card className="bg-white border-slate-200 shadow-sm animate-fadeIn">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-extrabold text-slate-800">Consumed Materials (Preview)</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated consumption for a total of {totalQtyToProduce} units ({totalQtyToProduce - Number(scrapQuantity || 0)} passed + {Number(scrapQuantity || 0)} scrap)
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/75">
                    <TableRow className="border-b border-slate-150">
                      <TableHead className="font-bold text-xs text-slate-500 py-3 pl-4">Material</TableHead>
                      <TableHead className="font-bold text-xs text-slate-500 py-3 text-right">Required</TableHead>
                      <TableHead className="font-bold text-xs text-slate-500 py-3 text-right">In Stock</TableHead>
                      <TableHead className="font-bold text-xs text-slate-500 py-3 pr-4 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewConsumption.map((item) => (
                      <TableRow key={item.materialId} className="border-b border-slate-100 h-11 hover:bg-slate-50/40">
                        <TableCell className="font-medium text-slate-700 py-3 pl-4 text-xs">{item.name}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-slate-850 py-3 text-xs tabular-nums">
                          {formatNumber(item.consumed, 1)} {item.unit}
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-400 py-3 text-xs tabular-nums">
                          {formatNumber(item.available, 1)} {item.unit}
                        </TableCell>
                        <TableCell className="text-right py-3 pr-4">
                          <Badge
                            variant={item.sufficient ? "outline" : "destructive"}
                            className={cn(
                              "px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider",
                              item.sufficient
                                ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                                : "bg-rose-50 text-rose-700 border-rose-250 animate-pulse"
                            )}
                          >
                            {item.sufficient ? "Sufficient" : "Insufficient"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {lastRecord ? (
          <Card className="bg-white border-emerald-200 shadow-sm animate-fadeIn">
            <CardHeader className="pb-3 border-b border-emerald-100/50 bg-emerald-50/15">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <CardTitle className="text-base font-extrabold text-emerald-800">Production Logged Successfully</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="text-slate-450 font-bold uppercase tracking-wider text-[9px] block">Product</span>
                  <span className="text-sm font-black text-slate-800 mt-0.5 block">{lastRecord.productName}</span>
                </div>
                <div>
                  <span className="text-slate-450 font-bold uppercase tracking-wider text-[9px] block">Yield / Scrap</span>
                  <span className="text-sm font-black text-slate-800 mt-0.5 block font-mono">
                    {formatNumber(lastRecord.quantity)} units / {formatNumber(lastRecord.scrapQuantity)} scrap
                  </span>
                </div>
                <div>
                  <span className="text-slate-450 font-bold uppercase tracking-wider text-[9px] block">Quality Status</span>
                  <Badge variant={lastRecord.qualityStatus === "Passed" ? "outline" : "destructive"} className="mt-1">
                    {lastRecord.qualityStatus}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-450 font-bold uppercase tracking-wider text-[9px] block">Log Date</span>
                  <span className="text-sm font-semibold text-slate-600 mt-0.5 block">
                    {format(new Date(lastRecord.productionDate), "dd MMM yyyy")}
                  </span>
                </div>
              </div>

              {user.role === "Manager" && (
                <>
                  <hr className="border-slate-100" />
                  <div className="rounded-xl bg-slate-50/50 p-3.5 space-y-2 border border-slate-100 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Est. Revenue</span>
                      <span className="font-bold text-slate-800">₹{formatNumber(lastRecord.revenue, 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Material Input Cost</span>
                      <span className="font-semibold text-slate-700">₹{formatNumber(lastRecord.materialCost, 2)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-200/60 font-bold text-slate-850">
                      <span>Net Gross Margin</span>
                      <span className={lastRecord.profit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                        ₹{formatNumber(lastRecord.profit, 2)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Inventory Stock Level Check</p>
                <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/20">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-b border-slate-150">
                        <TableHead className="py-2 pl-3 text-[10px] font-bold text-slate-500">Material</TableHead>
                        <TableHead className="py-2 text-[10px] font-bold text-slate-500 text-right">Updated Stock</TableHead>
                        <TableHead className="py-2 pr-3 text-[10px] font-bold text-slate-500 text-right">Safety Minimum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lastRecord.consumption.map((item) => {
                        const material = materials.find((m) => m.id === item.materialId);
                        const isUnderStock = material && material.availableStock <= material.minimumStock;
                        return (
                          <TableRow key={item.materialId} className="border-b border-slate-100 h-9">
                            <TableCell className="py-2 pl-3 font-medium text-slate-700 text-[11px]">{item.materialName}</TableCell>
                            <TableCell className={`py-2 text-right font-mono font-bold text-[11px] tabular-nums ${isUnderStock ? "text-rose-600" : "text-slate-800"}`}>
                              {formatNumber(material?.availableStock ?? 0, 1)} {material?.unit ?? "Kg"}
                            </TableCell>
                            <TableCell className="py-2 pr-3 text-right font-mono text-slate-400 text-[11px] tabular-nums">
                              {formatNumber(material?.minimumStock ?? 0)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
