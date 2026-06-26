"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  FlaskConical,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Plus,
  Info,
  AlertTriangle,
  Search,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

// Define QC Record structure
export interface QcRecord {
  id: string;
  productionRecordId: string;
  productName: string;
  productionDate: string;
  batchQuantity: number;
  testDate: string;
  strength7d: number; // MPa
  strength28d: number; // MPa (0 or empty means pending)
  status: "Pass" | "Fail" | "Pending";
  technicianNotes?: string;
  createdAt: string;
}

// Help compute days ago strings
function daysAgoString(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

export function QcLedger() {
  const { productionRecords } = useManufacturing();

  const [qcRecords, setQcRecords] = useState<QcRecord[]>([]);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [prodRecordId, setProdRecordId] = useState("");
  const [strength7d, setStrength7d] = useState("");
  const [strength28d, setStrength28d] = useState("");
  const [testDate, setTestDate] = useState(getTodayString());
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Load and seed records
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cementpro_qc_records");
      if (stored) {
        try {
          setQcRecords(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse QC records from localStorage", e);
        }
      } else {
        // Seed mock records linked to older production runs
        const seedRecords: QcRecord[] = [
          {
            id: "qc-rec-1",
            productionRecordId: "prod-rec-3",
            productName: "RCC Pipes",
            productionDate: daysAgoString(1),
            batchQuantity: 45,
            testDate: daysAgoString(0),
            strength7d: 28.5,
            strength28d: 38.2,
            status: "Pass",
            technicianNotes: "Passed target 35 MPa comfortably. Excellent grade RCC reinforcement.",
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: "qc-rec-2",
            productionRecordId: "prod-rec-4",
            productName: "Paver Blocks",
            productionDate: daysAgoString(2),
            batchQuantity: 280,
            testDate: daysAgoString(1),
            strength7d: 25.1,
            strength28d: 36.4,
            status: "Pass",
            technicianNotes: "Meets paving stone specification limits. Water balance holds up.",
            createdAt: new Date(Date.now() - 7200000).toISOString(),
          },
          {
            id: "qc-rec-3",
            productionRecordId: "prod-rec-5",
            productName: "Kerb Stones",
            productionDate: daysAgoString(3),
            batchQuantity: 150,
            testDate: daysAgoString(2),
            strength7d: 22.0,
            strength28d: 33.1,
            status: "Fail",
            technicianNotes: "Under strength target of 35 MPa. Water-binder ratio was too high due to sand moisture variations. Suggested adjusting raw sliders.",
            createdAt: new Date(Date.now() - 10800000).toISOString(),
          },
        ];
        setQcRecords(seedRecords);
        localStorage.setItem("cementpro_qc_records", JSON.stringify(seedRecords));
      }
    }
  }, []);

  // Save helper
  const saveRecords = (newRecords: QcRecord[]) => {
    setQcRecords(newRecords);
    localStorage.setItem("cementpro_qc_records", JSON.stringify(newRecords));
  };

  // Filter out production runs that have already been tested to keep options clean,
  // but allow them if we want. For now, only show un-tested ones
  const availableProductionRuns = useMemo(() => {
    return productionRecords.filter(
      (pr) => !qcRecords.some((qr) => qr.productionRecordId === pr.id)
    );
  }, [productionRecords, qcRecords]);

  // Set default production run selection when opening
  useEffect(() => {
    if (logDialogOpen) {
      if (availableProductionRuns.length > 0) {
        setProdRecordId(availableProductionRuns[0].id);
      } else {
        setProdRecordId("");
      }
      setStrength7d("");
      setStrength28d("");
      setTestDate(getTodayString());
      setNotes("");
      setFormError(null);
    }
  }, [logDialogOpen, availableProductionRuns]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = qcRecords.length;
    const completed28d = qcRecords.filter((r) => r.strength28d > 0);
    const passed = completed28d.filter((r) => r.status === "Pass").length;
    const passRate = completed28d.length > 0 ? (passed / completed28d.length) * 100 : 0;
    
    const sumStrength = completed28d.reduce((sum, r) => sum + r.strength28d, 0);
    const avgStrength = completed28d.length > 0 ? sumStrength / completed28d.length : 0;

    const pendingCount = qcRecords.filter((r) => r.strength28d === 0 || r.status === "Pending").length;

    return {
      total,
      passRate,
      avgStrength,
      pendingCount,
    };
  }, [qcRecords]);

  // Handle new record logging
  const handleLogTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetBatch = productionRecords.find((pr) => pr.id === prodRecordId);
    if (!targetBatch) {
      setFormError("Please select a valid production batch.");
      return;
    }

    const s7 = Number(strength7d);
    const s28 = strength28d ? Number(strength28d) : 0;

    if (isNaN(s7) || s7 <= 0) {
      setFormError("Please enter a valid 7-day strength.");
      return;
    }

    if (strength28d && (isNaN(s28) || s28 < 0)) {
      setFormError("Please enter a valid 28-day strength or leave it empty.");
      return;
    }

    let status: "Pass" | "Fail" | "Pending" = "Pending";
    if (s28 > 0) {
      status = s28 >= 35 ? "Pass" : "Fail";
    }

    const newRecord: QcRecord = {
      id: `qc-rec-${Date.now()}`,
      productionRecordId: targetBatch.id,
      productName: targetBatch.productName,
      productionDate: targetBatch.productionDate,
      batchQuantity: targetBatch.quantity,
      testDate,
      strength7d: s7,
      strength28d: s28,
      status,
      technicianNotes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    saveRecords([newRecord, ...qcRecords]);
    setLogDialogOpen(false);
  };

  // Delete test entry
  const handleDeleteRecord = (id: string) => {
    if (confirm("Are you sure you want to delete this Quality Control record?")) {
      const filtered = qcRecords.filter((r) => r.id !== id);
      saveRecords(filtered);
    }
  };

  // Search filter
  const filteredRecords = useMemo(() => {
    return qcRecords.filter(
      (r) =>
        r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.productionRecordId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [qcRecords, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FlaskConical className="size-5 text-sky-600 animate-pulse" />
            Concrete Lab Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track compressive strength (MPa) of precast concrete production runs.
          </p>
        </div>
        <Button
          onClick={() => setLogDialogOpen(true)}
          className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="size-4" />
          Log Strength Test
        </Button>
      </div>

      {/* KPI stats section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Tests Logged</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800">{stats.total}</span>
              <span className="text-xs text-slate-400 font-medium">batches audited</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Pass Rate (Target ≥35 MPa)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={cn(
                  "text-2xl font-black",
                  stats.passRate >= 80
                    ? "text-emerald-600"
                    : stats.passRate >= 60
                      ? "text-amber-500"
                      : "text-rose-500"
                )}
              >
                {formatNumber(stats.passRate, 1)}%
              </span>
              <span className="text-xs text-slate-400 font-medium">of 28-day tests</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Avg 28-Day Strength</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-sky-700">{formatNumber(stats.avgStrength, 1)} MPa</span>
              <span className="text-xs text-slate-400 font-medium">overall mix</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Pending 28d Crushing</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={cn(
                  "text-2xl font-black",
                  stats.pendingCount > 0 ? "text-amber-600" : "text-slate-500"
                )}
              >
                {stats.pendingCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">awaiting final age</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Ledger Table */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 py-4 px-6">
          <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            Ledger test log history
          </CardTitle>

          {/* Search bar */}
          <div className="relative w-full max-w-xs shrink-0">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:border-sky-500 focus:outline-hidden"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 px-6">
              <ClipboardCheck className="size-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">No QC records matched</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
                No compression tests match the filters or none have been logged yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                    <TableHead className="font-bold text-slate-500 py-3 pl-6">Batch ID</TableHead>
                    <TableHead className="font-bold text-slate-500">Product Name</TableHead>
                    <TableHead className="font-bold text-slate-500 text-right">Batch Size</TableHead>
                    <TableHead className="font-bold text-slate-500">Production Date</TableHead>
                    <TableHead className="font-bold text-slate-500 text-right">7-Day MPa</TableHead>
                    <TableHead className="font-bold text-slate-500 text-right">28-Day MPa</TableHead>
                    <TableHead className="font-bold text-slate-500">QC Status</TableHead>
                    <TableHead className="font-bold text-slate-500">Test Date</TableHead>
                    <TableHead className="font-bold text-slate-500 text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-slate-50/50 border-b border-slate-100">
                      <TableCell className="font-mono text-xs text-slate-500 py-3.5 pl-6">
                        {record.productionRecordId}
                      </TableCell>
                      <TableCell className="font-bold text-slate-700">
                        {record.productName}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-slate-600">
                        {formatNumber(record.batchQuantity)} units
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {format(new Date(record.productionDate), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-slate-700">
                        {record.strength7d.toFixed(1)} MPa
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-sky-700">
                        {record.strength28d > 0 ? `${record.strength28d.toFixed(1)} MPa` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border",
                            record.status === "Pass"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : record.status === "Fail"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                          )}
                        >
                          <span className="flex items-center gap-1">
                            {record.status === "Pass" && <CheckCircle2 className="size-3" />}
                            {record.status === "Fail" && <XCircle className="size-3" />}
                            {record.status === "Pending" && <Clock className="size-3" />}
                            {record.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {format(new Date(record.testDate), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRecord(record.id)}
                          className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg size-8 cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technician Notes Panel */}
      {qcRecords.some((r) => r.technicianNotes) && (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="py-4 border-b border-slate-100">
            <CardTitle className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Info className="size-4 text-slate-400" />
              Quality Control Logs & Observations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 text-xs">
              {qcRecords
                .filter((r) => r.technicianNotes)
                .map((record) => (
                  <div key={`notes-${record.id}`} className="p-4 flex gap-3 items-start hover:bg-slate-50/20">
                    <div className="shrink-0 mt-0.5">
                      {record.status === "Pass" ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="size-4 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex gap-2 items-center">
                        <span className="font-bold text-slate-700">{record.productName}</span>
                        <span className="font-mono text-[10px] text-slate-400">({record.productionRecordId})</span>
                        <span className="text-[10px] text-slate-400">• {format(new Date(record.testDate), "dd MMM yyyy")}</span>
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed font-medium">
                        {record.technicianNotes}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log Compression Test Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white border border-slate-200 rounded-xl shadow-lg">
          <form onSubmit={handleLogTestSubmit}>
            <DialogHeader className="border-b border-slate-100 pb-3">
              <DialogTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <FlaskConical className="size-5 text-sky-600" />
                Log Batch Compression Test
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-1">
                Enter lab cylinder crushing results to certify strength characteristics.
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <div className="mt-3 flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 animate-fadeIn">
                <XCircle className="size-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4 py-4 text-xs">
              {/* Production Run Select */}
              <div className="space-y-1.5">
                <Label htmlFor="production-run" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Select Untested Production Batch
                </Label>
                {availableProductionRuns.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center text-slate-500 text-xs font-semibold">
                    No untested production batches available. Create a production entry first.
                  </div>
                ) : (
                  <Select value={prodRecordId} onValueChange={(val) => setProdRecordId(val || "")}>
                    <SelectTrigger id="production-run" className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs h-9">
                      <SelectValue placeholder="Select batch run" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 text-slate-700 max-h-56">
                      {availableProductionRuns.map((pr) => (
                        <SelectItem key={pr.id} value={pr.id} className="text-xs">
                          {pr.productName} — {format(new Date(pr.productionDate), "dd MMM")} ({pr.quantity} units, {pr.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* MPa Strength Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="strength-7d" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    7-Day Strength (MPa)
                  </Label>
                  <Input
                    id="strength-7d"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 24.5"
                    value={strength7d}
                    onChange={(e) => setStrength7d(e.target.value)}
                    required
                    disabled={availableProductionRuns.length === 0}
                    className="bg-slate-50 border border-slate-200 text-slate-800 text-xs h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="strength-28d" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    28-Day Strength (MPa)
                  </Label>
                  <Input
                    id="strength-28d"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 36.8 (optional)"
                    value={strength28d}
                    onChange={(e) => setStrength28d(e.target.value)}
                    disabled={availableProductionRuns.length === 0}
                    className="bg-slate-50 border border-slate-200 text-slate-800 text-xs h-9"
                  />
                  <span className="text-[9px] text-slate-400 block font-medium">Leave blank if pending 28-day maturity age.</span>
                </div>
              </div>

              {/* Target benchmark note */}
              <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[10px] text-slate-500">
                <Info className="size-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Standard Precast Spec:</strong> Batches must hit a minimum of <strong>35 MPa</strong> at 28 days to yield a <strong>Pass</strong> status.
                </span>
              </div>

              {/* Test Date */}
              <div className="space-y-1.5">
                <Label htmlFor="test-date" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Test Evaluation Date
                </Label>
                <Input
                  id="test-date"
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  required
                  disabled={availableProductionRuns.length === 0}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs h-9"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="qc-notes" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Technician Observations / Notes
                </Label>
                <Textarea
                  id="qc-notes"
                  placeholder="Describe fracturing behavior, slump, curing conditions, or failure modes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={availableProductionRuns.length === 0}
                  rows={3}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLogDialogOpen(false)}
                className="text-xs h-9 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={availableProductionRuns.length === 0}
                className="text-xs h-9 cursor-pointer"
              >
                Log Test Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
