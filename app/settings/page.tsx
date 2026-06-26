"use client";

import * as React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Target, Bell, Info, CheckCircle2, ShieldAlert } from "lucide-react";

export default function SettingsPage() {
  const { settings, updateSettings, user } = useManufacturing();
  const router = useRouter();

  useEffect(() => {
    if (user.role === "Operator") {
      router.push("/production");
    }
  }, [user, router]);

  if (user.role === "Operator") {
    return null;
  }

  const [plantName, setPlantName] = React.useState(settings.plantName);
  const [paverTarget, setPaverTarget] = React.useState(settings.targetDailyOutput["Paver Blocks"]);
  const [kerbTarget, setKerbTarget] = React.useState(settings.targetDailyOutput["Kerb Stones"]);
  const [pipeTarget, setPipeTarget] = React.useState(settings.targetDailyOutput["RCC Pipes"]);
  const [lowStockThreshold, setLowStockThreshold] = React.useState(settings.lowStockThreshold);
  const [emailAlerts, setEmailAlerts] = React.useState(settings.enableEmailAlerts);
  const [smsAlerts, setSmsAlerts] = React.useState(settings.enableSmsAlerts);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = React.useState("plant");

  React.useEffect(() => {
    setPlantName(settings.plantName);
    setPaverTarget(settings.targetDailyOutput["Paver Blocks"]);
    setKerbTarget(settings.targetDailyOutput["Kerb Stones"]);
    setPipeTarget(settings.targetDailyOutput["RCC Pipes"]);
    setLowStockThreshold(settings.lowStockThreshold);
    setEmailAlerts(settings.enableEmailAlerts);
    setSmsAlerts(settings.enableSmsAlerts);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      plantName,
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

  return (
    <DashboardShell
      title="System Settings"
      description="Configure plant variables, targets, and parameters"
    >
      <div className="space-y-6">
        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs
            orientation="vertical"
            value={activeSettingsTab}
            onValueChange={setActiveSettingsTab}
            defaultValue="plant"
            className="flex flex-col md:flex-row gap-6"
          >
            <TabsList variant="line" className="md:w-56 shrink-0">
              <TabsTrigger
                value="plant"
                className="justify-start gap-3 px-3 py-2.5 cursor-pointer"
              >
                <Building2 className="size-4 shrink-0" />
                Plant Config
              </TabsTrigger>
              <TabsTrigger
                value="targets"
                className="justify-start gap-3 px-3 py-2.5 cursor-pointer"
              >
                <Target className="size-4 shrink-0" />
                Output Targets
              </TabsTrigger>
              <TabsTrigger
                value="alerts"
                className="justify-start gap-3 px-3 py-2.5 cursor-pointer"
              >
                <Bell className="size-4 shrink-0" />
                Notification Alerts
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="justify-start gap-3 px-3 py-2.5 cursor-pointer"
              >
                <Info className="size-4 shrink-0" />
                System Info
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-w-0">
              <TabsContent value="plant" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Plant Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label htmlFor="plant-name-input" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Plant Operations Name
                      </label>
                      <input
                        type="text"
                        id="plant-name-input"
                        value={plantName}
                        onChange={(e) => setPlantName(e.target.value)}
                        className="w-full max-w-md rounded-lg border border-border bg-background py-2 px-3 text-sm focus:border-primary focus:outline-hidden"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="targets" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Daily Target Output</CardTitle>
                    <p className="text-xs text-muted-foreground">Define default unit output quotas for the production floor.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label htmlFor="paver-target-input" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Paver Blocks (units)
                        </label>
                        <input
                          type="number"
                          id="paver-target-input"
                          value={paverTarget}
                          onChange={(e) => setPaverTarget(Number(e.target.value))}
                          className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm focus:border-primary focus:outline-hidden"
                          required
                          min="0"
                        />
                      </div>
                      <div>
                        <label htmlFor="kerb-target-input" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Kerb Stones (units)
                        </label>
                        <input
                          type="number"
                          id="kerb-target-input"
                          value={kerbTarget}
                          onChange={(e) => setKerbTarget(Number(e.target.value))}
                          className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm focus:border-primary focus:outline-hidden"
                          required
                          min="0"
                        />
                      </div>
                      <div>
                        <label htmlFor="pipe-target-input" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          RCC Pipes (units)
                        </label>
                        <input
                          type="number"
                          id="pipe-target-input"
                          value={pipeTarget}
                          onChange={(e) => setPipeTarget(Number(e.target.value))}
                          className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm focus:border-primary focus:outline-hidden"
                          required
                          min="0"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Alert Configurations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label htmlFor="stock-threshold-input" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Low Raw Material Threshold (Kg / Litre)
                      </label>
                      <input
                        type="number"
                        id="stock-threshold-input"
                        value={lowStockThreshold}
                        onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                        className="w-full max-w-xs rounded-lg border border-border bg-background py-2 px-3 text-sm focus:border-primary focus:outline-hidden"
                        required
                        min="1"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Material stock levels below this number will flag a warning alert on the dashboard.
                      </p>
                    </div>

                    <hr className="border-border" />

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="email-alerts-input"
                          checked={emailAlerts}
                          onChange={(e) => setEmailAlerts(e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer"
                        />
                        <label htmlFor="email-alerts-input" className="text-sm font-medium text-foreground cursor-pointer">
                          Enable Email Notifications for Low Stock Warnings
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="sms-alerts-input"
                          checked={smsAlerts}
                          onChange={(e) => setSmsAlerts(e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer"
                        />
                        <label htmlFor="sms-alerts-input" className="text-sm font-medium text-foreground cursor-pointer">
                          Enable Mobile SMS Alerts for Critical Incidents
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="system" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">System Details & Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Software Stack</p>
                        <p className="font-medium text-foreground mt-1">Next.js 16 (Turbopack) / React 19</p>
                      </div>
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Theme Engine</p>
                        <p className="font-medium text-foreground mt-1">Tailwind CSS v4 (Embedded @theme)</p>
                      </div>
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Database Adapter</p>
                        <p className="font-medium text-foreground mt-1">Mock In-Memory JSON State Store</p>
                      </div>
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Uptime Server</p>
                        <p className="font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          Online (100% stable)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {activeSettingsTab !== "system" && (
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2 text-sm font-semibold transition-colors duration-150 cursor-pointer"
                  >
                    Save Settings
                  </button>
                </div>
              )}
            </div>
          </Tabs>
        </form>
      </div>
    </DashboardShell>
  );
}
