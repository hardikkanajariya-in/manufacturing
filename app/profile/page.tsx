"use client";

import * as React from "react";
import { useManufacturing } from "@/context/manufacturing-context";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Calendar, Phone, Shield, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useManufacturing();

  const [name, setName] = React.useState(user.name);
  const [email, setEmail] = React.useState(user.email);
  const [phone, setPhone] = React.useState(user.phone);
  const [shift, setShift] = React.useState(user.shift);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone);
    setShift(user.shift);
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, email, phone, shift });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DashboardShell
      title="User Profile"
      description="Manage your account profile and credentials"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Avatar & Summary Info Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative flex size-24 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 text-3xl font-bold shadow-inner">
                {initials}
                <span className="absolute bottom-0 right-0 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-white"></span>
                </span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-foreground">{user.name}</h2>
              <p className="text-sm font-medium text-primary">{user.role}</p>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Active Duty
              </div>
            </div>

            <hr className="my-6 border-border" />

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Shield className="size-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Access Role</p>
                  <p className="font-semibold text-foreground truncate">Super-Administrator</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="size-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Employee ID</p>
                  <p className="font-semibold text-foreground truncate">{user.employeeId}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Editable Profile Form Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Edit Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-6">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Profile details updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name-input" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                      <User className="size-4" />
                    </span>
                    <input
                      type="text"
                      id="name-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-10 text-sm focus:border-primary focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email-input" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                      <Mail className="size-4" />
                    </span>
                    <input
                      type="email"
                      id="email-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-10 text-sm focus:border-primary focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone-input" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                      <Phone className="size-4" />
                    </span>
                    <input
                      type="tel"
                      id="phone-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-10 text-sm focus:border-primary focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="shift-input" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Shift Schedule
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                      <Calendar className="size-4" />
                    </span>
                    <select
                      id="shift-input"
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-10 text-sm focus:border-primary focus:outline-hidden"
                    >
                      <option value="Shift A (06:00 – 14:00)">Shift A (06:00 – 14:00)</option>
                      <option value="Shift B (14:00 – 22:00)">Shift B (14:00 – 22:00)</option>
                      <option value="Shift C (22:00 – 06:00)">Shift C (22:00 – 06:00)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2 text-sm font-semibold transition-colors duration-150 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
