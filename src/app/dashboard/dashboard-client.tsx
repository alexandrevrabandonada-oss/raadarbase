"use client";

import Link from "next/link";
import { useMemo } from "react";
import { 
  Flame, 
  ArrowRight, 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  LayoutDashboard,
  Target,
  PlusCircle,
  TrendingUp,
  Inbox,
  Ghost
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PriorityPerson } from "@/lib/types";
import type { PilotDashboardData } from "@/lib/data/pilot-stats";

// Radar Design System
import { RadarPageHeader } from "@/components/radar/radar-page-header";
import { RadarMetricCard } from "@/components/radar/radar-metric-card";
import { PersonPriorityCard } from "@/components/radar/person-priority-card";
import { OperationalAlert } from "@/components/radar/operational-alert";

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
      <RadarPageHeader 
        title="Painel de Controle"
        description="Acompanhamento operacional em tempo real da base Vila Rica."
        actions={
          <Link 
            href="/pessoas/importar" 
            className={cn(buttonVariants({ size: "sm" }), "font-bold bg-indigo-600")}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Importar Dados
          </Link>
        }
      />

      {/* 1. Hero: Top Pessoas Quentes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-600 fill-orange-600" />
            <h2 className="text-lg font-black tracking-tight">Top Pessoas Quentes</h2>
          </div>
          <Button variant="ghost" size="sm" className="font-bold text-indigo-700 h-8">
            <Link href="/pessoas" className="flex items-center">
              Ver todas <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {topPeople.length > 0 ? (
            topPeople.map((person, index) => (
              <PersonPriorityCard 
                key={person.id}
                person={person}
                index={index}
                layout="card"
              />
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center bg-zinc-50 border-2 border-dashed border-zinc-100 rounded-2xl">
               <Flame className="h-10 w-10 text-zinc-200 mb-3" />
               <p className="text-sm font-bold text-zinc-400">Ninguém priorizado para hoje ainda.</p>
               <Button variant="link" size="sm" className="text-indigo-600 font-bold">
                 <Link href="/pessoas/importar">Importar novas pessoas</Link>
               </Button>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 units) */}
        <div className="lg:col-span-8 space-y-8">
          {/* 2. Situação do Dia Cards */}
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <RadarMetricCard 
              label="Novas no Radar"
              value={pilotStats.summary.prioritizedToday}
              tone="hot"
              icon={Flame}
              helper="Identificadas hoje"
            />
            <RadarMetricCard 
              label="Tarefas Abertas"
              value={pilotStats.summary.openTasks}
              tone="info"
              icon={Inbox}
              href="/abordagem"
            />
            <RadarMetricCard 
              label="Sem Responsável"
              value={pilotStats.summary.tasksWithoutResponsible}
              tone="neutral"
              icon={Ghost}
              href="/abordagem?filter=sem_responsavel"
            />

            <RadarMetricCard 
              label="A Encaminhar"
              value={pilotStats.summary.pendingReferralsCount}
              tone="warning"
              icon={MessageSquare}
            />
            <RadarMetricCard 
              label="Respostas"
              value={pilotStats.summary.responsesRecorded}
              tone="success"
              icon={CheckCircle2}
            />
            <RadarMetricCard 
              label="Não Abordar"
              value={pilotStats.summary.doNotContactCount}
              tone="danger"
              icon={AlertTriangle}
            />
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
                <OperationalAlert 
                  type="sem_responsavel" 
                  message={`${pilotStats.summary.tasksWithoutResponsible} tarefas sem dono. A equipe está perdendo oportunidades.`} 
                />
              )}
              
              {pilotStats.summary.pendingReferralsCount > 0 && (
                <OperationalAlert 
                  type="precisa_encaminhar" 
                  message={`${pilotStats.summary.pendingReferralsCount} respostas travadas aguardando encaminhamento.`} 
                />
              )}

              {pilotStats.summary.staleTasksCount > 0 && (
                <OperationalAlert 
                  type="contato_recente" 
                  message={`${pilotStats.summary.staleTasksCount} tarefas paradas há mais de 48 horas.`} 
                />
              )}

              {operationalAlerts.webhookQuarantineCount > 0 && (
                <OperationalAlert 
                  type="webhook_quarentena" 
                  message={`${operationalAlerts.webhookQuarantineCount} webhooks em quarentena aguardando revisão.`} 
                />
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
