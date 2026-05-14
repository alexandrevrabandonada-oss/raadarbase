"use client";

import { useSyncExternalStore } from "react";

interface UseCompactModeOptions {
  storageKey: string;
  autoCompact: boolean;
}

function readCompactPreference(storageKey: string) {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

export function useCompactMode({ storageKey, autoCompact }: UseCompactModeOptions) {
  const manualCompact = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => undefined;

      const handleStorage = (event: StorageEvent) => {
        if (!event.key || event.key === storageKey) {
          onStoreChange();
        }
      };

      const handleCustom = (event: Event) => {
        const detail = (event as CustomEvent<{ key?: string }>).detail;
        if (!detail?.key || detail.key === storageKey) {
          onStoreChange();
        }
      };

      window.addEventListener("storage", handleStorage);
      window.addEventListener("radar:compact-mode", handleCustom as EventListener);
      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("radar:compact-mode", handleCustom as EventListener);
      };
    },
    () => readCompactPreference(storageKey),
    () => false,
  );

  const setCompact = (enabled: boolean) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, String(enabled));
      window.dispatchEvent(new CustomEvent("radar:compact-mode", { detail: { key: storageKey } }));
    } catch {}
  };

  return {
    hydrated: true,
    manualCompact,
    isCompact: autoCompact || manualCompact,
    setCompact,
  };
}
