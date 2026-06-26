"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import {
  getNavItemsForRole,
  isNavChildActive,
  isNavGroupActive,
  isNavItemActive,
  type NavItem,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  nested,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  nested?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-[var(--radius-button)] py-2 text-sm font-medium brand-transition",
        nested ? "pl-9 pr-3" : "px-3",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 stroke-[2]",
          active ? "text-white" : "text-sidebar-icon"
        )}
      />
      {label}
    </Link>
  );
}

function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const groupActive = isNavGroupActive(pathname, item);
  const [open, setOpen] = React.useState(groupActive);

  React.useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  const ParentIcon = item.icon;

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[var(--radius-button)] px-3 py-2 text-sm font-medium brand-transition cursor-pointer",
          groupActive
            ? "bg-sidebar-accent/80 text-sidebar-accent-foreground"
            : "text-sidebar-foreground/85 hover:bg-white/[0.08] hover:text-sidebar-foreground"
        )}
        aria-expanded={open}
      >
        <ParentIcon
          className={cn(
            "size-4 shrink-0 stroke-[2]",
            groupActive ? "text-white" : "text-sidebar-icon"
          )}
        />
        <span className="flex-1 text-left">{item.title}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-sidebar-icon transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && item.children && (
        <div className="space-y-0.5">
          {item.children.map((child) => {
            const ChildIcon = child.icon ?? item.icon;
            return (
              <NavLink
                key={child.href}
                href={child.href}
                icon={ChildIcon}
                label={child.title}
                active={isNavChildActive(pathname, child.href)}
                nested
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useManufacturing();
  const items = getNavItemsForRole(user.role);

  return (
    <>
      {items.map((item) => {
        if (item.children?.length) {
          return <NavGroup key={item.href} item={item} pathname={pathname} />;
        }

        const isActive = isNavItemActive(pathname, item.href);
        return (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.title}
            active={isActive}
          />
        );
      })}
    </>
  );
}
