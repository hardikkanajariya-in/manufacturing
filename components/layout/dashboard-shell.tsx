"use client";

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
