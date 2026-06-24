import {
  Factory,
  LayoutDashboard,
  Package,
  Boxes,
  ClipboardList,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Raw Materials", href: "/raw-materials", icon: Boxes },
  { title: "Products", href: "/products", icon: Package },
  { title: "Production", href: "/production", icon: ClipboardList },
  { title: "Reports", href: "/reports", icon: BarChart3 },
];

export const appInfo = {
  name: "CementPro MES",
  subtitle: "Manufacturing Execution System",
  icon: Factory,
};
