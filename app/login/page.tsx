"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { Factory, Lock, Mail, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        setError("Invalid credentials. Use your @cementpro.com email and demo password.");
      }
    }, 400);
  };

  const fillCredentials = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("password");
    setError(null);
  };

  return (
    <div className="relative flex min-h-dvh bg-background">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden border-r border-border">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/cement_factory.png')",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-brand-navy/55" aria-hidden />
        <div
          className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-brand-navy via-brand-navy/90 to-transparent"
          aria-hidden
        />
        <div className="absolute bottom-0 left-0 right-0 p-8 pb-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-white/90">
            CementPro MES
          </p>
          <h2 className="font-heading text-2xl font-bold leading-snug mt-2 text-white sm:text-3xl max-w-md">
            Manufacturing execution for precast plants
          </h2>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:hidden">
            <div className="inline-flex size-11 items-center justify-center rounded-[var(--radius-button)] bg-primary text-primary-foreground mb-3">
              <Factory className="size-5 stroke-[2]" />
            </div>
            <h1 className="font-heading text-xl font-bold">CementPro</h1>
            <p className="text-xs text-muted-foreground mt-1">Manufacturing execution system</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 mb-4">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      placeholder="name@cementpro.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>

              <div className="mt-6 border-t border-border pt-4 space-y-2">
                <p className="text-xs text-muted-foreground">Demo accounts (password: password)</p>
                <button
                  type="button"
                  onClick={() => fillCredentials("rajesh.sharma@cementpro.com")}
                  className="w-full text-left rounded-lg border border-border px-3 py-2.5 hover:bg-muted transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium block truncate">Rajesh Sharma</span>
                    <span className="text-xs text-muted-foreground">Manager — Unit 4</span>
                  </div>
                  <Badge variant="outline" className="shrink-0">Manager</Badge>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials("operator.a@cementpro.com")}
                  className="w-full text-left rounded-lg border border-border px-3 py-2.5 hover:bg-muted transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium block truncate">Amit Patel</span>
                    <span className="text-xs text-muted-foreground">Operator — Unit 4</span>
                  </div>
                  <Badge variant="outline" className="shrink-0">Operator</Badge>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <a
        href="https://hardikkanajariya.in"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-10 text-[11px] text-muted-foreground/80 hover:text-foreground transition-colors"
      >
        created by hardikkanajariya.in
      </a>
    </div>
  );
}
