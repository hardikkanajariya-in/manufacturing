"use client";

import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaInstallButtonProps {
  className?: string;
  variant?: "sidebar" | "default";
}

export function PwaInstallButton({ className, variant = "default" }: PwaInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) {
      if (isIos) {
        window.alert(
          "To install CementPro on iOS: tap Share in Safari, then \"Add to Home Screen\"."
        );
      }
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }, [deferredPrompt, isIos]);

  if (isInstalled) {
    return null;
  }

  const canPrompt = Boolean(deferredPrompt) || isIos;

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={handleInstall}
        disabled={!canPrompt}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[var(--radius-button)] px-3 py-2 text-sm font-medium brand-transition",
          canPrompt
            ? "text-sidebar-foreground/85 hover:bg-white/[0.08] hover:text-sidebar-foreground cursor-pointer"
            : "text-sidebar-icon/60 cursor-not-allowed",
          className
        )}
        title={
          canPrompt
            ? "Install CementPro as an app"
            : "Install available in Chrome/Edge when criteria are met"
        }
      >
        <Download className="size-4 shrink-0 stroke-[2] text-sidebar-icon" />
        Install app
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleInstall}
      disabled={!canPrompt}
      className={className}
    >
      <Download className="size-4" />
      Install app
    </Button>
  );
}
