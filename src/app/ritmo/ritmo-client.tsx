"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DailyMission } from "@/components/radar/daily-mission";
import { WeeklyRhythmCard } from "@/components/radar/weekly-rhythm-card";
import { GamefulMetricCard } from "@/components/radar/gameful-metric-card";
import { RhythmPanel } from "@/components/radar/rhythm-panel";
import { WeeklyClosureMarkdownGenerator } from "@/components/radar/reports/weekly-closure-markdown-generator";
import { TeamFlowAdoptionPanel } from "@/components/radar/team-flow-adoption-panel";
import { GamefulHero } from "@/components/radar/gameful-hero";
import { AlertBeacon } from "@/components/radar/alert-beacon";
import type { MissionState } from "@/lib/data/mission-engine";
import type { WeeklyRhythmState } from "@/lib/data/weekly-rhythm";
import type { TeamFlowAdoptionMetrics } from "@/lib/data/team-flow-adoption";
import type { CycleAlertEngineItem } from "@/lib/rhythm/cycle-alert-engine";
import type { RhythmNextDecision } from "@/lib/rhythm/next-decision";
import type { RhythmSummary } from "@/lib/rhythm/rhythm-summary";
import { CampfireAudio } from "@/lib/audio/campfire";
import { playSynthConfirm } from "@/lib/audio";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  Clock,
  Coffee,
  Compass,
  Flame,
  GitBranch,
  Heart,
  Landmark,
  MapPin,
  MessageSquare,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TowerControl,
  Users,
  Volume2,
  VolumeX,
  Zap,
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
  nextDecision: RhythmNextDecision;
  rhythmSummary: RhythmSummary;
  memory: {
    draftCount: number;
    activeCount: number;
  };
  expansion: {
    readyCount: number;
    needsPrepCount: number;
  };
  operatorHighlights: Array<{
    operatorName: string;
    openTasks: number;
    completedTasks: number;
    responsesRecorded: number;
    pendingReferrals: number;
  }>;
};

const alertIconMap = {
  urgent_care: ShieldAlert,
  pending_returns: Clock,
  unassigned_missions: Users,
  open_referrals: GitBranch,
  field_without_closure: MapPin,
  territory_without_action: AlertTriangle,
  pending_memory: ScrollText,
  high_team_load: Coffee,
  territory_ready: Landmark,
} as const;

function alertTone(severity: CycleAlertEngineItem["severity"]): "healthy" | "warning" | "critical" {
  if (severity === "critical") return "critical";
  if (severity === "attention") return "warning";
  return "healthy";
}

export function RitmoClient({ data, cycleAlerts }: { data: RitmoViewData; cycleAlerts: CycleAlertEngineItem[] }) {
  const [isCampfireActive, setIsCampfireActive] = useState(false);
  const [isCampfireMuted, setIsCampfireMuted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("radar_audio_muted") === "true";
    }
    return false;
  });
  const campfireAudioRef = useRef<CampfireAudio | null>(null);

  useEffect(() => {
    return () => {
      if (campfireAudioRef.current) {
        campfireAudioRef.current.stop();
      }
    };
  }, []);

  const handleCampfireToggle = () => {
    playSynthConfirm();
    if (isCampfireActive) {
      if (campfireAudioRef.current) {
        campfireAudioRef.current.stop();
      }
      setIsCampfireActive(false);
    } else {
      if (!campfireAudioRef.current) {
        campfireAudioRef.current = new CampfireAudio();
      }
      campfireAudioRef.current.start();
      setIsCampfireActive(true);
    }
  };

  const handleCampfireMuteToggle = () => {
    playSynthConfirm();
    const nextMute = !isCampfireMuted;
    setIsCampfireMuted(nextMute);
    localStorage.setItem("radar_audio_muted", String(nextMute));
    if (campfireAudioRef.current) {
      campfireAudioRef.current.setMuted(nextMute);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className={cn("transition-all duration-1000", isCampfireActive && "grayscale opacity-40 pointer-events-none")}>
        <GamefulHero
          eyebrow="Centro de comando"
          title="Central de Ritmo"
          description="A coordenação semanal da base: ritmo da missão, saúde da operação, campo e cuidado coletivo no mesmo mapa de decisão."
          variant="dark"
          icon={<TowerControl className="h-5 w-5 text-white" />}
          titleClassName="radar-title-display max-w-[8ch] text-5xl sm:text-6xl text-off-white"
          metrics={
            <>
              <GamefulMetricCard label="Pendências +48h" value={data.operationHealth.staleTasksCount} tone="dark" compact layout="split" />
              <GamefulMetricCard label="Sem responsável" value={data.operationHealth.tasksWithoutResponsible} tone="dark" compact layout="split" />
              <GamefulMetricCard label="Campo aberto" value={data.field.pastEventsWithoutResult} tone="dark" compact layout="split" />
              <GamefulMetricCard label="Carga média" value={data.wellness.averageQueueLoad} tone="dark" compact layout="split" />
            </>
          }
          actions={
            <>
              <Button 
                nativeButton={false} 
                variant="default"
                className="rounded-[2px] border-black h-11 px-6 text-xs font-black uppercase tracking-wider" 
                render={<Link href={data.nextDecision.href} />}
                onClick={() => playSynthConfirm()}
              >
                {data.nextDecision.ctaLabel}
              </Button>
              <Button 
                nativeButton={false} 
                variant="outline" 
                className="rounded-[2px] border-white/20 h-11 px-6 text-xs font-black uppercase tracking-wider text-white hover:bg-white/10" 
                render={<Link href="/campo" />}
                onClick={() => playSynthConfirm()}
              >
                Fechar campo
              </Button>
            </>
          }
        />
      </div>

      <section className={cn("grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr_0.8fr] transition-all duration-1000", isCampfireActive && "grayscale opacity-40 pointer-events-none")}>
        {/* Próxima Decisão */}
        <Card className="radar-panel-dark border-2 border-black text-white py-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-[2px]">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-[2px] border-2 border-burnt-yellow bg-burnt-yellow/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-burnt-yellow">
                  Próxima decisão
                </Badge>
                <Badge
                  className={cn(
                    "rounded-[2px] border-2 px-3 py-1 text-[9px] font-black uppercase tracking-widest",
                    data.nextDecision.severity === "critical"
                      ? "border-rose-600 bg-rose-500/10 text-rose-300"
                      : data.nextDecision.severity === "attention"
                        ? "border-amber-500 bg-amber-500/10 text-amber-200"
                        : "border-emerald-600 bg-emerald-500/10 text-emerald-200"
                  )}
                >
                  {data.nextDecision.count} sinais
                </Badge>
              </div>

              <div>
                <h2 className="text-2xl font-black uppercase tracking-wider text-off-white">{data.nextDecision.title}</h2>
                <p className="mt-2.5 max-w-3xl text-xs leading-relaxed text-zinc-450">{data.nextDecision.description}</p>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-[2px] border-2 border-white/10 bg-black/45 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-burnt-yellow">Por que importa</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-350">{data.nextDecision.whyNow}</p>
                </div>
                <div className="rounded-[2px] border-2 border-white/10 bg-black/45 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-burnt-yellow">Próximo passo</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-350">{data.nextDecision.recommendedAction}</p>
                </div>
              </div>

              <div className="rounded-[2px] border-2 border-white/10 bg-black/45 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-burnt-yellow">Apoio da coordenação</p>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{data.nextDecision.supportCopy}</p>
                {data.nextDecision.guardrailNote ? (
                  <p className="mt-2 text-[10px] font-black uppercase text-burnt-yellow">{data.nextDecision.guardrailNote}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 rounded-[2px] border-2 border-white/10 bg-black/40 p-5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-burnt-yellow">Estado do ciclo</p>
                <p className="mt-2 text-4xl font-black tracking-tight text-white">{data.rhythmSummary.blockedCycles}</p>
                <p className="mt-1 text-[10px] font-bold uppercase text-zinc-400">travas ativas</p>
              </div>
              <div className="grid gap-2">
                <GamefulMetricCard label="Alertas críticos" value={data.rhythmSummary.criticalAlerts} tone="dark" compact />
                <GamefulMetricCard label="Alertas ativos" value={data.rhythmSummary.totalAlerts} tone="dark" compact />
                <GamefulMetricCard label="Memória pendente" value={data.memory.draftCount} tone="dark" compact />
              </div>
              <div className="rounded-[2px] border border-white/10 bg-black/25 p-3.5">
                <p className="text-[10px] leading-relaxed text-zinc-400">{data.rhythmSummary.microcopy}</p>
              </div>
              <Button 
                nativeButton={false} 
                variant="default"
                className="w-full h-11 border-black rounded-[2px] text-xs font-black uppercase tracking-widest" 
                render={<Link href={data.nextDecision.href} />}
                onClick={() => playSynthConfirm()}
              >
                {data.nextDecision.ctaLabel}
              </Button>
            </div>
          </CardContent>
        </Card>

        <WeeklyRhythmCard state={data.weeklyRhythmState} />
        <DailyMission state={data.missionState} />
      </section>

      <div className={cn("transition-all duration-1000", isCampfireActive && "grayscale opacity-40 pointer-events-none")}>
        <WeeklyLegendsPanel highlights={data.operatorHighlights} />
      </div>

      <section className={cn("space-y-4 transition-all duration-1000", isCampfireActive && "grayscale opacity-40 pointer-events-none")}>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-cement">Travas do ciclo</p>
          <h3 className="text-xl font-black uppercase tracking-wider text-charcoal">O que pede decisão agora</h3>
          <p className="text-xs text-cement leading-relaxed">
            Sem ranking competitivo. Apenas visualização das pendências que afetam o andamento da equipe no território.
          </p>
        </div>

        {cycleAlerts.length === 0 ? (
          <Card className="border-2 border-black bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 rounded-[2px] p-5">
            <p className="text-sm font-black uppercase text-emerald-700">Nada travado agora.</p>
            <p className="mt-1 text-xs text-emerald-600">Ciclo limpo e em dia. Mantenha os fechamentos em blocos pequenos.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cycleAlerts.map((alert) => {
              const Icon = alertIconMap[alert.type] ?? AlertTriangle;
              return (
                <AlertBeacon
                  key={alert.type}
                  icon={Icon}
                  title={alert.title}
                  value={alert.count}
                  detail={alert.recommendedAction}
                  tone={alertTone(alert.severity)}
                  href={alert.href}
                  ctaLabel="Abrir rota"
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Saúde da Operação */}
      <section className={cn("transition-all duration-1000", isCampfireActive && "grayscale opacity-40 pointer-events-none")}>
        <Card className="bloco-concreto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-charcoal">
              <Activity className="h-4 w-4 text-burnt-yellow" />
              Saúde da Operação
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MetricPill label="Tarefas +48h" value={data.operationHealth.staleTasksCount} icon={Clock} critical={data.operationHealth.staleTasksCount > 5} />
            <MetricPill label="Aguardando +7 dias" value={data.operationHealth.waiting7DaysCount} icon={Clock} critical={data.operationHealth.waiting7DaysCount > 0} />
            <MetricPill label="DM sem confirmação" value={data.operationHealth.dmsPreparedWithoutConfirmation} icon={Zap} critical={data.operationHealth.dmsPreparedWithoutConfirmation > 10} />
            <MetricPill label="Sem responsável" value={data.operationHealth.tasksWithoutResponsible} icon={AlertTriangle} critical={data.operationHealth.tasksWithoutResponsible > 0} />
            <MetricPill label="Territórios sem ação" value={data.operationHealth.territoriesWithoutRecentAction} icon={MapPin} critical={data.operationHealth.territoriesWithoutRecentAction > 3} />
          </CardContent>
        </Card>
      </section>

      {/* Outros Painéis do Clã */}
      <section className={cn("grid gap-6 lg:grid-cols-2 xl:grid-cols-3 transition-all duration-1000", isCampfireActive && "grayscale opacity-40 pointer-events-none")}>
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

        <Card className="radar-panel-dark border-2 border-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-[2px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-burnt-yellow">
              <Landmark className="h-4 w-4" />
              Territórios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <GamefulMetricCard label="Mobilização" value={data.territories.mobilizacao} compact tone="dark" />
              <GamefulMetricCard label="Campo" value={data.territories.campo} compact tone="dark" />
              <GamefulMetricCard label="Continuidade" value={data.territories.continuidade} compact tone="dark" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <GamefulMetricCard label="Prontos para ação" value={data.expansion.readyCount} compact tone="dark" />
              <GamefulMetricCard label="Pedindo preparo" value={data.expansion.needsPrepCount} compact tone="dark" />
            </div>
            <Button 
              nativeButton={false} 
              variant="default" 
              className="w-full border-black rounded-[2px] text-xs font-black uppercase" 
              render={<Link href="/relatorios/territorios" className="flex items-center" />}
              onClick={() => playSynthConfirm()}
            >
              Ver Territórios <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bloco-concreto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-charcoal">
              <ScrollText className="h-4 w-4 text-burnt-yellow" />
              Memória da operação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <GamefulMetricCard label="Rascunhos pendentes" value={data.memory.draftCount} compact className="border-black shadow-none" />
              <GamefulMetricCard label="Memórias ativas" value={data.memory.activeCount} compact className="border-black shadow-none" />
            </div>
            <p className="text-xs text-cement leading-relaxed">
              Consolidar a memória evita redundância de abordagens e preserva o aprendizado dos voluntários de rua.
            </p>
            <Button 
              nativeButton={false} 
              variant="outline" 
              className="w-full border-black rounded-[2px] text-xs font-black uppercase" 
              render={<Link href="/memoria" className="flex items-center" />}
              onClick={() => playSynthConfirm()}
            >
              Ver memória <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className={cn("bloco-concreto transition-all duration-1000", isCampfireActive && "grayscale opacity-40 pointer-events-none")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-charcoal">
              <MapPin className="h-4 w-4 text-burnt-yellow" />
              Campo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <GamefulMetricCard label="Ações planejadas" value={data.field.plannedActions} compact className="border-black shadow-none" />
              <GamefulMetricCard label="Precisando confirmação" value={data.field.actionsNeedingConfirmation} compact className="border-black shadow-none" />
              <GamefulMetricCard label="Ciclo aberto" value={data.field.pastEventsWithoutResult} compact className="border-black shadow-none" />
            </div>
            <Button 
              nativeButton={false} 
              variant="outline" 
              className="w-full border-black rounded-[2px] text-xs font-black uppercase" 
              render={<Link href="/campo" className="flex items-center" />}
              onClick={() => playSynthConfirm()}
            >
              Ver Agenda de Campo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Módulo de Fogueira */}
        <Card className={cn("bloco-concreto transition-all duration-500", isCampfireActive && "shadow-[4px_4px_0px_0px_rgba(242,169,0,1)] border-burnt-yellow")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-charcoal">
              <Coffee className="h-4 w-4 text-burnt-yellow" />
              Bem-estar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <GamefulMetricCard label="Carga média da fila" value={data.wellness.averageQueueLoad} compact className="border-black shadow-none" />
              <GamefulMetricCard label="Alertas de excesso" value={data.wellness.overloadAlerts} compact className="border-black shadow-none" />
            </div>
            <div className="rounded-[2px] border-2 border-black bg-zinc-50 dark:bg-zinc-800 p-3">
              <p className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-cement">Recomendação</p>
              <p className="text-xs font-bold text-charcoal dark:text-off-white">{data.wellness.recommendation}</p>
            </div>
            <div>
              <Badge variant={data.wellness.level === "critical" ? "destructive" : "outline"} className="border-black font-mono text-[9px] uppercase">
                Nível atual: {data.wellness.level}
              </Badge>
            </div>

            <div className="pt-2">
              {!isCampfireActive ? (
                <Button
                  onClick={handleCampfireToggle}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-[2px]"
                >
                  <Flame className="h-4 w-4 text-charcoal animate-pulse" />
                  Iniciar Fogueira de Pausa
                </Button>
              ) : (
                <div className="rounded-[2px] border-2 border-black bg-amber-100/50 dark:bg-amber-950/20 p-4 space-y-4 relative overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 text-charcoal dark:text-amber-200">
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      onClick={handleCampfireMuteToggle}
                      className="p-1.5 rounded-[2px] bg-background border-2 border-foreground text-foreground transition-all shadow-inner"
                      title={isCampfireMuted ? "Ativar som" : "Desativar som"}
                    >
                      {isCampfireMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4 animate-bounce" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col items-center justify-center py-6 space-y-3 relative">
                    {/* Campfire Animation */}
                    <div className="relative w-16 h-16 flex items-end justify-center">
                      <div className="absolute w-2 h-8 bg-amber-800 dark:bg-amber-900 rounded-full rotate-45 origin-bottom translate-x-1" />
                      <div className="absolute w-2 h-8 bg-amber-900 dark:bg-amber-950 rounded-full -rotate-45 origin-bottom -translate-x-1" />
                      <Flame className="h-12 w-12 text-burnt-yellow animate-bounce relative z-10 filter drop-shadow-[0_0_8px_rgba(242,169,0,0.6)]" />
                      <Flame className="h-8 w-8 text-red-500 absolute bottom-1 animate-pulse z-20 opacity-80" />
                      <Flame className="h-6 w-6 text-yellow-400 absolute bottom-0 animate-ping z-30 opacity-70" />
                      
                      {/* Sparks particles */}
                      <div className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping top-0 left-2 opacity-75" />
                      <div className="absolute w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping -top-2 right-4 opacity-90" />
                    </div>
                    
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-800 dark:text-burnt-yellow flex items-center justify-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500 animate-spin" />
                        Descompressão da Base
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed font-bold">
                        Respire fundo. A fogueira está acesa. Feche os olhos por 2 minutos.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleCampfireToggle}
                    variant="secondary"
                    className="w-full h-10 rounded-[2px]"
                  >
                    Concluir Descanso
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <div className={cn("transition-all duration-1000", isCampfireActive && "grayscale opacity-40 pointer-events-none")}>
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
            cycleAlerts: cycleAlerts.map((alert) => ({
              id: alert.type,
              title: alert.title,
              message: alert.description,
              nextStep: alert.recommendedAction,
              count: alert.count,
              href: alert.href,
              severity: alert.severity === "critical" ? "critical" : "warning",
            })),
          }}
        />
      </div>
    </div>
  );
}

function WeeklyLegendsPanel({ highlights }: { highlights: RitmoViewData["operatorHighlights"] }) {
  const activeHighlights = highlights.filter(
    (h) => h.responsesRecorded > 0 || h.completedTasks > 0 || h.pendingReferrals > 0
  );

  if (activeHighlights.length === 0) {
    return (
      <Card className="bloco-concreto">
        <CardContent className="p-8 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-[2px] border-2 border-black bg-zinc-100 flex items-center justify-center text-burnt-yellow">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-charcoal uppercase tracking-wider">Quadro de Honra da Base</h4>
            <p className="mt-1 text-xs text-cement max-w-md mx-auto">
              A equipe está se preparando para as missões deste ciclo. Realize ações de escuta para coroar os destaques.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const arauto = [...activeHighlights].sort((a, b) => b.responsesRecorded - a.responsesRecorded)[0];
  const guardiao = [...activeHighlights].sort((a, b) => b.completedTasks - a.completedTasks)[0];
  const condutor = [...activeHighlights].sort((a, b) => b.pendingReferrals - a.pendingReferrals)[0];

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-cement">Consagração de Esforços</p>
        <h3 className="text-xl font-black uppercase tracking-wider text-charcoal">Quadro de Honra Cooperativo</h3>
        <p className="text-xs text-cement leading-relaxed">
          Reconhecimento dos voluntários que lideraram o ritmo de nossa base nas missões deste ciclo.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Arauto do Clã */}
        {arauto && arauto.responsesRecorded > 0 ? (
          <Card className="bloco-concreto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[2px] bg-sky-500/10 border-2 border-sky-500 text-sky-600 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 group-hover:rotate-6 transition-transform" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-cement">🗣️ Arauto do Clã</p>
                  <h4 className="mt-0.5 text-sm font-black text-charcoal dark:text-off-white">{arauto.operatorName}</h4>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-cement leading-relaxed">
                  Liderou a escuta coletando <strong className="text-sky-700 dark:text-sky-400">{arauto.responsesRecorded}</strong> relatos da população.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <Badge variant="outline" className="border-black font-mono text-[9px]">
                    Sintonizador de Vozes
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Guardião da Fila */}
        {guardiao && guardiao.completedTasks > 0 ? (
          <Card className="bloco-concreto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[2px] bg-emerald-500/10 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 group-hover:rotate-6 transition-transform" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-cement">🛡️ Guardião da Fila</p>
                  <h4 className="mt-0.5 text-sm font-black text-charcoal dark:text-off-white">{guardiao.operatorName}</h4>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-cement leading-relaxed">
                  Desobstruiu o andamento da fila com <strong className="text-emerald-700 dark:text-emerald-400">{guardiao.completedTasks}</strong> DMs confirmadas.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <Badge variant="outline" className="border-black font-mono text-[9px]">
                    Protetor da Fila
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Condutor de Vínculos */}
        {condutor && (condutor.pendingReferrals > 0 || condutor.responsesRecorded > 0) ? (
          <Card className="bloco-concreto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[2px] bg-amber-500/10 border-2 border-amber-550 text-amber-600 flex items-center justify-center">
                  <Compass className="h-5 w-5 group-hover:rotate-6 transition-transform" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-cement">🧭 Condutor de Vínculos</p>
                  <h4 className="mt-0.5 text-sm font-black text-charcoal dark:text-off-white">{condutor.operatorName}</h4>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-cement leading-relaxed">
                  Conectou moradores a <strong className="text-amber-700 dark:text-amber-400">{condutor.pendingReferrals}</strong> rotas presenciais/WhatsApp.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <Badge variant="outline" className="border-black font-mono text-[9px]">
                    Pontes e Alianças
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </section>
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
    <div className="flex items-center justify-between rounded-[2px] border-2 border-black bg-zinc-50 dark:bg-zinc-800 p-3">
      <div className="flex items-center gap-2">
        <Icon className={critical ? "h-4 w-4 text-burnt-yellow animate-pulse" : "h-4 w-4 text-cement"} />
        <span className="text-xs font-bold text-charcoal dark:text-off-white">{label}</span>
      </div>
      <Badge variant={critical ? "destructive" : "outline"} className="border-black font-mono text-xs">{value}</Badge>
    </div>
  );
}
