"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Check, Play, Ban, Trash2, ShieldCheck, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="grid gap-6 xl:grid-cols-3">
      {/* Left Columns: Work Orders Table */}
      <Card className="xl:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Production Schedule</CardTitle>
            <p className="text-sm text-muted-foreground">
              Schedule work orders and track their lifecycle
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="size-4" />
            Schedule Run
          </Button>
        </CardHeader>
        <CardContent>
          {workOrders.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No scheduled work orders.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>WO Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Target Qty</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.map((wo) => (
                  <TableRow
                    key={wo.id}
                    className={`cursor-pointer ${selectedWoId === wo.id ? "bg-muted/50" : ""}`}
                    onClick={() => setSelectedWoId(wo.id)}
                  >
                    <TableCell className="font-semibold">{wo.woNumber}</TableCell>
                    <TableCell className="font-medium">{wo.productName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(wo.targetQuantity)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(wo.scheduledDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusStyle(wo.status)}>
                        {wo.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        {wo.status === "Scheduled" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => updateWorkOrderStatus(wo.id, "In Progress")}
                            title="Start Run"
                          >
                            <Play className="size-4 text-amber-500" />
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
                            title="Log Completion"
                          >
                            <Check className="size-4 text-emerald-500" />
                          </Button>
                        )}
                        {["Scheduled", "In Progress", "Draft"].includes(wo.status) && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => updateWorkOrderStatus(wo.id, "Cancelled")}
                            title="Cancel WO"
                          >
                            <Ban className="size-4 text-destructive" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            deleteWorkOrder(wo.id);
                            if (selectedWoId === wo.id) setSelectedWoId(null);
                          }}
                          title="Delete WO"
                        >
                          <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Right Column: Pre-flight Checks & Material Availability Panel */}
      <div className="space-y-6">
        {selectedWo ? (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-primary" />
                Pre-flight Check: {selectedWo.woNumber}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Verification of raw inventory required to complete this batch.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <div className="flex justify-between border-b pb-1.5 mb-2">
                  <span className="text-muted-foreground">Product</span>
                  <span className="font-semibold">{selectedWo.productName}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 mb-2">
                  <span className="text-muted-foreground">Target Batch</span>
                  <span className="font-semibold">{selectedWo.targetQuantity} units</span>
                </div>
                {selectedWo.notes && (
                  <div className="bg-muted/40 p-2 rounded text-xs text-muted-foreground italic border">
                    {selectedWo.notes}
                  </div>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-1 text-xs">Material</TableHead>
                    <TableHead className="px-1 text-xs text-right">Required</TableHead>
                    <TableHead className="px-1 text-xs text-right">In Stock</TableHead>
                    <TableHead className="px-1 text-xs text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preflightChecks.map((item) => (
                    <TableRow key={item.name} className="h-9">
                      <TableCell className="px-1 text-xs font-medium">{item.name}</TableCell>
                      <TableCell className="px-1 text-xs text-right tabular-nums">
                        {formatNumber(item.required, 0)} {item.unit}
                      </TableCell>
                      <TableCell className="px-1 text-xs text-right tabular-nums text-muted-foreground">
                        {formatNumber(item.available, 0)}
                      </TableCell>
                      <TableCell className="px-1 text-xs text-right">
                        <Badge
                          variant={item.sufficient ? "outline" : "destructive"}
                          className="px-1 py-0 text-[10px] uppercase font-bold"
                        >
                          {item.sufficient ? "OK" : "Low"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {preflightChecks.some((c) => !c.sufficient) ? (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/5 border border-destructive/20 p-2.5 text-xs text-destructive">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>Insufficient raw materials. Log a restocking ledger item to start production.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-4 shrink-0" />
                  <span>All materials verified. Ready for floor execution.</span>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-muted/10 border-dashed border-2">
            <CardContent className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
              <ShieldCheck className="size-8 text-muted-foreground/45" />
              <span>Select a work order row to perform pre-flight stock verification check.</span>
            </CardContent>
          </Card>
        )}
      </div>

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
