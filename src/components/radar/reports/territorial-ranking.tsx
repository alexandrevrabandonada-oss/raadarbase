"use client";

import * as React from "react";
import { 
  TrendingUp, 
  Users, 
  MapPin, 
  AlertCircle, 
  Calendar,
  ChevronRight,
  Target,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { TerritorySummary } from "@/lib/types";
import { mapTerritoryToPhase } from "@/lib/data/territory-mapper";
import { TerritoryStageBadge } from "@/components/radar/territories/territory-stage-badge";

interface TerritorialRankingProps {
  summaries: TerritorySummary[];
  onSelectNeighborhood?: (name: string) => void;
}

export function TerritorialRanking({ summaries, onSelectNeighborhood }: TerritorialRankingProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-600" />
          Ranking de Prioridade Territorial
        </h3>
        <p className="text-sm font-medium text-zinc-500">
          Baseado em volume de sinais, presença de voluntários e tempo desde a última ação de campo.
        </p>
      </div>

      <div className="grid gap-4">
        {summaries.map((item, index) => (
          <Card 
            key={item.neighborhood} 
            className="group hover:border-indigo-200 transition-all cursor-pointer shadow-sm hover:shadow-md border-zinc-100 overflow-hidden"
            onClick={() => onSelectNeighborhood?.(item.neighborhood)}
          >
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Ranking Position & Score */}
                <div className="bg-zinc-50 md:w-24 flex flex-col items-center justify-center p-4 border-r border-zinc-100 group-hover:bg-indigo-50 transition-colors">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Posição</span>
                  <span className="text-3xl font-black text-zinc-900">#{index + 1}</span>
                  <div className="mt-2 text-center">
                    <span className="text-[9px] font-black text-indigo-600 uppercase">Score</span>
                    <p className="text-sm font-black text-indigo-700">{item.priorityScore}</p>
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-zinc-400" />
                        <h4 className="text-lg font-black text-zinc-900 uppercase tracking-tight">{item.neighborhood}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.topThemes.map((t) => (
                          <Badge key={t.theme} variant="outline" className="bg-zinc-50 text-[10px] font-bold border-zinc-200">
                            {t.theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <TerritoryStageBadge phase={mapTerritoryToPhase(item)} compact />
                        <Badge className={cn(
                          "font-black uppercase text-[10px] tracking-widest px-3",
                          item.priorityScore > 80 ? "bg-rose-600" : item.priorityScore > 50 ? "bg-orange-500" : "bg-zinc-400"
                        )}>
                          {item.priorityScore > 80 ? "Alta Prioridade" : item.priorityScore > 50 ? "Médio Risco" : "Estável"}
                        </Badge>
                      </div>
                      <span className="text-[10px] font-medium text-zinc-400">
                        {item.lastActionAt ? `Última ação: ${new Date(item.lastActionAt).toLocaleDateString('pt-BR')}` : "Sem ação registrada"}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sinais</span>
                      </div>
                      <p className="text-lg font-black text-zinc-900">{item.peopleMonitored}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Voluntários</span>
                      </div>
                      <p className="text-lg font-black text-zinc-900">{item.volunteers}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Pendências</span>
                      </div>
                      <p className="text-lg font-black text-zinc-900">{item.openTasks}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Ações Campo</span>
                      </div>
                      <p className="text-lg font-black text-zinc-900">{item.fieldActions}</p>
                    </div>
                  </div>

                  {/* Progress to mobilizing */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Prontidão para Ação Coletiva</span>
                      <span className="text-[10px] font-bold text-indigo-600">{Math.round(item.priorityScore)}%</span>
                    </div>
                    <Progress value={item.priorityScore} className="h-1.5 bg-zinc-100" indicatorClassName="bg-indigo-600" />
                  </div>
                </div>

                {/* CTA */}
                <div className="md:w-16 flex items-center justify-center p-2 border-l border-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <ChevronRight className="h-5 w-5 text-zinc-400" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
