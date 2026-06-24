"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

interface DashboardShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function DashboardShell({
  title,
  description,
  children,
}: DashboardShellProps) {
  const { isAuthenticated } = useManufacturing();
  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <div className="hidden h-full lg:block">
        <AppSidebar />
      </div>
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader title={title} description={description} />
        <MobileNav />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
