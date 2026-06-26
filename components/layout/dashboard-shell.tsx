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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-muted/40">
      <div className="hidden h-full shrink-0 lg:block">
        <AppSidebar />
      </div>
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader title={title} description={description} />
        <MobileNav />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <div className="page-container">{children}</div>
        </main>
      </div>
    </div>
  );
}
