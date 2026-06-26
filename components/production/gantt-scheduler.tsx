"use client";

import { useState, useMemo, useEffect } from "react";
import { format, addDays, subDays, parseISO, isToday } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Trash2,
  Plus,
  ArrowLeftRight,
  Sparkles,
  Info,
} from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WorkOrder, WorkOrderStatus } from "@/lib/types";
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
import { getTodayString } from "@/lib/helpers";

export function GanttScheduler() {
  const {
    workOrders,
    products,
    updateWorkOrder,
    updateWorkOrderStatus,
    deleteWorkOrder,
    addWorkOrder,
  } = useManufacturing();

  // Timeline Start State
  const [timelineStart, setTimelineStart] = useState(() => subDays(new Date(), 2));

  // Edit / Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null);

  // Edit Form Fields
  const [editQuantity, setEditQuantity] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState<WorkOrderStatus>("Scheduled");
  const [editNotes, setEditNotes] = useState("");

  // Create Form Fields (Quick Add)
  const [createProductId, setCreateProductId] = useState("");
  const [createQuantity, setCreateQuantity] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [createNotes, setCreateNotes] = useState("");

  // Compute 7 days to display in the columns
  const visibleDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(timelineStart, i));
  }, [timelineStart]);

  const selectedWo = useMemo(() => {
    return workOrders.find((w) => w.id === selectedWoId) || null;
  }, [selectedWoId, workOrders]);

  // Load selected WO fields when dialog opens
  useEffect(() => {
    if (editDialogOpen && selectedWo) {
      setEditQuantity(selectedWo.targetQuantity.toString());
      setEditDate(selectedWo.scheduledDate);
      setEditStatus(selectedWo.status);
      setEditNotes(selectedWo.notes || "");
    }
  }, [editDialogOpen, selectedWo]);

  // Move timeline window
  const panTimeline = (days: number) => {
    setTimelineStart((prev) => addDays(prev, days));
  };

  const jumpToToday = () => {
    setTimelineStart(subDays(new Date(), 2));
  };

  // Helper status color mapping
  const getStatusColor = (status: WorkOrderStatus) => {
    switch (status) {
      case "Draft":
        return "bg-slate-500/10 text-slate-700 border border-slate-500/20";
      case "Scheduled":
        return "bg-blue-500/10 text-blue-700 border border-blue-500/20";
      case "In Progress":
        return "bg-amber-500/10 text-amber-700 border border-amber-500/20";
      case "Completed":
        return "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20";
      case "Cancelled":
        return "bg-rose-50/80 text-rose-700 border border-rose-200/50";
    }
  };

  // Form Handlers
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWoId || Number(editQuantity) <= 0 || !editDate) return;

    updateWorkOrder(selectedWoId, {
      targetQuantity: Number(editQuantity),
      scheduledDate: editDate,
      status: editStatus,
      notes: editNotes.trim(),
    });

    setEditDialogOpen(false);
  };

  const handleQuickShift = (daysChange: number) => {
    if (!selectedWo) return;
    const currentParsed = parseISO(selectedWo.scheduledDate);
    const newDateStr = format(addDays(currentParsed, daysChange), "yyyy-MM-dd");
    setEditDate(newDateStr);
    updateWorkOrder(selectedWo.id, { scheduledDate: newDateStr });
  };

  const handleDeleteWo = () => {
    if (!selectedWoId) return;
    if (confirm("Are you sure you want to delete this scheduled work order?")) {
      deleteWorkOrder(selectedWoId);
      setEditDialogOpen(false);
    }
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(createQuantity);
    const prod = products.find((p) => p.id === createProductId);

    if (!createProductId || !prod || qty <= 0 || !createDate) return;

    addWorkOrder({
      productId: createProductId,
      productName: prod.name,
      targetQuantity: qty,
      scheduledDate: createDate,
      status: "Scheduled",
      notes: createNotes.trim(),
    });

    setCreateDialogOpen(false);
  };

  const handleTriggerQuickAdd = (productId: string, dateStr: string) => {
    setCreateProductId(productId);
    setCreateDate(dateStr);
    setCreateQuantity("500"); // default batch size
    setCreateNotes("");
    setCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Timeline Controls Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="size-5 text-sky-600" />
            Active Timeline Scheduler
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize, reschedule, and manage shop floor work order distribution.
          </p>
        </div>

        {/* Date Panner controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => panTimeline(-7)}
            title="Previous Week"
            className="cursor-pointer"
          >
            <ChevronLeft className="size-4 mr-0.5" />
            <ChevronLeft className="size-4 -ml-2" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => panTimeline(-1)}
            title="Previous Day"
            className="cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Button
            variant="outline"
            onClick={jumpToToday}
            className="text-xs font-bold px-3 py-1 cursor-pointer"
          >
            Current Week
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => panTimeline(1)}
            title="Next Day"
            className="cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => panTimeline(7)}
            title="Next Week"
            className="cursor-pointer"
          >
            <ChevronRight className="size-4 mr-0.5" />
            <ChevronRight className="size-4 -ml-2" />
          </Button>
        </div>
      </div>

      {/* Gantt Grid Timeline Card */}
      <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto min-w-[800px]">
            <table className="w-full border-collapse">
              {/* Calendar Timeline Header row */}
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="w-48 text-left py-3 px-4 font-bold text-slate-500 text-xs border-r border-slate-200">
                    Product Line
                  </th>
                  {visibleDays.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const currentIsToday = isToday(day);
                    return (
                      <th
                        key={dateStr}
                        className={cn(
                          "text-center py-2.5 text-xs font-bold border-r border-slate-100 min-w-[120px]",
                          currentIsToday ? "bg-sky-500/10 text-sky-800" : "text-slate-500"
                        )}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-60">
                            {format(day, "EEE")}
                          </span>
                          <span className="text-sm font-black mt-0.5">
                            {format(day, "dd MMM")}
                          </span>
                          {currentIsToday && (
                            <span className="text-[9px] font-black uppercase text-sky-600 bg-sky-100 border border-sky-200 px-1 py-px rounded-md scale-90 mt-1">
                              Today
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Products Gantt rows */}
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                      Configure products before planning work schedules.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/20 group">
                      {/* Left header cell for product */}
                      <td className="w-48 py-4 px-4 font-extrabold text-slate-800 text-xs border-r border-slate-200 bg-white sticky left-0 z-10">
                        {product.name}
                        <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                          ₹{product.sellingPrice.toFixed(0)}/unit
                        </span>
                      </td>

                      {/* Day cells */}
                      {visibleDays.map((day) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const currentIsToday = isToday(day);
                        
                        // Filter work orders matching product and date
                        const cellWos = workOrders.filter(
                          (wo) => wo.productId === product.id && wo.scheduledDate === dateStr
                        );

                        return (
                          <td
                            key={`${product.id}-${dateStr}`}
                            className={cn(
                              "p-2 border-r border-slate-100 align-top relative min-h-[96px]",
                              currentIsToday ? "bg-sky-500/5" : ""
                            )}
                          >
                            {/* Work order blocks container */}
                            <div className="space-y-1.5 min-h-[64px] flex flex-col justify-start">
                              {cellWos.map((wo) => (
                                <div
                                  key={wo.id}
                                  onClick={() => {
                                    setSelectedWoId(wo.id);
                                    setEditDialogOpen(true);
                                  }}
                                  className={cn(
                                    "p-2 rounded-lg border text-left cursor-pointer transition-all select-none shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
                                    getStatusColor(wo.status)
                                  )}
                                >
                                  <div className="flex justify-between items-start gap-1">
                                    <span className="font-mono text-[9px] font-black tracking-wide truncate">
                                      {wo.woNumber}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-[8px] font-black uppercase px-1 py-px tracking-wider bg-white shrink-0"
                                    >
                                      {wo.status}
                                    </Badge>
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-800 mt-1">
                                    {wo.targetQuantity} units
                                  </div>
                                  {wo.notes && (
                                    <p className="text-[8px] text-slate-400 mt-0.5 line-clamp-1 italic font-medium">
                                      {wo.notes}
                                    </p>
                                  )}
                                </div>
                              ))}

                              {/* Hover cell quick add block */}
                              <button
                                type="button"
                                onClick={() => handleTriggerQuickAdd(product.id, dateStr)}
                                className="w-full flex-1 border border-dashed border-slate-200 rounded-lg hover:border-sky-400 hover:bg-sky-50/50 flex items-center justify-center py-2.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-slate-400 hover:text-sky-600 mt-auto min-h-[28px]"
                                title="Quick Schedule Work Order"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Timeline helpful hint info banner */}
      <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-500">
        <Info className="size-4 text-sky-600 shrink-0 mt-0.5" />
        <span>
          <strong>Timeline tips:</strong> Hover over any date column in a product line to click the dashed <strong>+ Button</strong> to quickly insert a scheduled batch. Click on any existing card to reschedule by single days, modify metrics, or edit metadata.
        </span>
      </div>

      {/* Edit & Reschedule Dialog Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[460px] bg-white border border-slate-200 rounded-xl shadow-lg">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader className="border-b border-slate-100 pb-3">
              <DialogTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Edit2 className="size-4 text-sky-600" />
                Reschedule Work Order: {selectedWo?.woNumber}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-1">
                Modify production target size, update shift status, or shift calendar dates.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              {/* Product and status info */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Product Line</span>
                  <span className="text-xs font-black text-slate-700 mt-0.5 block">
                    {selectedWo?.productName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Current Status</span>
                  <span className="mt-0.5 block">
                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-2 py-0.5", getStatusColor(selectedWo?.status || "Scheduled"))}>
                      {selectedWo?.status}
                    </Badge>
                  </span>
                </div>
              </div>

              {/* Timeline date shifter tools */}
              <div className="space-y-2">
                <Label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Quick Calendar Rescheduling
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleQuickShift(-1)}
                    className="flex-1 text-[11px] h-8 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="size-3.5" />
                    Shift -1 Day
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleQuickShift(1)}
                    className="flex-1 text-[11px] h-8 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Shift +1 Day
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Target Quantity Input */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-wo-quantity" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Target Production Size (Units)
                </Label>
                <Input
                  id="edit-wo-quantity"
                  type="number"
                  min="1"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  required
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs h-9"
                />
              </div>

              {/* Date Input */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-wo-date" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Scheduled Date
                </Label>
                <Input
                  id="edit-wo-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs h-9"
                />
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-wo-status" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Work Order Status
                </Label>
                <Select value={editStatus} onValueChange={(val) => setEditStatus(val as WorkOrderStatus)}>
                  <SelectTrigger id="edit-wo-status" className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs h-9">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 text-slate-700">
                    <SelectItem value="Draft" className="text-xs">Draft</SelectItem>
                    <SelectItem value="Scheduled" className="text-xs">Scheduled</SelectItem>
                    <SelectItem value="In Progress" className="text-xs">In Progress</SelectItem>
                    <SelectItem value="Completed" className="text-xs">Completed</SelectItem>
                    <SelectItem value="Cancelled" className="text-xs">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-wo-notes" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Schedule Notes / Instructions
                </Label>
                <Textarea
                  id="edit-wo-notes"
                  placeholder="Additional mixing notes or logistics detail..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 pt-3 flex justify-between sm:justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={handleDeleteWo}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs h-9 flex gap-1 items-center cursor-pointer mr-auto"
              >
                <Trash2 className="size-3.5" />
                Delete Order
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  className="text-xs h-9 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-xs h-9 cursor-pointer"
                >
                  Apply Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Add Work Order Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[460px] bg-white border border-slate-200 rounded-xl shadow-lg">
          <form onSubmit={handleQuickAddSubmit}>
            <DialogHeader className="border-b border-slate-100 pb-3">
              <DialogTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Plus className="size-4 text-sky-600" />
                Schedule Work Order
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-1">
                Insert a scheduled production run onto the timeline.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              {/* Product Info */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Product Line
                </Label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 text-xs font-semibold">
                  {products.find((p) => p.id === createProductId)?.name}
                </div>
              </div>

              {/* Quantity Input */}
              <div className="space-y-1.5">
                <Label htmlFor="create-wo-quantity" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Target Quantity (Units)
                </Label>
                <Input
                  id="create-wo-quantity"
                  type="number"
                  min="1"
                  placeholder="e.g. 500"
                  value={createQuantity}
                  onChange={(e) => setCreateQuantity(e.target.value)}
                  required
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs h-9"
                />
              </div>

              {/* Scheduled Date */}
              <div className="space-y-1.5">
                <Label htmlFor="create-wo-date" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Scheduled Date
                </Label>
                <Input
                  id="create-wo-date"
                  type="date"
                  value={createDate}
                  onChange={(e) => setCreateDate(e.target.value)}
                  required
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs h-9"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="create-wo-notes" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Instructions / Shift Details
                </Label>
                <Textarea
                  id="create-wo-notes"
                  placeholder="Special concrete instructions..."
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  rows={3}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="text-xs h-9 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-xs h-9 cursor-pointer"
              >
                Schedule Batch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
