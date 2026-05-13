"use client";

import * as React from "react";
import { Compass, Flag, LayoutGrid, Loader2, LucideIcon, Map, TowerControl } from "lucide-react";
import { cn } from "@/lib/utils";

interface RadarLoadingProps {
  message?: string;
  className?: string;
  variant?: "base" | "journey" | "territory" | "field" | "rhythm";
}

const loadingTone: Record<NonNullable<RadarLoadingProps["variant"]>, {
  Icon: LucideIcon;
  shell: string;
  spinner: string;
  chip: string;
  helper: string;
}> = {
  base: {
    Icon: LayoutGrid,
    shell: "border-zinc-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,0.98))]",
    spinner: "border-t-zinc-950",
    chip: "border-zinc-200 bg-white text-zinc-700",
    helper: "Sincronizando sinais, missão do dia e próximos passos da base",
  },
  journey: {
    Icon: Compass,
    shell: "border-indigo-200 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,0.98))]",
    spinner: "border-t-indigo-600",
    chip: "border-indigo-100 bg-white text-indigo-700",
    helper: "Montando a trilha do operador e o próximo bloco de missão",
  },
  territory: {
    Icon: Map,
    shell: "border-amber-200 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(255,251,235,0.98))]",
    spinner: "border-t-amber-500",
    chip: "border-amber-100 bg-white text-amber-700",
    helper: "Lendo bairros, fases e sinais agregados sem expor pessoas",
  },
  field: {
    Icon: Flag,
    shell: "border-emerald-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(240,253,250,0.98))]",
    spinner: "border-t-emerald-600",
    chip: "border-emerald-100 bg-white text-emerald-700",
    helper: "Organizando convites, confirmações, presença e follow-up",
  },
  rhythm: {
    Icon: TowerControl,
    shell: "border-sky-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(240,249,255,0.98))]",
    spinner: "border-t-sky-600",
    chip: "border-sky-100 bg-white text-sky-700",
    helper: "Conferindo travas, carga da base e fechamento do ciclo",
  },
};

export function RadarLoading({
  message = "Carregando inteligência...",
  className,
  variant = "base",
}: RadarLoadingProps) {
  const tone = loadingTone[variant];
  const Icon = tone.Icon;

  return (
    <div className={cn("flex min-h-[420px] w-full items-center justify-center", className)}>
      <div className={cn("w-full max-w-3xl overflow-hidden rounded-[28px] border p-6 shadow-sm sm:p-8", tone.shell)}>
        <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
          <div className="relative mx-auto lg:mx-0">
            <div className={cn("h-20 w-20 animate-spin rounded-full border-4 border-zinc-200/70", tone.spinner)} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/90 shadow-sm">
                <Icon className="h-5 w-5 text-zinc-700" />
              </div>
            </div>
          </div>

          <div className="space-y-3 text-center lg:text-left">
            <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]", tone.chip)}>
              <Loader2 className="h-3.5 w-3.5 animate-pulse" />
              Sincronizando
            </div>
            <div className="space-y-2">
              <p className="text-lg font-black tracking-tight text-zinc-950 sm:text-2xl">{message}</p>
              <p className="max-w-2xl text-sm leading-6 text-zinc-600">{tone.helper}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RadarSkeletonList() {
  return (
    <div className="space-y-4 w-full">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 w-full bg-zinc-50 rounded-xl border border-zinc-100 animate-pulse flex items-center px-4 gap-4">
           <div className="h-10 w-10 rounded-full bg-zinc-100" />
           <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-zinc-100 rounded" />
              <div className="h-2 w-48 bg-zinc-100 rounded" />
           </div>
           <div className="h-8 w-24 bg-zinc-100 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
