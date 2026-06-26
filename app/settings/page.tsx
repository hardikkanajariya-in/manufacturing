"use client";

import * as React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Target, Bell, CheckCircle2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { settings, updateSettings, user, units, addUnit } = useManufacturing();
  const router = useRouter();

  const [paverTarget, setPaverTarget] = React.useState(settings.targetDailyOutput["Paver Blocks"]);
  const [kerbTarget, setKerbTarget] = React.useState(settings.targetDailyOutput["Kerb Stones"]);
  const [pipeTarget, setPipeTarget] = React.useState(settings.targetDailyOutput["RCC Pipes"]);
  const [lowStockThreshold, setLowStockThreshold] = React.useState(settings.lowStockThreshold);
  const [emailAlerts, setEmailAlerts] = React.useState(settings.enableEmailAlerts);
  const [smsAlerts, setSmsAlerts] = React.useState(settings.enableSmsAlerts);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = React.useState("units");
  const [newUnitCode, setNewUnitCode] = React.useState("");
  const [newUnitName, setNewUnitName] = React.useState("");
  const [newUnitLocation, setNewUnitLocation] = React.useState("");

  useEffect(() => {
    if (user.role === "Operator") {
      router.push("/production");
    }
  }, [user, router]);

  React.useEffect(() => {
    setPaverTarget(settings.targetDailyOutput["Paver Blocks"]);
    setKerbTarget(settings.targetDailyOutput["Kerb Stones"]);
    setPipeTarget(settings.targetDailyOutput["RCC Pipes"]);
    setLowStockThreshold(settings.lowStockThreshold);
    setEmailAlerts(settings.enableEmailAlerts);
    setSmsAlerts(settings.enableSmsAlerts);
  }, [settings]);

  if (user.role === "Operator") {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      targetDailyOutput: {
        "Paver Blocks": Number(paverTarget),
        "Kerb Stones": Number(kerbTarget),
        "RCC Pipes": Number(pipeTarget),
      },
      lowStockThreshold: Number(lowStockThreshold),
      enableEmailAlerts: emailAlerts,
      enableSmsAlerts: smsAlerts,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitCode.trim() || !newUnitName.trim()) return;
    addUnit({
      code: newUnitCode.trim().toUpperCase(),
      name: newUnitName.trim(),
      location: newUnitLocation.trim() || "—",
      isActive: true,
    });
    setNewUnitCode("");
    setNewUnitName("");
    setNewUnitLocation("");
  };

  return (
    <DashboardShell
      title="Settings"
      description="Manufacturing units, production targets, and alerts"
    >
      <div className="space-y-6">
        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success border border-success/20">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Settings saved.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs
            orientation="vertical"
            value={activeSettingsTab}
            onValueChange={setActiveSettingsTab}
            defaultValue="units"
            className="flex flex-col md:flex-row gap-6"
          >
            <TabsList variant="line" className="md:w-52 shrink-0">
              <TabsTrigger value="units" className="justify-start gap-2 px-3 py-2 cursor-pointer text-sm">
                <Building2 className="size-4 shrink-0" />
                Units
              </TabsTrigger>
              <TabsTrigger value="targets" className="justify-start gap-2 px-3 py-2 cursor-pointer text-sm">
                <Target className="size-4 shrink-0" />
                Output targets
              </TabsTrigger>
              <TabsTrigger value="alerts" className="justify-start gap-2 px-3 py-2 cursor-pointer text-sm">
                <Bell className="size-4 shrink-0" />
                Alerts
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-w-0">
              <TabsContent value="units" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Manufacturing units</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {units.map((unit) => (
                      <div key={unit.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{unit.code} — {unit.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{unit.location}</p>
                        </div>
                        <Badge variant="outline" className={unit.isActive ? "text-success border-success/30" : "text-muted-foreground"}>
                          {unit.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Register new unit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-3" onSubmit={handleAddUnit}>
                      <div className="space-y-1.5">
                        <Label htmlFor="unit-code">Unit code</Label>
                        <Input id="unit-code" value={newUnitCode} onChange={(e) => setNewUnitCode(e.target.value)} placeholder="U8" />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="unit-name">Plant name</Label>
                        <Input id="unit-name" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} placeholder="CementPro Factory — Unit 8" />
                      </div>
                      <div className="space-y-1.5 sm:col-span-3">
                        <Label htmlFor="unit-location">Location</Label>
                        <Input id="unit-location" value={newUnitLocation} onChange={(e) => setNewUnitLocation(e.target.value)} placeholder="City, State" />
                      </div>
                      <div className="sm:col-span-3">
                        <Button type="button" onClick={handleAddUnit}>
                          <Plus className="size-4" />
                          Add unit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="targets" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Daily target output</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="paver-target">Paver blocks</Label>
                      <Input id="paver-target" type="number" min="0" value={paverTarget} onChange={(e) => setPaverTarget(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="kerb-target">Kerb stones</Label>
                      <Input id="kerb-target" type="number" min="0" value={kerbTarget} onChange={(e) => setKerbTarget(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pipe-target">RCC pipes</Label>
                      <Input id="pipe-target" type="number" min="0" value={pipeTarget} onChange={(e) => setPipeTarget(Number(e.target.value))} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Alert configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5 max-w-xs">
                      <Label htmlFor="stock-threshold">Low stock threshold</Label>
                      <Input id="stock-threshold" type="number" min="1" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(Number(e.target.value))} />
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} className="size-4 rounded border-border" />
                      Email notifications for low stock
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} className="size-4 rounded border-border" />
                      SMS alerts for critical incidents
                    </label>
                  </CardContent>
                </Card>
              </TabsContent>

              {activeSettingsTab !== "units" && (
                <div className="flex justify-end mt-6">
                  <Button type="submit">Save settings</Button>
                </div>
              )}
            </div>
          </Tabs>
        </form>
      </div>
    </DashboardShell>
  );
}
