"use client";

import * as React from "react";
import { 
  MapPin, 
  History, 
  Lightbulb, 
  Calendar,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { TerritoryDetail } from "@/lib/types";
import { mapTerritoryToPhase } from "@/lib/data/territory-mapper";
import { TerritoryStageBadge } from "@/components/radar/territories/territory-stage-badge";
import Link from "next/link";

interface TerritorialCardProps {
  detail: TerritoryDetail;
}

export function TerritorialCard({ detail }: TerritorialCardProps) {
  return (
    <Card className="border-zinc-200 shadow-xl overflow-hidden bg-white">
      <CardHeader className="bg-zinc-950 text-white p-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-400" />
              <CardTitle className="text-3xl font-black uppercase tracking-tight">{detail.neighborhood}</CardTitle>
            </div>
            <div className="pt-2">
              <TerritoryStageBadge phase={mapTerritoryToPhase(detail)} showDetails />
            </div>
            <CardDescription className="text-zinc-400 font-bold">
              Diagnóstico territorial e planejamento de mobilização local.
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Score Geral</span>
              <p className="text-2xl font-black text-indigo-400">{detail.priorityScore}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-10">
        {/* Suggested Action Banner */}
        <div className="bg-indigo-600 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-indigo-100">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Sugestão de Ação Imediata</span>
              <h4 className="text-xl font-black tracking-tight">{detail.suggestedAction}</h4>
              <p className="text-sm font-medium text-indigo-100 mt-1">
                Baseado na falta de ações recentes e alto volume de pendências no bairro.
              </p>
            </div>
          </div>
          <Button 
            render={<Link href={`/agenda/novo?neighborhood=${detail.neighborhood}`} />}
            className="bg-white text-indigo-600 hover:bg-white/90 font-black uppercase text-xs tracking-wider px-6 h-12"
          >
            Planejar Agora <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Historical Themes */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-zinc-400" />
              <h5 className="font-black uppercase text-sm tracking-widest text-zinc-900">Pautas Históricas</h5>
            </div>
            <div className="space-y-3">
              {detail.historicalThemes.map((theme) => (
                <div key={theme.theme} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                    <span className="text-sm font-bold text-zinc-700 capitalize">{theme.theme}</span>
                  </div>
                  <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 font-black px-2 py-0.5 text-[10px]">
                    {theme.count} sinais
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Events */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-zinc-400" />
              <h5 className="font-black uppercase text-sm tracking-widest text-zinc-900">Cronograma Recente</h5>
            </div>
            <div className="space-y-4">
              {detail.recentEvents.length > 0 ? (
                detail.recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <div className="bg-zinc-100 p-2 rounded-lg">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div>
                      <h6 className="text-xs font-black text-zinc-900 uppercase">{event.title}</h6>
                      <p className="text-[10px] font-medium text-zinc-400 mt-0.5">
                        {event.startsAt ? new Date(event.startsAt).toLocaleDateString('pt-BR') : "Sem data"}
                      </p>
                      <Badge className={cn(
                        "mt-2 text-[8px] font-black uppercase px-1.5 py-0.1",
                        event.status === "done" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                      )}>
                        {event.status === "done" ? "Realizada" : "Agendada"}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-zinc-100 rounded-2xl">
                  <p className="text-xs font-bold text-zinc-400 italic">Nenhuma ação de campo registrada nos últimos 90 dias.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ethical Guardrail Disclaimer */}
        <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 flex items-start gap-4">
          <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-1" />
          <div className="space-y-1">
            <h6 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Leitura Ética Territorial</h6>
            <p className="text-xs font-medium text-zinc-500 leading-relaxed">
              Este painel utiliza apenas dados declarados ou públicos. As métricas são agregadas para proteger a privacidade individual. 
              O uso destas informações deve ser estritamente voltado para o planejamento de ações coletivas e atendimento de demandas comunitárias.
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-zinc-50 p-6 flex items-center justify-between border-t border-zinc-200">
        <div className="flex items-center gap-2 text-zinc-400">
          <Info className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Atualizado em tempo real com a base do Radar</span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="font-black uppercase text-[10px] tracking-widest border-zinc-200">
            Criar Relatório Territorial
          </Button>
          <Button variant="outline" size="sm" className="font-black uppercase text-[10px] tracking-widest border-zinc-200">
            Exportar Ficha Bairro
          </Button>
          <Button variant="outline" size="sm" className="font-black uppercase text-[10px] tracking-widest border-zinc-200">
            Ver Relatos do Bairro
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
