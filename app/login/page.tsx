"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { Factory, Lock, Mail, AlertCircle, ShieldCheck, ShieldAlert, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const { login, isAuthenticated } = useManufacturing();
  const router = useRouter();

  const [email, setEmail] = React.useState("rajesh.sharma@cementpro.com");
  const [password, setPassword] = React.useState("password");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      setLoading(false);
      if (success) {
        router.push("/");
      } else {
        setError("Access Denied. Invalid credentials or incorrect password.");
      }
    }, 800);
  };

  const fillCredentials = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("password");
    setError(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left Panel: Blueprint & Information (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-sky-600 border border-sky-500 shadow-md">
            <Factory className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-wider uppercase leading-none">CementPro</h2>
            <p className="text-[10px] font-mono text-sky-400 uppercase tracking-widest mt-1">MES Unit-4</p>
          </div>
        </div>

        {/* Big Industrial Slogan */}
        <div className="relative z-10 my-auto max-w-md">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Enterprise Floor Control & Production Management
          </h1>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed">
            Real-time material consumption ledgers, batch quality tracking, scheduling logs, and role-based operational dispatching.
          </p>

          <div className="mt-8 space-y-4 text-xs text-slate-400">
            <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-800 rounded-lg p-3">
              <div className="flex size-8 items-center justify-center rounded-md bg-slate-800 text-sky-400 shrink-0">
                <Factory className="size-4" />
              </div>
              <div>
                <p className="text-white font-bold uppercase tracking-wider">Real-time Stock Management</p>
                <p className="text-[10px] text-slate-500">Automated material deduction on logged outputs</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-800 rounded-lg p-3">
              <div className="flex size-8 items-center justify-center rounded-md bg-slate-800 text-emerald-400 shrink-0">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <p className="text-white font-bold uppercase tracking-wider">Quality & Yield Tracking</p>
                <p className="text-[10px] text-slate-500">Monitor defect rates and good product output</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs font-mono text-slate-500 flex justify-between">
          <span>PORTAL: CEMENTPRO MES</span>
          <span>VERSION: 4.1.0</span>
        </div>
      </div>

      {/* Right Panel: Login Card Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:hidden">
            <div className="inline-flex size-12 items-center justify-center rounded-lg bg-sky-600 shadow-md text-white mb-3">
              <Factory className="size-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">CementPro MES</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Manufacturing Control Terminal</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-wide">Account Sign In</h2>
              <p className="text-xs text-slate-500 mt-1">Please sign in with your corporate credentials to access the console.</p>
            </div>

            {/* Warning block */}
            <div className="flex items-start gap-2.5 rounded-lg bg-slate-100 p-3 text-[11px] text-slate-600 border border-slate-200 mb-6 leading-relaxed">
              <ShieldAlert className="size-4 shrink-0 mt-0.5 text-slate-500" />
              <span>Authorized Personnel Only. Logins and transactions are subject to standard factory operational auditing.</span>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 mb-5">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Mail className="size-4" />
                  </span>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-10 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                    placeholder="name@cementpro.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Lock className="size-4" />
                  </span>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-10 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-sky-600 hover:bg-sky-500 text-white py-2.5 text-sm font-bold uppercase tracking-wider transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-6 border border-sky-700/50 shadow-sm"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            {/* Quick switcher */}
            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-mono">Demo Accounts (Shift Duty):</p>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials("rajesh.sharma@cementpro.com")}
                  className="w-full text-left rounded-lg bg-slate-50 hover:bg-slate-100/85 px-4 py-3 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Rajesh Sharma (Shift A)</span>
                    <span className="text-[10px] text-slate-400 font-mono">rajesh.sharma@cementpro.com</span>
                  </div>
                  <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5">
                    Manager
                  </Badge>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials("operator.a@cementpro.com")}
                  className="w-full text-left rounded-lg bg-slate-50 hover:bg-slate-100/85 px-4 py-3 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Amit Patel (Shift B)</span>
                    <span className="text-[10px] text-slate-400 font-mono">operator.a@cementpro.com</span>
                  </div>
                  <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5">
                    Operator
                  </Badge>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
