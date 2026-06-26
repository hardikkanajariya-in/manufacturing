"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appInfo, getNavItemsForRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useManufacturing } from "@/context/manufacturing-context";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";

export function AppSidebar() {
  const pathname = usePathname();
  const Icon = appInfo.icon;
  const { user, activeUnit } = useManufacturing();
  const items = getNavItemsForRole(user.role);

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
        {items.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const NavIcon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-[var(--radius-button)] px-3 py-2 text-sm font-medium brand-transition",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/85 hover:bg-white/[0.08] hover:text-sidebar-foreground"
              )}
            >
              <NavIcon
                className={cn(
                  "size-4 shrink-0 stroke-[2]",
                  isActive ? "text-white" : "text-sidebar-icon"
                )}
              />
              {item.title}
            </Link>
          );
        })}
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
