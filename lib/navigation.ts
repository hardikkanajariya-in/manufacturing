import {
  Factory,
  LayoutDashboard,
  Package,
  Boxes,
  ClipboardList,
  CalendarDays,
  List,
  BarChart3,
  ShoppingBag,
  Users,
  Building2,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export interface NavChildItem {
  title: string;
  href: string;
  icon?: LucideIcon;
}

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  children?: NavChildItem[];
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["Manager", "Admin"] },
  { title: "Inventory", href: "/raw-materials", icon: Boxes, roles: ["Manager", "Admin"] },
  { title: "Products", href: "/products", icon: Package, roles: ["Manager", "Admin"] },
  { title: "Production log", href: "/production", icon: ClipboardList, roles: ["Manager", "Operator", "Admin"] },
  {
    title: "Work orders",
    href: "/production/schedule",
    icon: CalendarDays,
    roles: ["Manager", "Operator", "Admin"],
    children: [
      { title: "List view", href: "/production/schedule", icon: List },
      { title: "Gantt timeline", href: "/production/schedule/timeline", icon: CalendarDays },
    ],
  },
  { title: "Sales", href: "/sales", icon: ShoppingBag, roles: ["Manager", "Admin"] },
  { title: "Reports", href: "/reports", icon: BarChart3, roles: ["Manager", "Admin"] },
  { title: "Team", href: "/users", icon: Users, roles: ["Manager", "Admin"] },
  { title: "Units", href: "/units", icon: Building2, roles: ["Manager", "Admin"] },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/production") {
    return pathname === "/production" || pathname === "/production/";
  }
  if (href === "/production/schedule") {
    return (
      pathname === "/production/schedule" ||
      pathname === "/production/schedule/" ||
      pathname.startsWith("/production/schedule/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavChildActive(pathname: string, href: string): boolean {
  if (href === "/production/schedule") {
    return pathname === "/production/schedule" || pathname === "/production/schedule/";
  }
  return pathname === href;
}

export function isNavGroupActive(pathname: string, item: NavItem): boolean {
  if (item.children?.length) {
    return item.children.some((child) => isNavChildActive(pathname, child.href));
  }
  return isNavItemActive(pathname, item.href);
}

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}

export const appInfo = {
  name: "CementPro",
  subtitle: "Manufacturing Execution",
  icon: Factory,
};
