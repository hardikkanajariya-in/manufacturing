"use client";

import { useState } from "react";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, Mic, MicOff, Sparkles, Loader2, Check, Wand2 } from "lucide-react";
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

  // Mode state: manual form vs. AI Assistant
  const [entryMode, setEntryMode] = useState<"manual" | "ai">("manual");

  // Manual form states
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [scrapQuantity, setScrapQuantity] = useState("");
  const [qualityStatus, setQualityStatus] = useState("Passed");
  const [productionDate, setProductionDate] = useState(getTodayString());
  const [error, setError] = useState<string | null>(null);

  // AI assistant states
  const [aiPrompt, setAiPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<{
    productId: string | null;
    quantity: number;
    scrapQuantity: number;
    qualityStatus: "Passed" | "Rework" | "Failed";
    shift: string;
  } | null>(null);

  const [lastRecord, setLastRecord] = useState<ProductionRecord | null>(null);

  // Resolve selected product based on current mode
  const currentProductId = entryMode === "manual" ? productId : (parsedResult?.productId ?? "");
  const selectedProduct = products.find((p) => p.id === currentProductId);

  // Resolve total quantity to produce based on current mode
  const totalQtyToProduce = entryMode === "manual"
    ? Number(quantity || 0) + Number(scrapQuantity || 0)
    : parsedResult 
      ? Number(parsedResult.quantity) + Number(parsedResult.scrapQuantity)
      : 0;

  // Calculate material consumption preview
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

  // Browser-native Speech Recognition Handler
  const startListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setIsListening(true);
      setAiError(null);
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e);
      setIsListening(false);
      setAiError("Speech recognition failed. Please verify mic permissions.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAiPrompt((prev) => prev ? prev + " " + transcript : transcript);
    };

    recognition.start();
  };

  // Call Next.js Gemini parser route
  const handleAnalyzeCommand = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setParsedResult(null);
    setLastRecord(null);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiPrompt, products }),
      });

      if (!res.ok) throw new Error("Connection failed. Check server status.");
      const json = await res.json();

      if (json.error) {
        throw new Error(json.error);
      }

      setParsedResult(json.data);
    } catch (e: any) {
      console.error(e);
      setAiError(e.message || "Failed to analyze floor command.");
    } finally {
      setAiLoading(false);
    }
  };

  // Log parsed production run to database
  const handleConfirmAiLog = () => {
    if (!parsedResult || !parsedResult.productId) return;
    setAiError(null);

    const record = submitProduction(
      parsedResult.productId,
      parsedResult.quantity,
      parsedResult.scrapQuantity,
      parsedResult.qualityStatus,
      productionDate // uses selected date input
    );

    if (!record) {
      setAiError("Insufficient raw material stock to log this AI run.");
      return;
    }

    setLastRecord(record);
    setParsedResult(null);
    setAiPrompt("");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {/* Entry Panel (Manual or AI Assistant) */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 gap-4">
          <div>
            <CardTitle className="text-base font-extrabold text-slate-800">Production Entry</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Record yield totals, scrap waste, and audit material consumption
            </p>
          </div>
          {/* Mode Switcher */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEntryMode("manual");
                setLastRecord(null);
                setParsedResult(null);
              }}
              className={cn(
                "rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
                entryMode === "manual"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              Manual Form
            </button>
            <button
              type="button"
              onClick={() => {
                setEntryMode("ai");
                setLastRecord(null);
                setParsedResult(null);
              }}
              className={cn(
                "rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1",
                entryMode === "ai"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Sparkles className="size-3 text-sky-600 animate-pulse" />
              AI Assistant
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {entryMode === "manual" ? (
            /* MANUAL FORM */
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
          ) : (
            /* AI ASSISTANT VIEW */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-slate-700">Voice or Text Operator Command</Label>
                  {isListening && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-rose-600 uppercase tracking-widest animate-pulse">
                      <span className="size-1.5 bg-rose-600 rounded-full" />
                      Listening Mic...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Logged 250 Curbs with 3 scrap, passed on evening shift today"
                    className="w-full min-h-[100px] pr-12 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-hidden resize-none"
                    disabled={aiLoading}
                  />
                  <button
                    type="button"
                    onClick={isListening ? () => {} : startListening}
                    className={cn(
                      "absolute bottom-3.5 right-3.5 size-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border shadow-xs",
                      isListening
                        ? "bg-rose-50 text-rose-600 border-rose-200 animate-ping"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    )}
                    title={isListening ? "Listening..." : "Dictate floor command"}
                  >
                    {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Dynamic Production Date for AI logging */}
              <div className="space-y-1.5">
                <Label htmlFor="ai-production-date" className="text-xs font-bold text-slate-700">Date to Log Run</Label>
                <Input
                  id="ai-production-date"
                  type="date"
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus:bg-white text-xs h-10 w-full sm:w-1/2"
                />
              </div>

              {aiError && (
                <div className="flex items-start gap-2.5 rounded-lg bg-rose-50 p-3.5 border border-rose-250 text-xs text-rose-800">
                  <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              <Button
                type="button"
                onClick={handleAnalyzeCommand}
                disabled={aiLoading || !aiPrompt.trim()}
                className="w-full font-bold uppercase tracking-wider text-xs h-10 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Analyzing Floor Command...
                  </>
                ) : (
                  <>
                    <Wand2 className="size-4" />
                    Analyze & Parse Run
                  </>
                )}
              </Button>

              {/* AI Parser Preview Card */}
              {parsedResult && (
                <div className="rounded-xl border border-sky-100 bg-sky-50/25 p-4 space-y-3.5 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-sky-100/50 pb-2">
                    <span className="text-sky-700 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Sparkles className="size-3.5" />
                      Extracted Telemetry
                    </span>
                    <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[9px] uppercase font-bold tracking-wider">
                      Ready
                    </Badge>
                  </div>
                  
                  {parsedResult.productId ? (
                    <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Matched Product</span>
                        <span className="text-sm font-black text-slate-800 mt-0.5 block">
                          {products.find((p) => p.id === parsedResult.productId)?.name || "Unknown Product"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Operation Shift</span>
                        <span className="text-sm font-black text-slate-800 mt-0.5 block">{parsedResult.shift}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Yield Yielded</span>
                        <span className="text-sm font-black text-emerald-600 mt-0.5 block font-mono">{parsedResult.quantity} units</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Scrap Logged</span>
                        <span className="text-sm font-black text-rose-600 mt-0.5 block font-mono">{parsedResult.scrapQuantity} units</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Quality Status</span>
                        <Badge
                          variant={parsedResult.qualityStatus === "Passed" ? "outline" : "destructive"}
                          className={cn(
                            "mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5",
                            parsedResult.qualityStatus === "Passed" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                              : parsedResult.qualityStatus === "Rework"
                                ? "bg-amber-50 text-amber-700 border-amber-250"
                                : "bg-rose-50 text-rose-700 border-rose-250"
                          )}
                        >
                          {parsedResult.qualityStatus}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>Product catalog match failed. Please specify cement blocks/slabs/curbs name in command.</span>
                    </div>
                  )}

                  {parsedResult.productId && (
                    <Button
                      type="button"
                      onClick={handleConfirmAiLog}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 border border-emerald-700 text-white font-bold uppercase tracking-wider text-xs h-10 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm mt-3"
                    >
                      <Check className="size-4" />
                      Confirm & Log Production Run
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Panel: Consumed Preview & Success Summary */}
      <div className="space-y-6">
        {previewConsumption.length > 0 ? (
          <Card className="bg-white border-slate-200 shadow-sm animate-fadeIn">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-extrabold text-slate-800">Consumed Materials (Preview)</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated consumption for a total of {totalQtyToProduce} units ({totalQtyToProduce - (entryMode === "manual" ? Number(scrapQuantity || 0) : (parsedResult?.scrapQuantity ?? 0))} passed + {entryMode === "manual" ? Number(scrapQuantity || 0) : (parsedResult?.scrapQuantity ?? 0)} scrap)
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
