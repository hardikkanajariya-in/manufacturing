"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { UnitSwitcher } from "@/components/layout/unit-switcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, User } from "lucide-react";

interface AppHeaderProps {
  title: string;
  description?: string;
}

export function AppHeader({ title, description }: AppHeaderProps) {
  const { user, logout } = useManufacturing();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const canManage = user.role === "Manager" || user.role === "Admin";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-heading text-base font-semibold tracking-tight sm:text-lg">
          {title}
        </h1>
        {description ? (
          <p className="truncate text-xs text-muted-foreground sm:text-sm">{description}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {canManage && <UnitSwitcher compact />}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex max-w-[160px] items-center gap-2 rounded-[var(--radius-button)] border border-border bg-card px-2 py-1.5 text-sm hover:bg-muted brand-transition cursor-pointer sm:max-w-none">
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary text-xs text-primary-foreground font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden min-w-0 text-left sm:block">
              <p className="truncate text-sm font-medium leading-none">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground mt-0.5">{user.role}</p>
            </div>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground stroke-[2]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/profile">
              <DropdownMenuItem className="cursor-pointer">
                <User className="size-4 stroke-[2]" />
                Profile
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="size-4 stroke-[2]" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
