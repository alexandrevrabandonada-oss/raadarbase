"use client";

import * as React from "react";
import { 
  TrendingUp, 
  Users, 
  Target, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TerritorySummary } from "@/lib/types";

interface TerritorialHeatmapProps {
  summaries: TerritorySummary[];
  onSelectNeighborhood: (name: string) => void;
}

export function TerritorialHeatmap({ summaries, onSelectNeighborhood }: TerritorialHeatmapProps) {
  // Sort by priority for the sidebar ranking
  const sortedSummaries = [...summaries].sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Heatmap Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Intensidade por Bairro</h3>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
             <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-zinc-100 border border-zinc-200" /> Baixa
             </div>
             <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-indigo-600" /> Alta
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {summaries.map((item) => {
            const intensity = item.priorityScore;
            // Color intensity mapping
            const bgColor = intensity > 80 ? "bg-indigo-900" 
                          : intensity > 60 ? "bg-indigo-700"
                          : intensity > 40 ? "bg-indigo-500"
                          : intensity > 20 ? "bg-indigo-300"
                          : "bg-indigo-100";
            
            const textColor = intensity > 40 ? "text-white" : "text-indigo-900";
            const badgeColor = intensity > 40 ? "bg-white/20 text-white" : "bg-indigo-600 text-white";

            return (
              <Card 
                key={item.neighborhood}
                onClick={() => onSelectNeighborhood(item.neighborhood)}
                className={cn(
                  "border-none cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-xl group",
                  bgColor
                )}
              >
                <CardContent className="p-5 flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-start justify-between">
                    <h4 className={cn("font-black uppercase text-sm tracking-tight leading-tight max-w-[70%]", textColor)}>
                      {item.neighborhood}
                    </h4>
                    <Badge className={cn("font-black text-[10px] border-none", badgeColor)}>
                      {item.priorityScore}
                    </Badge>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className={cn("h-3 w-3", intensity > 40 ? "text-indigo-300" : "text-indigo-500")} />
                        <span className={cn("text-[9px] font-bold uppercase tracking-wider", intensity > 40 ? "text-indigo-200" : "text-indigo-600")}>Sinais</span>
                      </div>
                      <span className={cn("text-xs font-black", textColor)}>{item.peopleMonitored}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className={cn("h-3 w-3", intensity > 40 ? "text-indigo-300" : "text-indigo-500")} />
                        <span className={cn("text-[9px] font-bold uppercase tracking-wider", intensity > 40 ? "text-indigo-200" : "text-indigo-600")}>Voluntários</span>
                      </div>
                      <span className={cn("text-xs font-black", textColor)}>{item.volunteers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Sidebar Ranking */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-zinc-900" />
          <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Ranking de Foco</h3>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          {sortedSummaries.map((item, index) => (
            <div 
              key={item.neighborhood}
              onClick={() => onSelectNeighborhood(item.neighborhood)}
              className="flex items-center justify-between p-4 hover:bg-zinc-50 cursor-pointer border-b border-zinc-50 last:border-0 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-zinc-300 w-4">#{index + 1}</span>
                <div>
                  <p className="text-xs font-black text-zinc-900 uppercase group-hover:text-indigo-600 transition-colors">{item.neighborhood}</p>
                  <p className="text-[9px] font-bold text-zinc-400 mt-0.5">
                    {item.topThemes[0]?.theme || "Diversos"}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-200 group-hover:text-indigo-400 transition-colors" />
            </div>
          ))}
        </div>

        {/* Ethical Tip */}
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Ação Coletiva</span>
          </div>
          <p className="text-[11px] font-medium text-emerald-900 leading-relaxed italic">
            &quot;Territórios com mais sinais e poucos voluntários são ideais para Bancas de Escuta e mutirões de cadastro.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
