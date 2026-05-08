"use client";

import Link from "next/link";
import { 
  Flame, 
  ArrowRight, 
  ExternalLink, 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  LayoutDashboard,
  Target,
  FileText,
  UserPlus,
  PlusCircle,
  TrendingUp,
  Inbox
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PriorityPerson } from "@/lib/types";
import type { PilotDashboardData } from "@/lib/data/pilot-stats";

type DashboardClientProps = {
  priorityPeople: PriorityPerson[];
  pilotStats: PilotDashboardData;
  operationalAlerts: {
    webhookQuarantineCount: number;
    missingTemplates: string[];
  };
};

export function DashboardClient({ 
  priorityPeople, 
  pilotStats,
  operationalAlerts 
}: DashboardClientProps) {
  const topPeople = priorityPeople.slice(0, 5);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Hero: Top Pessoas Quentes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-600 fill-orange-600" />
            <h2 className="text-xl font-black tracking-tight">Top Pessoas Quentes</h2>
          </div>
          <Button  variant="ghost" size="sm" className="font-bold text-indigo-700">
            <Link href="/pessoas">
              Ver todas <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {topPeople.map((person, index) => (
            <Card 
              key={person.id} 
              className={cn(
                "relative transition-all hover:shadow-lg border-2",
                person.temperature === "quente" ? "border-orange-100 bg-orange-50/20" : "border-zinc-100"
              )}
            >
              <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black z-10">
                #{index + 1}
              </div>
              
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-black truncate">@{person.username}</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase truncate">
                      {person.mainTheme || "Geral"}
                    </CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-black text-orange-600">{person.scoreLabel}</span>
                          <div className="h-1 w-10 bg-zinc-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-orange-500" 
                              style={{ width: `${person.scoreIntensity}%` }}
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Score: {person.priorityScore}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-3">
                <p className="text-[10px] leading-tight text-muted-foreground line-clamp-2 h-7">
                  {person.priorityReason}
                </p>
                
                <div className="pt-2 border-t border-zinc-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase text-zinc-400">Próxima Ação</span>
                  </div>
                  <p className="text-[11px] font-black text-indigo-700 truncate">
                    {person.nextAction.split(":")[0]}
                  </p>
                  
                  <div className="flex gap-1.5 pt-1">
                    <Button  size="sm" className="h-7 px-2 text-[10px] font-black flex-1">
                      <Link href={`/pessoas/${person.id}`}>Ficha</Link>
                    </Button>
                    {person.instagramUrl && (
                      <Button  variant="outline" size="icon" className="h-7 w-7">
                        <a href={person.instagramUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 units) */}
        <div className="lg:col-span-8 space-y-8">
          {/* 2. Situação do Dia Cards */}
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="bg-orange-50 border-orange-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Flame className="h-4 w-4 text-orange-600" />
                  <Badge variant="outline" className="text-orange-700 border-orange-200 bg-white">HOJE</Badge>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-black text-orange-950">{pilotStats.summary.prioritizedToday}</p>
                  <p className="text-xs font-bold text-orange-700 uppercase">Prioritárias</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-indigo-50 border-indigo-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Inbox className="h-4 w-4 text-indigo-600" />
                  <Badge variant="outline" className="text-indigo-700 border-indigo-200 bg-white">FILA</Badge>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-black text-indigo-950">{pilotStats.summary.openTasks}</p>
                  <p className="text-xs font-bold text-indigo-700 uppercase">Tarefas Abertas</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-50 border-zinc-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Users className="h-4 w-4 text-zinc-600" />
                  <Badge variant="outline" className="text-zinc-700 border-zinc-300 bg-white">EQUIPE</Badge>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-black text-zinc-950">{pilotStats.summary.tasksWithoutResponsible}</p>
                  <p className="text-xs font-bold text-zinc-700 uppercase">Sem Responsável</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <MessageSquare className="h-4 w-4 text-amber-600" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-black text-amber-950">{pilotStats.summary.pendingReferralsCount}</p>
                  <p className="text-xs font-bold text-amber-700 uppercase">A Encaminhar</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50 border-emerald-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-black text-emerald-950">{pilotStats.summary.responsesRecorded}</p>
                  <p className="text-xs font-bold text-emerald-700 uppercase">Respostas</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-rose-50 border-rose-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-black text-rose-950">{pilotStats.summary.doNotContactCount}</p>
                  <p className="text-xs font-bold text-rose-700 uppercase">Não Abordar</p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 3. Funil do Dia */}
          <section className="space-y-4">
            <h2 className="text-lg font-black flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              Funil Operacional
            </h2>
            <Card>
              <CardContent className="p-6">
                <div className="relative flex items-center justify-between">
                  {/* Connectors */}
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-100 -z-10" />
                  
                  {[
                    { label: "Priorizadas", value: pilotStats.funnel.prioritized, color: "bg-zinc-100 text-zinc-900" },
                    { label: "Abordadas", value: pilotStats.funnel.approached, color: "bg-indigo-100 text-indigo-700" },
                    { label: "Responderam", value: pilotStats.funnel.responded, color: "bg-amber-100 text-amber-700" },
                    { label: "Encaminhadas", value: pilotStats.funnel.referred, color: "bg-emerald-100 text-emerald-700" },
                    { label: "Ação Real", value: pilotStats.funnel.firstAction, color: "bg-black text-white" }
                  ].map((step, i) => (
                    <div key={step.label} className="flex flex-col items-center gap-2">
                      <div className={cn("h-12 w-12 rounded-full flex items-center justify-center font-black text-sm shadow-sm border-2 border-white", step.color)}>
                        {step.value}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground">{step.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 4. Alertas Operacionais */}
          <section className="space-y-4">
            <h2 className="text-lg font-black flex items-center gap-2 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
              Atenção Requerida
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pilotStats.summary.tasksWithoutResponsible > 0 && (
                <div className="flex items-center gap-4 p-4 bg-white border border-rose-100 rounded-xl shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-rose-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-rose-950">{pilotStats.summary.tasksWithoutResponsible} tarefas sem dono</p>
                    <p className="text-xs text-rose-700/70">A equipe está perdendo oportunidades de contato.</p>
                  </div>
                </div>
              )}
              
              {pilotStats.summary.pendingReferralsCount > 0 && (
                <div className="flex items-center gap-4 p-4 bg-white border border-amber-100 rounded-xl shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <ArrowRight className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-amber-950">{pilotStats.summary.pendingReferralsCount} respostas travadas</p>
                    <p className="text-xs text-amber-700/70">Pessoas responderam mas não foram encaminhadas.</p>
                  </div>
                </div>
              )}

              {pilotStats.summary.staleTasksCount > 0 && (
                <div className="flex items-center gap-4 p-4 bg-white border border-rose-100 rounded-xl shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-rose-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-rose-950">{pilotStats.summary.staleTasksCount} tarefas atrasadas</p>
                    <p className="text-xs text-rose-700/70">Paradas há mais de 48 horas.</p>
                  </div>
                </div>
              )}

              {operationalAlerts.webhookQuarantineCount > 0 && (
                <div className="flex items-center gap-4 p-4 bg-white border border-indigo-100 rounded-xl shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Inbox className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-indigo-950">{operationalAlerts.webhookQuarantineCount} webhooks em quarentena</p>
                    <p className="text-xs text-indigo-700/70">Dados do Meta aguardando revisão técnica.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column (4 units) */}
        <aside className="lg:col-span-4 space-y-8">
          {/* 5. Ações Rápidas */}
          <section className="space-y-4">
            <h2 className="text-lg font-black">Ações Rápidas</h2>
            <div className="grid grid-cols-1 gap-2">
              <Button  className="w-full justify-start font-black bg-indigo-600 hover:bg-indigo-700 h-12 shadow-sm">
                <Link href="/pessoas">
                  <Flame className="mr-3 h-5 w-5" />
                  Pessoas Prioritárias
                </Link>
              </Button>
              <Button  variant="outline" className="w-full justify-start font-black h-12 border-zinc-200">
                <Link href="/abordagem">
                  <LayoutDashboard className="mr-3 h-5 w-5 text-zinc-500" />
                  Quadro de Vínculos
                </Link>
              </Button>
              <Button  variant="outline" className="w-full justify-start font-black h-12 border-zinc-200">
                <Link href="/mensagens">
                  <MessageSquare className="mr-3 h-5 w-5 text-zinc-500" />
                  Biblioteca de DMs
                </Link>
              </Button>
              <Button  variant="outline" className="w-full justify-start font-black h-12 border-zinc-200 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50">
                <Link href="/relatorios">
                  <TrendingUp className="mr-3 h-5 w-5" />
                  Painel do Piloto
                </Link>
              </Button>
              <Button  variant="ghost" className="w-full justify-start font-black h-12 text-muted-foreground">
                <Link href="/pessoas/importar">
                  <PlusCircle className="mr-3 h-5 w-5" />
                  Importar Pessoas
                </Link>
              </Button>
            </div>
          </section>

          {/* 6. Atividade Recente (Ex-métrica genérica) */}
          <Card className="bg-zinc-950 text-white border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase text-zinc-400">Escuta Digital</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Sincronizado</p>
                  <p className="text-2xl font-black">2.4k</p>
                  <p className="text-[10px] text-zinc-400 font-medium">comentários</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Pessoas</p>
                  <p className="text-2xl font-black">152</p>
                  <p className="text-[10px] text-zinc-400 font-medium">novos perfis 7d</p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase mb-3">Tendência da Semana</p>
                <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                    <span className="text-sm font-black italic">Transporte Público</span>
                  </div>
                  <Badge className="bg-orange-500/10 text-orange-500 border-none">+12%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
