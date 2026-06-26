"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { Factory, Lock, Mail, AlertCircle, ShieldAlert } from "lucide-react";
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
      {/* Left Panel: Factory Image (Hidden on mobile) */}
      <div 
        className="hidden lg:block lg:w-1/2 relative overflow-hidden border-r border-slate-200"
        style={{
          backgroundImage: "url('/cement_factory.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Soft dark gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/30 pointer-events-none" />
      </div>

      {/* Right Panel: Login Card Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:hidden">
            <div className="inline-flex size-12 items-center justify-center rounded-lg bg-sky-600 shadow-md text-white mb-3">
              <Factory className="size-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">CementPro Portal</h1>
            <p className="text-xs text-slate-500 mt-1">Production & Inventory System</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-slate-900">Sign In</h2>
              <p className="text-xs text-slate-500 mt-1">Please sign in with your credentials to access your dashboard.</p>
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
              <p className="text-xs font-semibold text-slate-500 mb-3">Quick Login (Shift Roles):</p>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials("rajesh.sharma@cementpro.com")}
                  className="w-full text-left rounded-lg bg-slate-50 hover:bg-slate-100/85 px-4 py-3 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Rajesh Sharma</span>
                    <span className="text-[10px] text-slate-400">Shift Manager</span>
                  </div>
                  <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-xs px-2.5 py-0.5 font-medium">
                    Manager
                  </Badge>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials("operator.a@cementpro.com")}
                  className="w-full text-left rounded-lg bg-slate-50 hover:bg-slate-100/85 px-4 py-3 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Amit Patel</span>
                    <span className="text-[10px] text-slate-400">Shift Operator</span>
                  </div>
                  <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300 text-xs px-2.5 py-0.5 font-medium">
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
