"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaInstallCta({ className }: { className?: string }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("radar_pwa_install_dismissed") === "true";
  });
  const [showIosHint] = useState(() => {
    if (typeof window === "undefined") return false;
    return isIos();
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (dismissed || isStandalone()) return null;

  const dismiss = () => {
    setDismissed(true);
    window.localStorage.setItem("radar_pwa_install_dismissed", "true");
  };

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice.catch(() => null);
    if (choice?.outcome === "accepted") {
      setInstallEvent(null);
      setDismissed(true);
      window.localStorage.setItem("radar_pwa_install_dismissed", "true");
    }
  };

  return (
    <div className={cn("flex items-center gap-2 rounded-[2px] border-2 border-charcoal bg-burnt-yellow px-2 py-1.5 text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]", className)}>
      {installEvent ? <Download className="h-4 w-4 shrink-0" /> : <Smartphone className="h-4 w-4 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.18em]">
          {installEvent ? "Instalar app" : "Adicionar à tela inicial"}
        </p>
        <p className="text-[10px] font-bold leading-4">
          {installEvent ? "Abra mais rápido e use como app." : "No iPhone, use Compartilhar > Adicionar à Tela de Início."}
        </p>
      </div>
      {installEvent ? (
        <Button
          type="button"
          onClick={handleInstall}
          className="h-8 rounded-[2px] border-2 border-charcoal bg-charcoal px-2 text-[10px] font-black uppercase tracking-[0.16em] text-off-white hover:bg-charcoal/90"
        >
          Instalar
        </Button>
      ) : showIosHint ? null : null}
      <button
        type="button"
        onClick={dismiss}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] border border-charcoal/20 hover:bg-charcoal/10"
        aria-label="Fechar aviso de instalação"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
