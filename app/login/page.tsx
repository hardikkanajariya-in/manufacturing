"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { Factory, Lock, Mail, AlertCircle } from "lucide-react";

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
        setError("Invalid email format or password. Ensure email ends with @cementpro.com and password is 'password'.");
      }
    }, 800);
  };

  const fillCredentials = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("password");
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-slate-900 via-slate-950 to-black px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] size-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] size-96 rounded-full bg-slate-500/10 blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-slate-900/60 shadow-xl backdrop-blur-md text-primary mb-4">
            <Factory className="size-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">CementPro MES</h1>
          <p className="mt-2 text-sm text-slate-400">Manufacturing Execution & Inventory System</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In to Dashboard</h2>

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-destructive/15 p-3 text-xs text-destructive-foreground border border-destructive/25 mb-5">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <Mail className="size-4" />
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/40 py-2.5 pr-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-primary focus:outline-hidden"
                  placeholder="name@cementpro.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Access Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <Lock className="size-4" />
                </span>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/40 py-2.5 pr-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-primary focus:outline-hidden"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground py-2.5 text-sm font-semibold transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-6"
            >
              {loading ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Verifying...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-800 pt-6">
            <p className="text-xs font-medium text-slate-400 mb-3">Quick Access (Mock Accounts):</p>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("rajesh.sharma@cementpro.com")}
                className="w-full text-left rounded-lg bg-slate-950/50 hover:bg-slate-950 px-3.5 py-2.5 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Rajesh Sharma</span>
                  <span className="text-[10px] bg-primary/20 text-primary-foreground px-1.5 py-0.5 rounded-sm font-medium">
                    Plant Manager
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">rajesh.sharma@cementpro.com · password</p>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("operator.a@cementpro.com")}
                className="w-full text-left rounded-lg bg-slate-950/50 hover:bg-slate-950 px-3.5 py-2.5 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Operator A</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-sm font-medium">
                    Shift Operator
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">operator.a@cementpro.com · password</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
