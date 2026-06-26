"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appInfo, getNavItemsForRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useManufacturing } from "@/context/manufacturing-context";

export function AppSidebar() {
  const pathname = usePathname();
  const Icon = appInfo.icon;
  const { user, activeUnit } = useManufacturing();
  const items = getNavItemsForRole(user.role);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar xl:w-64">
      <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-accent">
          <Icon className="size-4 text-sidebar-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">{appInfo.name}</p>
          <p className="truncate text-[11px] text-sidebar-foreground/60">{appInfo.subtitle}</p>
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
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <NavIcon className="size-4 shrink-0 opacity-80" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <p className="text-[11px] font-semibold text-sidebar-primary">{activeUnit.code}</p>
        <p className="mt-0.5 truncate text-xs text-sidebar-foreground">{activeUnit.name}</p>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-sidebar-foreground/70">
          <span className="size-1.5 rounded-full bg-success" />
          Operational
        </p>
      </div>
    </aside>
  );
}
