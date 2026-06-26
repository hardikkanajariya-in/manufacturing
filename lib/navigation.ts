import {
  Factory,
  LayoutDashboard,
  Package,
  Boxes,
  ClipboardList,
  BarChart3,
  ShoppingBag,
  Users,
  Building2,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["Manager", "Admin"] },
  { title: "Inventory", href: "/raw-materials", icon: Boxes, roles: ["Manager", "Admin"] },
  { title: "Products", href: "/products", icon: Package, roles: ["Manager", "Admin"] },
  { title: "Production", href: "/production", icon: ClipboardList, roles: ["Manager", "Operator", "Admin"] },
  { title: "Sales", href: "/sales", icon: ShoppingBag, roles: ["Manager", "Admin"] },
  { title: "Reports", href: "/reports", icon: BarChart3, roles: ["Manager", "Admin"] },
  { title: "Team", href: "/users", icon: Users, roles: ["Manager", "Admin"] },
  { title: "Units", href: "/units", icon: Building2, roles: ["Manager", "Admin"] },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}

export const appInfo = {
  name: "CementPro",
  subtitle: "Manufacturing Execution",
  icon: Factory,
};
