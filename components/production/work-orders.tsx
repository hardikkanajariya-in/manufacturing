"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Check, Play, Ban, Trash2, ShieldCheck, AlertTriangle, ArrowLeft, List, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GanttScheduler } from "./gantt-scheduler";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { WorkOrder, WorkOrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WorkOrdersList() {
  const {
    workOrders,
    products,
    materials,
    addWorkOrder,
    updateWorkOrderStatus,
    deleteWorkOrder,
    submitProduction,
  } = useManufacturing();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "gantt">("list");

  // New WO State
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [scheduledDate, setScheduledDate] = useState(getTodayString());
  const [notes, setNotes] = useState("");

  // Completion State
  const [actualQuantity, setActualQuantity] = useState("");
  const [scrapQuantity, setScrapQuantity] = useState("0");
  const [qualityStatus, setQualityStatus] = useState("Passed");
  const [completionDate, setCompletionDate] = useState(getTodayString());
  const [completionError, setCompletionError] = useState<string | null>(null);

  const selectedWo = workOrders.find((w) => w.id === selectedWoId);
  const selectedWoProduct = selectedWo
    ? products.find((p) => p.id === selectedWo.productId)
    : null;

  // Auto-set first product in create dropdown
  useEffect(() => {
    if (createDialogOpen && products.length > 0) {
      setProductId(products[0].id);
      setQuantity("");
      setScheduledDate(getTodayString());
      setNotes("");
    }
  }, [createDialogOpen, products]);

  // Pre-fill completion details
  useEffect(() => {
    if (completeDialogOpen && selectedWo) {
      setActualQuantity(selectedWo.targetQuantity.toString());
      setScrapQuantity("0");
      setQualityStatus("Passed");
      setCompletionDate(getTodayString());
      setCompletionError(null);
    }
  }, [completeDialogOpen, selectedWo]);

  // Pre-flight material checks for currently selected WO
  const preflightChecks = selectedWoProduct && selectedWo
    ? selectedWoProduct.formula.map((item) => {
      const material = materials.find((m) => m.id === item.materialId);
      const required = item.quantity * selectedWo.targetQuantity;
      const available = material?.availableStock ?? 0;
      const sufficient = available >= required;
      return {
        name: material?.name ?? "Unknown",
        unit: material?.unit ?? "Kg",
        required,
        available,
        sufficient,
      };
    })
    : [];

  const handleCreateWo = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);
    const prod = products.find((p) => p.id === productId);

    if (!productId || !prod || qty <= 0) return;

    addWorkOrder({
      productId,
      productName: prod.name,
      targetQuantity: qty,
      scheduledDate,
      status: "Scheduled",
      notes: notes.trim(),
    });

    setCreateDialogOpen(false);
  };

  const handleCompleteWoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCompletionError(null);

    const goodQty = Number(actualQuantity);
    const scrap = Number(scrapQuantity || 0);

    if (!selectedWo || goodQty <= 0 || scrap < 0) {
      setCompletionError("Please enter valid quantities.");
      return;
    }

    const record = submitProduction(
      selectedWo.productId,
      goodQty,
      scrap,
      qualityStatus as any,
      completionDate
    );

    if (!record) {
      setCompletionError("Failed to complete. Insufficient material stock levels.");
      return;
    }

    updateWorkOrderStatus(selectedWo.id, "Completed");
    setCompleteDialogOpen(false);
    setSelectedWoId(null);
  };

  const getStatusStyle = (status: WorkOrderStatus) => {
    switch (status) {
      case "Draft":
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20";
      case "Scheduled":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
      case "In Progress":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "Completed":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "Cancelled":
        return "bg-destructive/10 text-destructive border border-destructive/20";
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* View Toggle Bar (Only show if not drill-down details mode) */}
      {!showDetails && (
        <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white p-0.5">
          <Button
            type="button"
            variant={viewMode === "list" ? "secondary" : "ghost"}
            onClick={() => setViewMode("list")}
            className={cn(
              "text-xs px-2.5 py-1 h-7 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer",
              viewMode === "list" ? "bg-slate-100 text-sky-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <List className="size-3.5" />
            List View
          </Button>
          <Button
            type="button"
            variant={viewMode === "gantt" ? "secondary" : "ghost"}
            onClick={() => setViewMode("gantt")}
            className={cn(
              "text-xs px-2.5 py-1 h-7 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer",
              viewMode === "gantt" ? "bg-slate-100 text-sky-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Calendar className="size-3.5" />
            Gantt Timeline
          </Button>
        </div>
      )}

      {showDetails && selectedWo ? (
        /* Pre-flight Checks Drill-down Card */
        <div className="animate-fadeIn w-full">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-slate-100 pb-4">
              <button
                onClick={() => setShowDetails(false)}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer shrink-0"
                aria-label="Back to schedule"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div>
                <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-sky-600" />
                  Pre-flight Check: {selectedWo.woNumber}
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verification of raw inventory required to complete this batch
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-4 sm:grid-cols-3 text-xs bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Product</span>
                  <span className="text-sm font-black text-slate-800 mt-0.5 block">{selectedWo.productName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Target Quantity</span>
                  <span className="text-sm font-black text-slate-800 mt-0.5 block">{selectedWo.targetQuantity} units</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Status</span>
                  <Badge variant="outline" className={`mt-0.5 inline-block ${getStatusStyle(selectedWo.status)}`}>
                    {selectedWo.status}
                  </Badge>
                </div>
              </div>

              {selectedWo.notes && (
                <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-500 italic border border-slate-150">
                  <span className="font-bold uppercase tracking-wider text-[9px] block text-slate-400 not-italic mb-1">Notes</span>
                  "{selectedWo.notes}"
                </div>
              )}

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
                    {preflightChecks.map((item) => (
                      <TableRow key={item.name} className="border-b border-slate-100 h-11 hover:bg-slate-50/40">
                        <TableCell className="font-medium text-slate-700 py-3 pl-4 text-xs">{item.name}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-slate-850 py-3 text-xs tabular-nums">
                          {formatNumber(item.required, 0)} {item.unit}
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-400 py-3 text-xs tabular-nums">
                          {formatNumber(item.available, 0)}
                        </TableCell>
                        <TableCell className="text-right py-3 pr-4">
                          <Badge
                            variant={item.sufficient ? "outline" : "destructive"}
                            className={cn(
                              "px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider",
                              item.sufficient ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                            )}
                          >
                            {item.sufficient ? "Sufficient" : "Low Stock"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {preflightChecks.some((c) => !c.sufficient) ? (
                <div className="flex items-start gap-2.5 rounded-xl bg-rose-50/50 border border-rose-200 p-4 text-xs text-rose-800">
                  <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5 animate-bounce" />
                  <div>
                    <span className="font-bold block">Insufficient Materials Stock!</span>
                    Please record a material restock in the ledger to fulfill this work order run.
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-250 p-4 text-xs text-emerald-800">
                  <ShieldCheck className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <span className="font-bold block">Ready for Execution!</span>
                    All material limits are verified in storage. You can safely initiate the production run.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : viewMode === "gantt" ? (
        <div className="animate-fadeIn">
          <GanttScheduler />
        </div>
      ) : (
        /* Work Orders List Table (Full-Width) */
        <Card className="w-full bg-white border-slate-200 shadow-sm animate-fadeIn">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-base font-extrabold text-slate-800">Production Schedule</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Schedule work orders and track their lifecycle
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="sm:self-center self-start font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 shadow-sm cursor-pointer">
              <Plus className="size-4" />
              Schedule Run
            </Button>
          </CardHeader>
          <CardContent>
            {workOrders.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400 border border-dashed rounded-xl">
                No scheduled work orders found.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <Table>
                  <TableHeader className="bg-slate-50/75">
                    <TableRow className="border-b border-slate-150">
                      <TableHead className="font-bold text-xs text-slate-500 py-3 pl-4">WO Number</TableHead>
                      <TableHead className="font-bold text-xs text-slate-500 py-3">Product</TableHead>
                      <TableHead className="font-bold text-xs text-slate-500 py-3 text-right">Target Qty</TableHead>
                      <TableHead className="font-bold text-xs text-slate-500 py-3">Scheduled Date</TableHead>
                      <TableHead className="font-bold text-xs text-slate-500 py-3">Status</TableHead>
                      <TableHead className="font-bold text-xs text-slate-500 py-3 pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrders.map((wo) => (
                      <TableRow
                        key={wo.id}
                        className={cn(
                          "cursor-pointer transition-all border-b border-slate-100",
                          selectedWoId === wo.id
                            ? "bg-sky-50/45 border-l-4 border-sky-600 font-semibold"
                            : "border-l-4 border-transparent hover:bg-slate-50/60"
                        )}
                        onClick={() => {
                          setSelectedWoId(wo.id);
                          setShowDetails(true);
                        }}
                      >
                        <TableCell className="font-semibold text-slate-700 py-3.5 pl-4 text-xs">{wo.woNumber}</TableCell>
                        <TableCell className="font-medium text-slate-700 py-3.5 text-xs">{wo.productName}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-slate-800 py-3.5 text-xs tabular-nums">
                          {formatNumber(wo.targetQuantity)}
                        </TableCell>
                        <TableCell className="text-slate-500 py-3.5 text-xs">
                          {format(new Date(wo.scheduledDate), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <Badge variant="outline" className={cn("text-[9px] uppercase font-bold px-2 py-0.5 tracking-wider", getStatusStyle(wo.status))}>
                            {wo.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-3.5 pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            {wo.status === "Scheduled" && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => updateWorkOrderStatus(wo.id, "In Progress")}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Start Run"
                              >
                                <Play className="size-3.5 text-amber-500" />
                              </Button>
                            )}
                            {wo.status === "In Progress" && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  setSelectedWoId(wo.id);
                                  setCompleteDialogOpen(true);
                                }}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Log Completion"
                              >
                                <Check className="size-3.5 text-emerald-500" />
                              </Button>
                            )}
                            {["Scheduled", "In Progress", "Draft"].includes(wo.status) && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => updateWorkOrderStatus(wo.id, "Cancelled")}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Cancel WO"
                              >
                                <Ban className="size-3.5 text-rose-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                deleteWorkOrder(wo.id);
                                if (selectedWoId === wo.id) setSelectedWoId(null);
                              }}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete WO"
                            >
                              <Trash2 className="size-3.5 text-rose-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* dialog to schedule run */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Production Run</DialogTitle>
            <DialogDescription>
              Create a new shop floor work order. We will track material checks prior to run.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWo} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Product Catalog Item</Label>
              <Select
                value={productId}
                onValueChange={(value) => value && setProductId(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="targetQuantity">Target Units to Produce</Label>
                <Input
                  id="targetQuantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Run Instructions / Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Inspect aggregate moisture ratio. Shift A operator Rajesh."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Schedule WO</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* dialog to complete work order */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Work Order: {selectedWo?.woNumber}</DialogTitle>
            <DialogDescription>
              Report the actual output yields and scrap defects to close this work order.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompleteWoSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="actualQuantity">Good Yield (Passed Units)</Label>
                <Input
                  id="actualQuantity"
                  type="number"
                  min="1"
                  value={actualQuantity}
                  onChange={(e) => setActualQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scrapQuantity-wo">Scrap Quantity (Waste)</Label>
                <Input
                  id="scrapQuantity-wo"
                  type="number"
                  min="0"
                  value={scrapQuantity}
                  onChange={(e) => setScrapQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Quality Run Assessment</Label>
                <Select
                  value={qualityStatus}
                  onValueChange={(value) => value && setQualityStatus(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Passed">Passed (Defects OK)</SelectItem>
                    <SelectItem value="Rework">Rework Required</SelectItem>
                    <SelectItem value="Failed">Failed Batch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="completionDate">Date Executed</Label>
                <Input
                  id="completionDate"
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {completionError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{completionError}</span>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCompleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit & Close WO</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
