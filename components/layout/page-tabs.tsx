"use client";

import { cn } from "@/lib/utils";

interface PageTab {
  id: string;
  label: string;
}

interface PageTabsProps {
  tabs: PageTab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function PageTabs({ tabs, activeTab, onChange, className }: PageTabsProps) {
  return (
    <div className={cn("border-b border-border overflow-x-auto", className)}>
      <div className="flex gap-1 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium brand-transition sm:px-4 sm:text-sm",
              activeTab === tab.id
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
