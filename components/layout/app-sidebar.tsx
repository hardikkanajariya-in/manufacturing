"use client";

import { appInfo } from "@/lib/navigation";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useManufacturing } from "@/context/manufacturing-context";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";

export function AppSidebar() {
  const Icon = appInfo.icon;
  const { activeUnit } = useManufacturing();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-sidebar xl:w-64">
      <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex size-9 items-center justify-center rounded-[var(--radius-button)] bg-brand-steel">
          <Icon className="size-[18px] text-white stroke-[2]" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-bold text-sidebar-foreground">
            {appInfo.name}
          </p>
          <p className="truncate text-[11px] text-sidebar-icon">{appInfo.subtitle}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <SidebarNav />
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-1">
        <PwaInstallButton variant="sidebar" />
      </div>

      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs font-semibold text-sidebar-icon">{activeUnit.code}</p>
        <p className="mt-0.5 truncate text-sm text-sidebar-foreground">{activeUnit.name}</p>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-sidebar-icon">
          <span className="size-1.5 rounded-full bg-success" />
          Operational
        </p>
      </div>
    </aside>
  );
}
