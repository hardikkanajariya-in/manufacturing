"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appInfo, navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useManufacturing } from "@/context/manufacturing-context";

export function AppSidebar() {
  const pathname = usePathname();
  const Icon = appInfo.icon;
  const { user, settings } = useManufacturing();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex size-9 items-center justify-center rounded-md border border-sidebar-border bg-background">
          <Icon className="size-5 text-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            {appInfo.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {appInfo.subtitle}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const NavIcon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <NavIcon className="size-4 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider">{settings.plantName}</p>
        <p className="mt-1 text-sm font-medium text-sidebar-foreground flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          Plant Operational
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{user.shift}</p>
      </div>
    </aside>
  );
}
