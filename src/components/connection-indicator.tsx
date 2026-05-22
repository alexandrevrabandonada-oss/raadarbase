"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getOfflineTasks, syncOfflineTasks } from "@/lib/offline-queue";

type ConnectionIndicatorProps = {
  variant?: "desktop" | "mobile";
};

export function ConnectionIndicator({ variant = "desktop" }: ConnectionIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setHydrated(true);
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => {
        setIsOnline(true);
        
        // Sync tasks in background when back online
        const tasks = getOfflineTasks();
        if (tasks.length > 0) {
          toast({
            title: "Sinal recuperado! ⚡",
            description: `Sincronizando ${tasks.length} ação(ões) salva(s) localmente...`,
          });
          
          syncOfflineTasks(
            undefined,
            (success, error) => {
              if (success > 0) {
                toast({
                  title: "Sincronização concluída! ✅",
                  description: `${success} ação(ões) enviada(s) para o servidor.`,
                });
              }
              if (error > 0) {
                toast({
                  title: "Alguns registros falharam ⚠️",
                  description: `${error} ação(ões) não pôde(ram) ser processada(s).`,
                  variant: "destructive",
                });
              }
            }
          );
        }
      };

      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Check on initial load if we have pending tasks to sync
      const pendingTasks = getOfflineTasks();
      if (navigator.onLine && pendingTasks.length > 0) {
        syncOfflineTasks(
          undefined,
          (success) => {
            if (success > 0) {
              toast({
                title: "Sincronização pendente resolvida ✅",
                description: `${success} ação(ões) acumulada(s) enviada(s) com sucesso.`,
              });
            }
          }
        );
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [toast]);

  // Prevent hydration mismatch by rendering a neutral state first
  if (!hydrated) {
    if (variant === "mobile") {
      return (
        <div className="flex items-center gap-1.5 rounded-[2px] border-2 border-cement bg-zinc-100 px-2 py-1 text-[9px] font-black uppercase text-zinc-500">
          <span className="size-1.5 rounded-full bg-zinc-400" />
          Carregando...
        </div>
      );
    }
    return (
      <div className="rounded-[2px] border-2 border-cement bg-charcoal/30 p-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
        Verificando conexão...
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-[2px] border-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-all duration-300",
          isOnline
            ? "border-emerald-600/35 bg-emerald-500/10 text-emerald-700 sun-mode:border-black sun-mode:bg-[#FFF7CD] sun-mode:text-black"
            : "border-rose-500 bg-rose-500/10 text-rose-700 animate-pulse sun-mode:border-black sun-mode:bg-black sun-mode:text-yellow-400"
        )}
        title={isOnline ? "Conectado ao servidor" : "Modo offline ativo"}
      >
        {isOnline ? (
          <>
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse sun-mode:bg-black" />
            <Wifi className="h-3 w-3" />
            <span className="hidden sm:inline">Online</span>
          </>
        ) : (
          <>
            <span className="size-1.5 rounded-full bg-rose-600 animate-ping sun-mode:bg-yellow-400" />
            <WifiOff className="h-3 w-3" />
            <span>Offline</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[2px] border-2 p-2.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] transition-all duration-300",
        isOnline
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400 sun-mode:border-black sun-mode:bg-[#FFF7CD] sun-mode:text-black sun-mode:shadow-[2px_2px_0px_0px_#000]"
          : "border-rose-500 bg-rose-500/20 text-rose-300 animate-pulse sun-mode:border-black sun-mode:bg-black sun-mode:text-yellow-400 sun-mode:shadow-[2px_2px_0px_0px_#000]"
      )}
    >
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "size-2 rounded-full transition-colors duration-300",
            isOnline
              ? "bg-emerald-400 animate-pulse sun-mode:bg-black"
              : "bg-rose-500 animate-ping sun-mode:bg-yellow-400"
          )}
        />
        {isOnline ? "Conexão: Estável" : "Conexão: Offline"}
      </span>
      <span className="text-[8px] opacity-75">{isOnline ? "Nuvem" : "Local"}</span>
    </div>
  );
}
