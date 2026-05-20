"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
    const nextMute = !isCampfireMuted;
    setIsCampfireMuted(nextMute);
    localStorage.setItem("radar_audio_muted", String(nextMute));
    if (campfireAudioRef.current) {
      campfireAudioRef.current.setMuted(nextMute);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <GamefulHero
        eyebrow="Centro de comando"
        title="Central de Ritmo"
        description="A coordenação semanal da base: ritmo da missão, saúde da operação, campo e cuidado coletivo no mesmo mapa de decisão."
        variant="dark"
        icon={<TowerControl className="h-5 w-5 text-white" />}
        titleClassName="radar-title-display max-w-[8ch] text-5xl sm:text-6xl"
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
            <Button nativeButton={false} className="h-12 bg-[#d39b2a] px-6 text-xs font-black uppercase tracking-[0.18em] text-[#11202a] hover:bg-[#e0aa3b]" render={<Link href={data.nextDecision.href} />}>
              {data.nextDecision.ctaLabel}
            </Button>
            <Button nativeButton={false} variant="outline" className="h-12 border-white/15 bg-white/5 px-6 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-white/10" render={<Link href="/campo" />}>
              Fechar campo
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <Card className="radar-outline-card border-[#23313b] bg-[#12202a] py-0 text-white">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full border border-[#f0c15b]/25 bg-[#f0c15b]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#f7d88c] hover:bg-[#f0c15b]/10">
                  Próxima decisão
                </Badge>
                <Badge
                  className={
                    data.nextDecision.severity === "critical"
                      ? "rounded-full border border-rose-300/30 bg-rose-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-rose-200 hover:bg-rose-500/10"
                      : data.nextDecision.severity === "attention"
                        ? "rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-100 hover:bg-amber-500/10"
                        : "rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100 hover:bg-emerald-500/10"
                  }
                >
                  {data.nextDecision.count} sinais
                </Badge>
              </div>

              <div>
                <h2 className="text-3xl font-black tracking-tight text-white">{data.nextDecision.title}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">{data.nextDecision.description}</p>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">Por que importa</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-200">{data.nextDecision.whyNow}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">Próximo passo</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-200">{data.nextDecision.recommendedAction}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">Apoio da coordenação</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{data.nextDecision.supportCopy}</p>
                {data.nextDecision.guardrailNote ? (
                  <p className="mt-3 text-xs font-semibold leading-5 text-[#f7d88c]">{data.nextDecision.guardrailNote}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">Estado do ciclo</p>
                <p className="mt-2 text-4xl font-black tracking-tight text-white">{data.rhythmSummary.blockedCycles}</p>
                <p className="mt-1 text-sm text-zinc-400">travas abertas no momento</p>
              </div>
              <div className="grid gap-3">
                <GamefulMetricCard label="Alertas críticos" value={data.rhythmSummary.criticalAlerts} tone="dark" compact />
                <GamefulMetricCard label="Alertas ativos" value={data.rhythmSummary.totalAlerts} tone="dark" compact />
                <GamefulMetricCard label="Memória pendente" value={data.memory.draftCount} tone="dark" compact />
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm leading-6 text-zinc-300">{data.rhythmSummary.microcopy}</p>
              </div>
              <Button nativeButton={false} className="h-11 bg-[#d39b2a] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#11202a] hover:bg-[#e0aa3b]" render={<Link href={data.nextDecision.href} />}>
                {data.nextDecision.ctaLabel}
              </Button>
            </div>
          </CardContent>
        </Card>

        <WeeklyRhythmCard state={data.weeklyRhythmState} />
        <DailyMission state={data.missionState} />
      </section>

      <WeeklyLegendsPanel highlights={data.operatorHighlights} />

      <section className="space-y-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Travas do ciclo</p>
          <h3 className="text-2xl font-black tracking-tight text-zinc-950">O que pede decisão agora</h3>
          <p className="text-sm leading-6 text-zinc-600">
            Sem ranking individual. Apenas leitura agregada do que trava o ciclo e qual porta abrir primeiro.
          </p>
        </div>

        {cycleAlerts.length === 0 ? (
          <Card className="border-emerald-200 bg-emerald-50/60">
            <CardContent className="pt-6">
              <p className="text-sm font-semibold text-emerald-800">Nada travado agora.</p>
              <p className="mt-1 text-xs text-emerald-700">Ciclo em dia. Mantenha fechamento leve, memória viva e blocos pequenos.</p>
            </CardContent>
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

      <section>
        <Card className="radar-outline-card border-[#d8c7ac] bg-[rgba(255,250,242,0.92)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#8b7759]">
              <Activity className="h-4 w-4 text-[#b47a0e]" />
              Saúde da operação
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <MetricPill label="Tarefas +48h" value={data.operationHealth.staleTasksCount} icon={Clock} critical={data.operationHealth.staleTasksCount > 5} />
            <MetricPill label="Aguardando +7 dias" value={data.operationHealth.waiting7DaysCount} icon={Clock} critical={data.operationHealth.waiting7DaysCount > 0} />
            <MetricPill label="DM sem confirmação" value={data.operationHealth.dmsPreparedWithoutConfirmation} icon={Zap} critical={data.operationHealth.dmsPreparedWithoutConfirmation > 10} />
            <MetricPill label="Sem responsável" value={data.operationHealth.tasksWithoutResponsible} icon={AlertTriangle} critical={data.operationHealth.tasksWithoutResponsible > 0} />
            <MetricPill label="Territórios sem ação" value={data.operationHealth.territoriesWithoutRecentAction} icon={MapPin} critical={data.operationHealth.territoriesWithoutRecentAction > 3} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
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

        <Card className="radar-outline-card border-[#23313b] bg-[#12202a] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#8b7759]">
              <Landmark className="h-4 w-4 text-[#b47a0e]" />
              Territórios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <GamefulMetricCard label="Mobilização" value={data.territories.mobilizacao} compact className="border-zinc-100 shadow-none" />
              <GamefulMetricCard label="Campo" value={data.territories.campo} compact className="border-zinc-100 shadow-none" />
              <GamefulMetricCard label="Continuidade" value={data.territories.continuidade} compact className="border-zinc-100 shadow-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <GamefulMetricCard label="Prontos para ação" value={data.expansion.readyCount} compact className="border-zinc-100 shadow-none" />
              <GamefulMetricCard label="Pedindo preparo" value={data.expansion.needsPrepCount} compact className="border-zinc-100 shadow-none" />
            </div>
            <Button nativeButton={false} variant="outline" className="border-[#d8c7ac] bg-[#f7f0e4] font-black text-[#11202a]" render={<Link href="/relatorios/territorios" className="flex items-center" />}>
              Ver Territórios <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="radar-outline-card border-[#d8c7ac] bg-[rgba(255,250,242,0.92)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#8b7759]">
              <ScrollText className="h-4 w-4 text-[#b47a0e]" />
              Memória da operação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <GamefulMetricCard label="Rascunhos pendentes" value={data.memory.draftCount} compact className="border-zinc-100 shadow-none" />
              <GamefulMetricCard label="Memórias ativas" value={data.memory.activeCount} compact className="border-zinc-100 shadow-none" />
            </div>
            <p className="text-sm leading-6 text-zinc-600">
              Fechar memória não é burocracia. É o que impede a coordenação de repetir esforço e perder aprendizado.
            </p>
            <Button nativeButton={false} variant="outline" className="border-[#d8c7ac] bg-[#f7f0e4] font-black text-[#11202a]" render={<Link href="/memoria" className="flex items-center" />}>
              Ver memória <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="radar-outline-card border-[#d8c7ac] bg-[rgba(255,250,242,0.92)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#8b7759]">
              <MapPin className="h-4 w-4 text-[#b47a0e]" />
              Campo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <GamefulMetricCard label="Ações planejadas" value={data.field.plannedActions} compact className="border-zinc-100 shadow-none" />
              <GamefulMetricCard label="Precisando confirmação" value={data.field.actionsNeedingConfirmation} compact className="border-zinc-100 shadow-none" />
              <GamefulMetricCard label="Ciclo aberto" value={data.field.pastEventsWithoutResult} compact className="border-zinc-100 shadow-none" />
            </div>
            <Button nativeButton={false} variant="outline" className="border-[#d8c7ac] bg-[#f7f0e4] font-black text-[#11202a]" render={<Link href="/campo" className="flex items-center" />}>
              Ver Agenda de Campo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="radar-outline-card border-[#d8c7ac] bg-[rgba(255,250,242,0.92)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#8b7759]">
              <Coffee className="h-4 w-4 text-[#b47a0e]" />
              Bem-estar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <GamefulMetricCard label="Carga média da fila" value={data.wellness.averageQueueLoad} compact className="border-zinc-100 shadow-none" />
              <GamefulMetricCard label="Alertas de excesso" value={data.wellness.overloadAlerts} compact className="border-zinc-100 shadow-none" />
            </div>
            <div className="rounded-xl border border-[#d8c7ac] bg-white/75 p-3">
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#8b7759]">Recomendação</p>
              <p className="text-sm font-medium text-zinc-700">{data.wellness.recommendation}</p>
            </div>
            <div>
              <Badge variant={data.wellness.level === "critical" ? "destructive" : "secondary"} className="font-black uppercase text-[10px]">
                Nível atual: {data.wellness.level}
              </Badge>
            </div>

            <div className="pt-2">
              {!isCampfireActive ? (
                <Button
                  nativeButton={false}
                  onClick={handleCampfireToggle}
                  className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl border border-amber-500/20"
                >
                  <Flame className="h-4 w-4 text-amber-200 animate-pulse" />
                  Iniciar Fogueira de Pausa
                </Button>
              ) : (
                <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 space-y-4 shadow-sm relative overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95">
                  <div className="absolute top-0 right-0 p-2 z-10 flex gap-2">
                    <button
                      onClick={handleCampfireMuteToggle}
                      className="p-1.5 rounded-lg bg-white/80 hover:bg-white border border-amber-200 text-amber-700 transition-colors shadow-inner"
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
                      <div className="absolute w-2 h-8 bg-amber-800 rounded-full rotate-45 origin-bottom translate-x-1" />
                      <div className="absolute w-2 h-8 bg-amber-900 rounded-full -rotate-45 origin-bottom -translate-x-1" />
                      <Flame className="h-12 w-12 text-amber-500 animate-bounce relative z-10 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                      <Flame className="h-8 w-8 text-red-500 absolute bottom-1 animate-pulse z-20 opacity-80" />
                      <Flame className="h-6 w-6 text-yellow-400 absolute bottom-0 animate-ping z-30 opacity-70" />
                      
                      {/* Sparks particles */}
                      <div className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping top-0 left-2 opacity-75" />
                      <div className="absolute w-1 h-1 bg-amber-400 rounded-full animate-ping -top-2 right-4 opacity-90" />
                    </div>
                    
                    <div className="text-center space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest text-amber-800 flex items-center justify-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500 animate-spin" />
                        Descompressão da Guilda
                      </p>
                      <p className="text-[11px] text-amber-700 leading-relaxed font-semibold">
                        Respire fundo. A fogueira está acesa e o som do fogo queima as tensões do ciclo. Faça uma pausa de 2 minutos.
                      </p>
                    </div>
                  </div>

                  <Button
                    nativeButton={false}
                    onClick={handleCampfireToggle}
                    className="w-full h-9 bg-zinc-800 hover:bg-zinc-900 text-white font-black text-xs uppercase tracking-wider rounded-xl"
                  >
                    Concluir Descanso
                  </Button>
                </div>
              )}
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
  );
}

function WeeklyLegendsPanel({ highlights }: { highlights: RitmoViewData["operatorHighlights"] }) {
  // Filtrar operadores com ações no ciclo atual
  const activeHighlights = highlights.filter(
    (h) => h.responsesRecorded > 0 || h.completedTasks > 0 || h.pendingReferrals > 0
  );

  if (activeHighlights.length === 0) {
    return (
      <Card className="radar-outline-card border-[#d8c7ac] bg-[rgba(255,250,242,0.92)] py-0 shadow-[0_16px_44px_rgba(15,23,42,0.06)]">
        <CardContent className="p-8 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#f0c15b]/10 border border-[#f0c15b]/20 flex items-center justify-center text-[#b47a0e]">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-black text-zinc-950 uppercase tracking-wider">Quadro de Honra da Guilda</h4>
            <p className="mt-1 text-sm text-zinc-600 max-w-md mx-auto">
              A guilda está se preparando para as missões desta semana. Avance na jornada de escuta para coroar os destaques do clã!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ordenar para descobrir líderes de cada categoria
  const arauto = [...activeHighlights].sort((a, b) => b.responsesRecorded - a.responsesRecorded)[0];
  const guardiao = [...activeHighlights].sort((a, b) => b.completedTasks - a.completedTasks)[0];
  const condutor = [...activeHighlights].sort((a, b) => b.pendingReferrals - a.pendingReferrals)[0];

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7759]">Consagração de Esforços</p>
        <h3 className="text-2xl font-black tracking-tight text-zinc-950">Quadro de Honra Cooperativo</h3>
        <p className="text-sm leading-6 text-zinc-600">
          Reconhecimento dos operadores que lideraram o avanço do clã nas missões desta semana.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Arauto do Clã */}
        {arauto && arauto.responsesRecorded > 0 ? (
          <Card className="radar-outline-card border-[#d8c7ac] bg-gradient-to-br from-[#fffdfa] to-[#fcf8ef] py-0 shadow-[0_12px_36px_rgba(15,23,42,0.04)] relative overflow-hidden group hover:border-[#f0c15b] transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#f0c15b]/10 to-transparent rounded-bl-full pointer-events-none" />
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-600 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8b7759]">🗣️ Arauto do Clã</p>
                  <h4 className="mt-0.5 text-lg font-black text-[#11202a]">{arauto.operatorName}</h4>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-600 leading-relaxed">
                  Liderou a escuta coletando e registrando <strong className="text-sky-700">{arauto.responsesRecorded}</strong> retornos de cidadãos no ciclo.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 text-[10px] font-black uppercase tracking-wider text-sky-700">
                    Sintonizador de Vozes
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Guardião da Fila */}
        {guardiao && guardiao.completedTasks > 0 ? (
          <Card className="radar-outline-card border-[#d8c7ac] bg-gradient-to-br from-[#fffdfa] to-[#fcf8ef] py-0 shadow-[0_12px_36px_rgba(15,23,42,0.04)] relative overflow-hidden group hover:border-[#f0c15b] transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#f0c15b]/10 to-transparent rounded-bl-full pointer-events-none" />
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8b7759]">🛡️ Guardião da Fila</p>
                  <h4 className="mt-0.5 text-lg font-black text-[#11202a]">{guardiao.operatorName}</h4>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-600 leading-relaxed">
                  Desobstruiu o avanço da base concluindo <strong className="text-emerald-700">{guardiao.completedTasks}</strong> missões de abordagem no ciclo.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Protetor de Jornada
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Condutor de Vínculos */}
        {condutor && (condutor.pendingReferrals > 0 || condutor.responsesRecorded > 0) ? (
          <Card className="radar-outline-card border-[#d8c7ac] bg-gradient-to-br from-[#fffdfa] to-[#fcf8ef] py-0 shadow-[0_12px_36px_rgba(15,23,42,0.04)] relative overflow-hidden group hover:border-[#f0c15b] transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#f0c15b]/10 to-transparent rounded-bl-full pointer-events-none" />
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-600 flex items-center justify-center">
                  <Compass className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8b7759]">🧭 Condutor de Vínculos</p>
                  <h4 className="mt-0.5 text-lg font-black text-[#11202a]">{condutor.operatorName}</h4>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-600 leading-relaxed">
                  Encaminhou e vinculou novos cidadãos a <strong className="text-amber-700">{condutor.pendingReferrals}</strong> rotas táticas de campo ou WhatsApp.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-[10px] font-black uppercase tracking-wider text-amber-700">
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
    <div className="flex items-center justify-between rounded-xl border border-[#d8c7ac] bg-white/75 p-3">
      <div className="flex items-center gap-2">
        <Icon className={critical ? "h-4 w-4 text-[#b47a0e]" : "h-4 w-4 text-zinc-400"} />
        <span className="text-xs font-bold text-zinc-600">{label}</span>
      </div>
      <Badge variant="outline" className={critical ? "border-[#d39b2a]/35 bg-[#d39b2a]/10 font-black text-[#b47a0e]" : "border-[#d8c7ac] bg-white font-black text-[#11202a]"}>{value}</Badge>
    </div>
  );
}
