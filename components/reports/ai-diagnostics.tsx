"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Activity,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ClipboardCopy,
  FileCheck,
  Check,
  Info,
} from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber, getTodayString } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function AiDiagnostics() {
  const { productionRecords, products, user, settings } = useManufacturing();

  // Diagnostics states
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagData, setDiagData] = useState<any>(null);

  // Handover states
  const [siloChecked, setSiloChecked] = useState(false);
  const [hydraulicsChecked, setHydraulicsChecked] = useState(false);
  const [curingChecked, setCuringChecked] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState("");
  const [compiledReport, setCompiledReport] = useState<string | null>(null);
  const [copiedHandover, setCopiedHandover] = useState(false);

  // Filter products for dropdown
  const productOptions = useMemo(() => {
    return products.map((p) => p.name);
  }, [products]);

  // Run AI Audit
  const handleRunAudit = async () => {
    setDiagLoading(true);
    setDiagData(null);

    const payload = {
      productionRecords,
      selectedProduct: selectedProduct === "all" ? null : selectedProduct,
    };

    try {
      const res = await fetch("/api/gemini/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to contact Gemini Diagnostics endpoint.");
      const json = await res.json();
      setDiagData(json.data);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to run AI scrap diagnostics audit.");
    } finally {
      setDiagLoading(false);
    }
  };

  // Compile today's stats for handover report
  const todayStats = useMemo(() => {
    const todayStr = getTodayString();
    const todayLogs = productionRecords.filter((r) => r.productionDate === todayStr);

    const totalRuns = todayLogs.length;
    const passed = todayLogs.reduce((sum, r) => sum + r.quantity, 0);
    const scrap = todayLogs.reduce((sum, r) => sum + (r.scrapQuantity || 0), 0);
    const totalQty = passed + scrap;
    const cost = todayLogs.reduce((sum, r) => sum + r.materialCost, 0);

    const scrapRate = totalQty > 0 ? (scrap / totalQty) * 100 : 0;

    return {
      totalRuns,
      passed,
      scrap,
      scrapRate,
      cost,
    };
  }, [productionRecords]);

  // Build markdown report
  const handleCompileHandover = () => {
    const dateStr = format(new Date(), "dd MMM yyyy");
    const report = `# CEMENTPRO SHIFT HANDOVER REPORT
Date: ${dateStr} | Shift: ${user.shift || "Morning Shift"}
Supervisor: ${user.name} (${user.role})
Plant: ${settings.plantName}

## 1. Shop Floor Production Telemetry
• Production Runs Completed: ${todayStats.totalRuns} batches
• Successful Output (Passed): ${formatNumber(todayStats.passed, 0)} units
• Defect Scrap Quantity: ${formatNumber(todayStats.scrap, 0)} units
• Batch Defect Rate: ${todayStats.scrapRate.toFixed(1)}%
• Cumulative Material Cost: ₹${todayStats.cost.toFixed(2)} INR

## 2. Shift Equipment & Safety Checklists
• [${siloChecked ? "x" : " "}] Raw storage silos capacity checked
• [${hydraulicsChecked ? "x" : " "}] Hydraulic compaction press lines inspected
• [${curingChecked ? "x" : " "}] Curing chamber moisture/temp calibrated

## 3. Outgoing Supervisor Handover Notes
"${handoverNotes.trim() || "No additional comments. Shift ended with zero active safety issues and stable output quality."}"`;

    setCompiledReport(report);
    setCopiedHandover(false);
  };

  const handleCopyHandover = () => {
    if (!compiledReport) return;
    navigator.clipboard.writeText(compiledReport);
    setCopiedHandover(true);
    setTimeout(() => setCopiedHandover(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 2-Column Dashboard grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: AI Scrap Auditor */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="py-4 border-b border-slate-100 px-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="size-4 text-sky-600 animate-pulse" />
                AI Plant Diagnostics Auditor
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            {/* Filter selectors */}
            <div className="space-y-1.5">
              <Label htmlFor="audit-product" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Select Product Line to Audit
              </Label>
              <div className="flex gap-2">
                <Select value={selectedProduct} onValueChange={(val) => setSelectedProduct(val || "all")}>
                  <SelectTrigger id="audit-product" className="bg-slate-50 border border-slate-200 text-slate-700 text-xs h-9 flex-1">
                    <SelectValue placeholder="All products" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-250 text-slate-700">
                    <SelectItem value="all" className="text-xs">All Products</SelectItem>
                    {productOptions.map((name) => (
                      <SelectItem key={name} value={name} className="text-xs">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleRunAudit}
                  disabled={diagLoading}
                  className="h-9 px-4 text-xs flex gap-1.5 items-center cursor-pointer shrink-0 font-bold uppercase tracking-wider"
                >
                  {diagLoading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Activity className="size-3.5" />
                      Run Diagnostics
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* AI Diagnostics results layout */}
            {diagData ? (
              <div className="space-y-4 border-t border-slate-100 pt-4 animate-fadeIn">
                {/* Overall Risk rating */}
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Quality Risk Level</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border",
                      diagData.riskLevel === "Low"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                        : diagData.riskLevel === "Medium"
                          ? "bg-amber-50 text-amber-700 border-amber-250 animate-pulse"
                          : "bg-rose-50 text-rose-700 border-rose-250 animate-pulse"
                    )}
                  >
                    {diagData.riskLevel} Risk
                  </Badge>
                </div>

                {/* Anomalies paragraph */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Spike & Scrap Anomalies</span>
                  <p className="text-slate-650 bg-slate-50/50 p-3 rounded-lg border border-slate-100 leading-relaxed font-medium">
                    {diagData.anomalies}
                  </p>
                </div>

                {/* Actionable recommendations */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Operator Corrective Advice</span>
                  <div className="text-slate-600 bg-slate-50/50 p-3 rounded-lg border border-slate-100 leading-relaxed whitespace-pre-line font-medium">
                    {diagData.recommendations}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-6 border border-dashed rounded-xl border-slate-200">
                <ClipboardList className="size-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">Ready for diagnostics audit</p>
                <p className="text-slate-400 mt-1 max-w-[240px] mx-auto text-[11px]">
                  Select a product line and execute the auditor. Gemini will analyze raw logs for scrap variances.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Shift Handover Compiler */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="py-4 border-b border-slate-100 px-6">
            <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="size-4 text-sky-600" />
              Shift Handover Report compiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            {/* Shift metrics preview block */}
            <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2 border border-slate-800 font-mono text-[10px]">
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Shift telemetry preview</span>
              <div className="flex justify-between">
                <span className="text-slate-400">Production Runs:</span>
                <span className="font-bold text-slate-200">{todayStats.totalRuns} batches</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Output (Passed):</span>
                <span className="font-bold text-emerald-400">{todayStats.passed} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Defect Scrap Rate:</span>
                <span className="font-bold text-rose-400">{todayStats.scrapRate.toFixed(1)}% ({todayStats.scrap} scrap)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Material Cost Value:</span>
                <span className="font-bold text-slate-200">₹{todayStats.cost.toFixed(2)}</span>
              </div>
            </div>

            {/* Checklists */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Physical Shift Checklist</span>
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-medium text-slate-650 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={siloChecked}
                    onChange={(e) => setSiloChecked(e.target.checked)}
                    className="size-3.5 rounded-md border-slate-300 accent-sky-600 cursor-pointer"
                  />
                  <span>Silo Storage Levels checked (Aggregates & Cement)</span>
                </label>

                <label className="flex items-center gap-2 font-medium text-slate-650 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hydraulicsChecked}
                    onChange={(e) => setHydraulicsChecked(e.target.checked)}
                    className="size-3.5 rounded-md border-slate-300 accent-sky-600 cursor-pointer"
                  />
                  <span>Press Line Hydraulics and Compaction alignment inspected</span>
                </label>

                <label className="flex items-center gap-2 font-medium text-slate-650 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={curingChecked}
                    onChange={(e) => setCuringChecked(e.target.checked)}
                    className="size-3.5 rounded-md border-slate-300 accent-sky-600 cursor-pointer"
                  />
                  <span>Curing Chamber moisture nozzles and temperature logged</span>
                </label>
              </div>
            </div>

            {/* Handover comments */}
            <div className="space-y-1.5">
              <Label htmlFor="handover-notes" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Supervisor handover logs / notes
              </Label>
              <Textarea
                id="handover-notes"
                placeholder="Mention aggregate moisture drift, machine line wear, scheduled orders, or shift handoffs..."
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                rows={3}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs"
              />
            </div>

            <Button
              onClick={handleCompileHandover}
              className="w-full h-9 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="size-4" />
              Compile Shift Handover Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Compiled markdown handover report area */}
      {compiledReport && (
        <Card className="border-slate-200 bg-white shadow-xs animate-fadeIn">
          <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between px-6">
            <CardTitle className="text-xs font-extrabold text-slate-850 uppercase tracking-widest flex items-center gap-1">
              <ClipboardList className="size-4 text-slate-500" />
              Compiled Handover Report (Markdown)
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyHandover}
              className="text-[10px] font-bold text-sky-600 border-sky-200 hover:border-sky-500 hover:bg-sky-50 uppercase tracking-wider flex items-center gap-1 cursor-pointer h-7 px-2.5"
            >
              {copiedHandover ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <ClipboardCopy className="size-3.5" />
                  Copy Report
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <pre className="p-4 bg-slate-50 rounded-xl border border-slate-150 text-[10px] font-mono text-slate-650 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {compiledReport}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
