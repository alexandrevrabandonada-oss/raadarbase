"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { trackOperationalEvent } from "@/app/actions";
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
import { PersonQuickSheet } from "@/components/radar/person-quick-sheet";

// Onboarding & Pilot Guidance
import { GuidedOnboarding } from "@/components/radar/onboarding/guided-onboarding";
import { PilotChecklist } from "@/components/radar/onboarding/pilot-checklist";
import { OperationalAlarms } from "@/components/radar/onboarding/operational-alarms";
import { DayZeroChecklist } from "@/components/radar/onboarding/day-zero-checklist";
import { ContextHelpCard } from "@/components/radar/context-help-card";
import { LightweightOnboarding } from "@/components/radar/onboarding/lightweight-onboarding";
import { PilotStatusBanner } from "@/components/radar/onboarding/pilot-status-banner";
import { ReadinessChecklist } from "@/components/radar/onboarding/readiness-checklist";
import { getPilotDay, PILOT_DURATION_DAYS } from "@/lib/config";

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
  const [selectedPerson, setSelectedPerson] = useState<PriorityPerson | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  useEffect(() => {
    trackOperationalEvent("dashboard_viewed");
  }, []);

  const currentPilotDay = getPilotDay();
  const criticalIssuesCount = (operationalAlerts.webhookQuarantineCount > 0 ? 1 : 0) + 
                             (operationalAlerts.missingTemplates.length > 0 ? 1 : 0);

  const handleOpenDetails = (person: PriorityPerson) => {
    setSelectedPerson(person);
    setIsSheetOpen(true);
  };

  const handleNextPerson = () => {
    if (!selectedPerson) return;
    const currentIndex = priorityPeople.findIndex(p => p.id === selectedPerson.id);
    if (currentIndex !== -1 && currentIndex < priorityPeople.length - 1) {
      setSelectedPerson(priorityPeople[currentIndex + 1]);
    } else {
      setIsSheetOpen(false);
      setSelectedPerson(null);
    }
  };

  return (
    <div className="space-y-10 pb-12">
      <LightweightOnboarding 
        screenId="dashboard"
        title="Painel de Controle"
        highlights={[
          { title: "Onde começar", description: "Confira os indicadores de hoje no topo para entender o pulso da operação.", icon: LayoutDashboard },
          { title: "Ação principal", description: "Ver 'Pessoas Prioritárias' para identificar quem precisa de atenção imediata.", icon: Target },
          { title: "Evite este erro", description: "Não ignore tarefas paradas. O vínculo se esfria rápido se não houver continuidade.", icon: AlertTriangle },
        ]}
      />

      <PilotStatusBanner 
        currentDay={currentPilotDay}
        totalDays={PILOT_DURATION_DAYS}
        pendingCriticals={criticalIssuesCount}
      />
      
      {/* 0. Readiness Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          <OperationalAlarms 
            stats={{
              unassignedTasks: pilotStats.summary.tasksWithoutResponsible,
              myPendingReferrals: pilotStats.summary.pendingReferralsCount,
              staleTasks: pilotStats.summary.staleTasksCount,
              notAssumedAnything: pilotStats.summary.openTasks === 0
            }}
          />
          <GuidedOnboarding compact />
        </div>
        <div className="lg:col-span-4">
          <ReadinessChecklist />
        </div>
      </div>

      <ContextHelpCard 
        title="Como usar o seu Dashboard"
        whatIsThis="Esta é a sua central de comando diária. Aqui você vê o pulso da operação e quem precisa de atenção imediata."
        whyItMatters="Garante que você foque nas pessoas certas e não perca prazos de resposta importantes."
        whatToDoNow="Confira os indicadores de hoje e clique em uma das 'Pessoas Prioritárias' para iniciar um contato."
        className="mb-8"
      />

      {/* 1. Hero: Top Pessoas */}
      <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-600 fill-orange-600" />
              <h2 className="text-lg font-black tracking-tight">Pessoas Prioritárias para Hoje</h2>
            </div>
            <Button variant="ghost" size="sm" className="font-bold text-indigo-700 h-8">
              <Link href="/pessoas" className="flex items-center">
                Ver todas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {priorityPeople.length > 0 ? (
            priorityPeople.map((person, index) => (
              <PersonPriorityCard 
                key={person.id}
                person={person}
                index={index}
                layout="card"
                onOpenDetails={handleOpenDetails}
              />
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center bg-zinc-50 border-2 border-dashed border-zinc-100 rounded-2xl">
               <Flame className="h-10 w-10 text-zinc-200 mb-3" />
               <p className="text-sm font-bold text-zinc-400">Ninguém priorizado para hoje ainda.</p>
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
              label="Novos Contatos"
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
        </div>

        {/* Right Column (4 units) */}
        <aside className="lg:col-span-4 space-y-8">
          
          <PilotChecklist 
            stats={{
              myTasks: pilotStats.summary.openTasks, // Simplified mapping
              dmsSent: pilotStats.funnel.approached,
              responsesRecorded: pilotStats.summary.responsesRecorded,
              pendingReferrals: pilotStats.summary.pendingReferralsCount,
              blockedRespected: pilotStats.summary.doNotContactCount
            }}
          />

          {/* 5. Ações Rápidas */}
          <section className="space-y-4">
            <h2 className="text-lg font-black">Ações Rápidas</h2>
            <div className="grid grid-cols-1 gap-2">
              <Button  className="w-full justify-start font-black bg-indigo-600 hover:bg-indigo-700 h-12 shadow-sm">
                <Link href="/pessoas" className="w-full h-full flex items-center">
                  <Flame className="mr-3 h-5 w-5" />
                  Pessoas Prioritárias
                </Link>
              </Button>
              <Button  variant="outline" className="w-full justify-start font-black h-12 border-zinc-200">
                <Link href="/abordagem" className="w-full h-full flex items-center">
                  <LayoutDashboard className="mr-3 h-5 w-5 text-zinc-500" />
                  Quadro de Vínculos
                </Link>
              </Button>
            </div>
          </section>

          {/* 6. Atividade Recente */}
          <Card className="bg-zinc-950 text-white border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase text-zinc-400">Escuta Digital</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Sincronizado</p>
                  <p className="text-2xl font-black">2.4k</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Pessoas</p>
                  <p className="text-2xl font-black">152</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <PersonQuickSheet 
        person={selectedPerson}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onNextPerson={handleNextPerson}
        onActionComplete={() => window.location.reload()}
      />
    </div>
  );
}
