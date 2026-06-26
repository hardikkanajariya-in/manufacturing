"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItemsForRole, isNavChildActive, isNavItemActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useManufacturing } from "@/context/manufacturing-context";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useManufacturing();
  const items = getNavItemsForRole(user.role);

  const mobileItems = items.flatMap((item) => {
    if (item.children?.length) {
      return item.children.map((child) => ({
        href: child.href,
        title: child.title,
        icon: child.icon ?? item.icon,
      }));
    }
    return [{ href: item.href, title: item.title, icon: item.icon }];
  });

  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 lg:hidden scrollbar-none"
      aria-label="Main navigation"
    >
      {mobileItems.map((item) => {
        const isActive = item.href.startsWith("/production/schedule")
          ? isNavChildActive(pathname, item.href)
          : isNavItemActive(pathname, item.href);
        const NavIcon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.title}
            className={cn(
              "flex min-w-[3.25rem] shrink-0 flex-col items-center gap-0.5 rounded-[var(--radius-button)] px-2 py-1.5 text-[10px] font-medium brand-transition sm:min-w-0 sm:flex-row sm:gap-1.5 sm:px-2.5 sm:text-xs",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <NavIcon className="size-4 shrink-0 stroke-[2]" />
            <span className="max-w-[4.5rem] truncate sm:max-w-none sm:whitespace-nowrap">
              {item.title}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
