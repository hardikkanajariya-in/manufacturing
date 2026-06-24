"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useManufacturing } from "@/context/manufacturing-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";

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

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-sm hover:bg-muted cursor-pointer">
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary text-xs text-primary-foreground font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.role}</p>
            </div>
            <ChevronDown className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/profile">
              <DropdownMenuItem className="cursor-pointer">
                <User className="size-4" />
                Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
