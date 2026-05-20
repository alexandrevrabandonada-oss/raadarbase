"use client";

import { BookOpenText, Flame, Snowflake, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TerritorySummary } from "@/lib/types";
import { mapTerritoryToPhase } from "@/lib/data/territory-mapper";
import { TerritoryStageBadge } from "@/components/radar/territories/territory-stage-badge";

function getTemperatureState(score: number) {
  if (score >= 75) {
    return {
      bg: "bg-gradient-to-br from-[#fff8f2] to-[#ffeedb] border-orange-500/50 hover:border-orange-500",
      shadow: "shadow-[0_0_20px_rgba(249,115,22,0.1)] hover:shadow-[0_0_25px_rgba(249,115,22,0.22)]",
      badge: "bg-orange-600 text-white font-black animate-pulse border border-orange-700 hover:bg-orange-600",
      icon: <Flame className="h-5 w-5 text-orange-600 animate-bounce" />,
      label: "FOGO (Muito Ativo)",
      labelColor: "text-orange-700",
      accentBg: "bg-orange-100/40 border-orange-200",
      indicatorColor: "bg-orange-500"
    };
  }
  if (score >= 50) {
    return {
      bg: "bg-gradient-to-br from-[#fffdf5] to-[#fef6e0] border-amber-400/50 hover:border-amber-500",
      shadow: "shadow-[0_0_15px_rgba(217,119,6,0.08)] hover:shadow-[0_0_20px_rgba(217,119,6,0.18)]",
      badge: "bg-amber-500 text-white font-black border border-amber-600 hover:bg-amber-500",
      icon: <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />,
      label: "BRASA (Moderado)",
      labelColor: "text-amber-700",
      accentBg: "bg-amber-100/30 border-amber-200",
      indicatorColor: "bg-amber-500"
    };
  }
  return {
    bg: "bg-gradient-to-br from-[#f3f9fe] to-[#e6f4ff] border-sky-300/50 hover:border-sky-400",
    shadow: "shadow-[0_0_15px_rgba(14,165,233,0.06)] hover:shadow-[0_0_20px_rgba(14,165,233,0.15)]",
    badge: "bg-sky-500 text-white font-black border border-sky-600 hover:bg-sky-500",
    icon: <Snowflake className="h-5 w-5 text-sky-500 animate-spin" style={{ animationDuration: "12s" }} />,
    label: "GELO (Estável)",
    labelColor: "text-sky-700",
    accentBg: "bg-sky-100/30 border-sky-200",
    indicatorColor: "bg-sky-400"
  };
}

export function TerritoryNodeCard({
  territory,
  onSelect,
  className,
}: {
  territory: TerritorySummary;
  onSelect: (neighborhood: string) => void;
  className?: string;
}) {
  const phase = mapTerritoryToPhase(territory);
  const tempState = getTemperatureState(territory.priorityScore);

  return (
    <button
      onClick={() => onSelect(territory.neighborhood)}
      className={cn(
        "group rounded-[30px] border p-5 text-left transition-all duration-300 hover:-translate-y-0.5",
        tempState.bg,
        tempState.shadow,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", tempState.indicatorColor)} />
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7759]">Nó territorial</p>
          </div>
          <h3 className="mt-2 text-xl font-black tracking-tight text-zinc-950">{territory.neighborhood}</h3>
        </div>
        <div className="flex items-center gap-2">
          {tempState.icon}
          <Badge className={tempState.badge}>
            {territory.priorityScore}
          </Badge>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <TerritoryStageBadge phase={phase} compact />
        <Badge variant="outline" className="border-[#d8c7ac] bg-white/85 text-zinc-600 font-bold text-[10px]">
          {territory.fieldActions} campo
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className={cn("rounded-2xl border p-3 transition-colors", tempState.accentBg)}>
          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#8b7759]">Status Térmico</p>
          <p className={cn("mt-1.5 text-xs font-black uppercase tracking-wider", tempState.labelColor)}>
            {tempState.label}
          </p>
        </div>
        <div className="rounded-2xl border border-[#d8c7ac] bg-white/80 p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#8b7759]">Ação recomendada</p>
          <p className="mt-1.5 text-xs font-black text-[#11202a] truncate">{phase.nextStep}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-[#8b7759]">
          <BookOpenText className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.24em]">Temas principais</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {territory.topThemes.slice(0, 4).map((theme) => (
            <Badge key={theme.theme} variant="outline" className="border-[#d8c7ac]/60 bg-white/90 text-zinc-700 text-[10px] font-semibold">
              {theme.theme}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#d8c7ac]/40 pt-4 text-center">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#8b7759]">Sinais</p>
          <p className="mt-1.5 text-sm font-black text-zinc-950">{territory.peopleMonitored}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#8b7759]">Prioridades</p>
          <p className="mt-1.5 text-sm font-black text-zinc-950">{territory.priorityPeople}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#8b7759]">Voluntários</p>
          <p className="mt-1.5 text-sm font-black text-zinc-950">{territory.volunteers}</p>
        </div>
      </div>
    </button>
  );
}
