"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DailyMission } from "@/components/radar/daily-mission";
import { WeeklyRhythmCard } from "@/components/radar/weekly-rhythm-card";
import { CycleAlertList } from "@/components/radar/cycle-alert-list";
import { GamefulMetricCard } from "@/components/radar/gameful-metric-card";
import { RhythmPanel } from "@/components/radar/rhythm-panel";
import { WeeklyClosureMarkdownGenerator } from "@/components/radar/reports/weekly-closure-markdown-generator";
import { TeamFlowAdoptionPanel } from "@/components/radar/team-flow-adoption-panel";
import type { MissionState } from "@/lib/data/mission-engine";
import type { WeeklyRhythmState } from "@/lib/data/weekly-rhythm";
import type { OperationalCycleAlert } from "@/lib/data/operational-cycle-alerts";
import type { TeamFlowAdoptionMetrics } from "@/lib/data/team-flow-adoption";
import {
  AlertTriangle,
  Clock,
  Heart,
  MapPin,
  Zap,
  Activity,
  Landmark,
  ArrowRight,
  Coffee,
} from "lucide-react";

type RitmoViewData = {
  missionState: MissionState;
  weeklyRhythmState: WeeklyRhythmState;
  collectiveNarrative: {
    linksPrepared: number;
    conversationsRegistered: number;
    referralsMade: number;
    fieldActions: number;
    territoriesInMobilization: number;
  };
  operationHealth: {
    staleTasksCount: number;
    waiting7DaysCount: number;
    dmsPreparedWithoutConfirmation: number;
    tasksWithoutResponsible: number;
    territoriesWithoutRecentAction: number;
  };
  careBase: {
    doNotContactRespected: number;
    sensitiveAlertsCount: number;
    dataUnderReview: number;
    eligibleForReviewCount: number;
  };
  territories: {
    mobilizacao: number;
    campo: number;
    continuidade: number;
  };
  field: {
    plannedActions: number;
    actionsNeedingConfirmation: number;
    pastEventsWithoutResult: number;
  };
  wellness: {
    averageQueueLoad: number;
    overloadAlerts: number;
    recommendation: string;
    level: "healthy" | "warning" | "critical";
  };
  teamAdoption: TeamFlowAdoptionMetrics;
};

export function RitmoClient({ data, cycleAlerts }: { data: RitmoViewData; cycleAlerts: OperationalCycleAlert[] }) {
  return (
    <div className="space-y-8 pb-12">
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <WeeklyRhythmCard state={data.weeklyRhythmState} />
        <DailyMission state={data.missionState} />
        <Card className="border-indigo-100 bg-indigo-50/30">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-700 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Saúde do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-700 font-medium">
              Panorama rápido para coordenação: gargalos críticos, territórios pedindo ação e carga da equipe.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="font-black text-[10px] uppercase">
                Pendências críticas: {data.operationHealth.staleTasksCount}
              </Badge>
              <Badge variant="outline" className="font-black text-[10px] uppercase">
                Campo sem fechamento: {data.field.pastEventsWithoutResult}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button nativeButton={false} className="h-10 bg-zinc-950 px-4 text-[10px] font-black uppercase tracking-[0.18em] hover:bg-zinc-800" render={<Link href="/abordagem?filter=stale" />}>
                Resolver travas
              </Button>
              <Button nativeButton={false} variant="outline" className="h-10 border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.18em]" render={<Link href="/campo" />}>
                Fechar campo
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Saúde da Operação
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
            <MetricPill label="Tarefas +48h" value={data.operationHealth.staleTasksCount} icon={Clock} critical={data.operationHealth.staleTasksCount > 5} />
            <MetricPill label="Aguardando +7 dias" value={data.operationHealth.waiting7DaysCount} icon={Clock} critical={data.operationHealth.waiting7DaysCount > 0} />
            <MetricPill label="DM sem confirmação" value={data.operationHealth.dmsPreparedWithoutConfirmation} icon={Zap} critical={data.operationHealth.dmsPreparedWithoutConfirmation > 10} />
            <MetricPill label="Sem responsável" value={data.operationHealth.tasksWithoutResponsible} icon={AlertTriangle} critical={data.operationHealth.tasksWithoutResponsible > 0} />
            <MetricPill label="Territórios sem ação" value={data.operationHealth.territoriesWithoutRecentAction} icon={MapPin} critical={data.operationHealth.territoriesWithoutRecentAction > 3} />
          </CardContent>
        </Card>
      </section>

      <CycleAlertList alerts={cycleAlerts} />

      <section className="grid lg:grid-cols-2 gap-6">
        <RhythmPanel
          icon={Heart}
          eyebrow="Cuidado da base"
          title="Base protegida pelo ritmo"
          description="Os guardrails operacionais continuam visíveis dentro do mesmo sistema visual do dashboard e da jornada."
          metrics={[
            { label: "Não Abordar respeitados", value: data.careBase.doNotContactRespected, helper: "consentimento mantido no ciclo" },
            { label: "Alertas de notas sensíveis", value: data.careBase.sensitiveAlertsCount, helper: "registros pedindo revisão" },
            { label: "Dados em revisão", value: data.careBase.dataUnderReview, helper: "pontos sob cuidado operacional" },
            { label: "Registros para revisão", value: data.careBase.eligibleForReviewCount, helper: "memória pronta para checagem" },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-indigo-600" />
              Territórios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <GamefulMetricCard label="Mobilização" value={data.territories.mobilizacao} compact className="border-zinc-100 shadow-none" />
              <GamefulMetricCard label="Campo" value={data.territories.campo} compact className="border-zinc-100 shadow-none" />
              <GamefulMetricCard label="Continuidade" value={data.territories.continuidade} compact className="border-zinc-100 shadow-none" />
            </div>
            <Button nativeButton={false} variant="outline" className="font-black" render={<Link href="/relatorios/territorios" className="flex items-center" />}>
              Ver Territórios <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-600" />
              Campo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <GamefulMetricCard label="Ações planejadas" value={data.field.plannedActions} compact className="border-zinc-100 shadow-none" />
              <GamefulMetricCard label="Precisando confirmação" value={data.field.actionsNeedingConfirmation} compact className="border-zinc-100 shadow-none" />
              <GamefulMetricCard label="Passadas sem resultado" value={data.field.pastEventsWithoutResult} compact className="border-zinc-100 shadow-none" />
            </div>
            <Button nativeButton={false} variant="outline" className="font-black" render={<Link href="/campo" className="flex items-center" />}>
              Ver Agenda de Campo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Coffee className="h-4 w-4 text-amber-600" />
              Bem-Estar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <GamefulMetricCard label="Carga média da fila" value={data.wellness.averageQueueLoad} compact className="border-zinc-100 shadow-none" />
              <GamefulMetricCard label="Alertas de excesso" value={data.wellness.overloadAlerts} compact className="border-zinc-100 shadow-none" />
            </div>
            <div className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Recomendação</p>
              <p className="text-sm font-medium text-zinc-700">{data.wellness.recommendation}</p>
            </div>
            <div>
              <Badge variant={data.wellness.level === "critical" ? "destructive" : "secondary"} className="font-black uppercase text-[10px]">
                Nível atual: {data.wellness.level}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      <TeamFlowAdoptionPanel data={data.teamAdoption} />

      <WeeklyClosureMarkdownGenerator
        data={{
          weeklyRhythmState: data.weeklyRhythmState,
          linksPrepared: data.collectiveNarrative.linksPrepared,
          conversationsRegistered: data.collectiveNarrative.conversationsRegistered,
          referralsMade: data.collectiveNarrative.referralsMade,
          fieldActions: data.collectiveNarrative.fieldActions,
          territoriesInMobilization: data.collectiveNarrative.territoriesInMobilization,
          careBase: data.careBase,
          cycleAlerts,
        }}
      />
    </div>
  );
}

function MetricPill({
  label,
  value,
  icon: Icon,
  critical,
}: {
  label: string;
  value: number;
  icon: typeof Clock;
  critical: boolean;
}) {
  return (
    <div className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/40 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={critical ? "h-4 w-4 text-rose-500" : "h-4 w-4 text-zinc-400"} />
        <span className="text-xs font-bold text-zinc-600">{label}</span>
      </div>
      <Badge variant={critical ? "destructive" : "secondary"} className="font-black">{value}</Badge>
    </div>
  );
}
