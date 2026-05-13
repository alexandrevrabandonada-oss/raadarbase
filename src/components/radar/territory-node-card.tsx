"use client";

import { BookOpenText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TerritorySummary } from "@/lib/types";
import { mapTerritoryToPhase } from "@/lib/data/territory-mapper";
import { TerritoryStageBadge } from "@/components/radar/territories/territory-stage-badge";

function territoryNodeTone(score: number) {
  if (score >= 85) return "border-rose-200 bg-rose-50";
  if (score >= 60) return "border-amber-200 bg-amber-50";
  if (score >= 35) return "border-sky-200 bg-sky-50";
  return "border-zinc-200 bg-zinc-50";
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

  return (
    <button
      onClick={() => onSelect(territory.neighborhood)}
      className={cn("group rounded-[30px] border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl", territoryNodeTone(territory.priorityScore), className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Nó territorial</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-zinc-950">{territory.neighborhood}</h3>
        </div>
        <Badge className="border border-zinc-200 bg-white text-zinc-900 hover:bg-white">
          {territory.priorityScore}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <TerritoryStageBadge phase={phase} compact />
        <Badge variant="outline" className="border-zinc-200 bg-white text-zinc-600">
          {territory.fieldActions} campo
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/50 bg-white/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Calor</p>
          <p className="mt-2 text-lg font-black text-zinc-950">{territory.priorityScore}%</p>
        </div>
        <div className="rounded-2xl border border-white/50 bg-white/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Ação recomendada</p>
          <p className="mt-2 text-sm font-black text-indigo-700">{phase.nextStep}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-zinc-500">
          <BookOpenText className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.24em]">Temas principais</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {territory.topThemes.map((theme) => (
            <Badge key={theme.theme} variant="outline" className="border-zinc-200 bg-white text-zinc-700">
              {theme.theme}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-200/70 pt-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Sinais</p>
          <p className="mt-2 text-sm font-black text-zinc-950">{territory.peopleMonitored}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Prioridades</p>
          <p className="mt-2 text-sm font-black text-zinc-950">{territory.priorityPeople}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Voluntários</p>
          <p className="mt-2 text-sm font-black text-zinc-950">{territory.volunteers}</p>
        </div>
      </div>
    </button>
  );
}
