"use client";

import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Zap,
  BookOpenText,
  Users,
  Lightbulb,
  Clock3,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TerritoryDetail } from "@/lib/types";
import { mapTerritoryToPhase } from "@/lib/data/territory-mapper";
import { TerritoryStageBadge } from "@/components/radar/territories/territory-stage-badge";

interface TerritorialCardProps {
  detail: TerritoryDetail;
}

function formatDate(date: string | null) {
  if (!date) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function TerritorialCard({ detail }: TerritorialCardProps) {
  const phase = mapTerritoryToPhase(detail);

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-zinc-900/10 bg-white shadow-2xl shadow-zinc-200/50">
        <CardHeader className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),linear-gradient(135deg,#09090b_0%,#18181b_60%,#27272a_100%)] p-8 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <MapPin className="h-5 w-5 text-indigo-200" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Mapa da Mobilização</p>
                  <CardTitle className="mt-1 text-3xl font-black tracking-tight text-white">
                    {detail.neighborhood}
                  </CardTitle>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <TerritoryStageBadge phase={phase} compact />
                <Badge className="border border-white/10 bg-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10">
                  Calor {detail.priorityScore}
                </Badge>
                <Badge className="border border-white/10 bg-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10">
                  {detail.fieldActions} missões de campo
                </Badge>
              </div>

              <CardDescription className="max-w-2xl text-sm font-medium leading-relaxed text-zinc-300">
                Território lido como nó cooperativo de campanha: fase atual, sinais predominantes, capacidade local e missão recomendada.
              </CardDescription>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Por que está nessa fase</p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-white">{detail.phaseWhy}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Ação recomendada</p>
                <p className="mt-2 text-sm font-black leading-relaxed text-indigo-200">{detail.suggestedAction}</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 p-8">
          <div className="rounded-[28px] border border-indigo-100 bg-indigo-50/70 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-indigo-600 p-3 text-white">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-500">Missão territorial recomendada</p>
                  <h4 className="text-2xl font-black tracking-tight text-indigo-950">{detail.suggestedAction}</h4>
                  <p className="text-sm font-medium text-indigo-800">Transforme a leitura agregada do bairro em ação concreta e registrável.</p>
                </div>
              </div>
              <Button
                className="h-12 bg-indigo-600 px-6 text-xs font-black uppercase tracking-wider hover:bg-indigo-700"
                render={<Link href={`/campo/novo?neighborhood=${detail.neighborhood}`} />}
              >
                Abrir missão de campo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[28px] border-zinc-200 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  Próximas ações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {detail.nextActions.map((action) => (
                  <div key={action} className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700">
                    {action}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-zinc-200 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-emerald-600" />
                  Pessoas agregadas
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {detail.aggregatedPeople.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-black text-zinc-950">{item.value}</p>
                    <p className="mt-2 text-xs font-medium leading-relaxed text-zinc-500">{item.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[28px] border-zinc-200 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpenText className="h-4 w-4 text-zinc-600" />
                  Temas principais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {detail.historicalThemes.map((theme) => (
                  <div key={theme.theme} className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-black capitalize text-zinc-900">{theme.theme}</p>
                      <p className="text-[11px] font-medium text-zinc-500">Tema que continua puxando mobilização no bairro.</p>
                    </div>
                    <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                      {theme.count} sinais
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-zinc-200 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  Eventos relacionados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {detail.recentEvents.length > 0 ? (
                  detail.recentEvents.map((event) => (
                    <div key={event.id} className="rounded-2xl border border-zinc-100 bg-white px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-zinc-900">{event.title}</p>
                          <p className="mt-1 text-[11px] font-medium text-zinc-500">{formatDate(event.startsAt)}</p>
                        </div>
                        <Badge
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            event.status === "done" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700",
                          )}
                        >
                          {event.status === "done" ? "Fechada" : "Em missão"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm font-medium text-zinc-500">
                    Nenhuma missão de campo recente ligada a este bairro.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[28px] border-zinc-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock3 className="h-4 w-4 text-zinc-600" />
                Memória recente
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {detail.recentMemory.length > 0 ? (
                detail.recentMemory.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-zinc-200 bg-white text-zinc-600">
                        {item.source}
                      </Badge>
                      {item.occurredAt ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          {formatDate(item.occurredAt)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm font-black text-zinc-900">{item.title}</p>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-600">{item.summary}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm font-medium text-zinc-500">
                  Ainda não há memória consolidada para este território.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/60 p-5">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-widest text-emerald-800">Leitura ética territorial</p>
                <p className="text-sm font-medium leading-relaxed text-emerald-900">
                  Este mapa opera com sinais agregados por bairro. O objetivo é orientar missão coletiva, não vigilância individual.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
