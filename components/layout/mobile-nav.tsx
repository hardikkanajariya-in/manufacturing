"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItemsForRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useManufacturing } from "@/context/manufacturing-context";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useManufacturing();
  const items = getNavItemsForRole(user.role);

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 lg:hidden scrollbar-none">
      {items.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const NavIcon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-[var(--radius-button)] px-2.5 py-1.5 text-[11px] font-medium brand-transition sm:px-3 sm:text-xs",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <NavIcon className="size-3.5 shrink-0 stroke-[2]" />
            <span className="whitespace-nowrap">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
