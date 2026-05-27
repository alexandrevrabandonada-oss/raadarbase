"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      const registerServiceWorker = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registered successfully with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("Service Worker registration failed:", err);
          });
      };

      if ("requestIdleCallback" in window) {
        const idleId = window.requestIdleCallback(registerServiceWorker, { timeout: 5000 });
        return () => window.cancelIdleCallback(idleId);
      }

      const timeoutId = setTimeout(registerServiceWorker, 2500);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  return null;
}
