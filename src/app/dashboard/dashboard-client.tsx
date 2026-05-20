"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackOperationalEvent } from "@/app/actions";
import { PersonQuickSheet } from "@/components/radar/person-quick-sheet";
import { CycleAlertList } from "@/components/radar/cycle-alert-list";
import { GamefulEmptyState } from "@/components/radar/gameful-empty-state";
import { GamefulHero, GamefulHeroBadge } from "@/components/radar/gameful-hero";
import { GamefulMetricCard } from "@/components/radar/gameful-metric-card";
import { GamefulPortalCard } from "@/components/radar/gameful-portal-card";
import { MissionCard as RadarMissionCard } from "@/components/radar/mission-card";
import { RhythmPanel } from "@/components/radar/rhythm-panel";
import { AlertBeacon } from "@/components/radar/alert-beacon";
import { AchievementsSection } from "@/components/radar/achievements-section";
import { OperationalCommandBar } from "@/components/radar/operational-command-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { PriorityPerson, AuditLogEntry } from "@/lib/types";
import type { InternalSession } from "@/lib/supabase/auth";
import type { PilotDashboardData } from "@/lib/data/pilot-stats";
import type { MissionState } from "@/lib/data/mission-engine";
import type { WeeklyRhythmState } from "@/lib/data/weekly-rhythm";
import type { OperationalCycleAlert } from "@/lib/data/operational-cycle-alerts";
import type { DailyNarrative, SeasonNarrative, WeeklyNarrative } from "@/lib/narrative/narrative-types";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  Compass,
  Flag,
  Heart,
  Landmark,
  LayoutDashboard,
  Map,
  MapPinned,
  MessageSquare,
  Radar,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  TowerControl,
  Users,
  Flame,
  ChevronRight,
} from "lucide-react";

type DashboardMissionEvent = {
  id: string;
  title: string;
  neighborhood: string;
  startsAt: string | null;
  status: string;
  pendingConfirmation: number;
  confirmed: number;
  href: string;
};

export type DashboardViewData = {
  narrative: {
    today: DailyNarrative;
    week: WeeklyNarrative;
    season: SeasonNarrative;
  };
  missionState: MissionState;
  weeklyRhythmState: WeeklyRhythmState;
  overallStatus: {
    label: string;
    tone: "healthy" | "warning" | "critical";
    detail: string;
  };
  missionCounts: {
    active: number;
    replies: number;
    referrals: number;
  };
  systemAlerts: {
    unassignedTasks: number;
    staleTasks: number;
    territoriesNeedingAction: number;
    fieldWithoutClosure: number;
  };
  quickMap: {
    counts: {
      mobilizacao: number;
      campo: number;
      continuidade: number;
    };
    highlights: {
      mobilizacao: { neighborhood: string; detail: string } | null;
      campo: { neighborhood: string; detail: string } | null;
      continuidade: { neighborhood: string; detail: string } | null;
    };
  };
  field: {
    plannedCount: number;
    confirmationCount: number;
    unresolvedCount: number;
    upcoming: DashboardMissionEvent[];
    confirmation: DashboardMissionEvent[];
    unresolved: DashboardMissionEvent[];
  };
  care: {
    averageQueueLoad: number;
    overloadAlerts: number;
    wellnessLevel: "healthy" | "warning" | "critical";
    wellnessMicrocopy: string;
    wellnessRecommendation: string;
    baseReviewCount: number;
    sensitiveAlertsCount: number;
    collectiveProgress: number;
    referralsMade: number;
    doNotContactRespected: number;
  };
  integrationAlerts: {
    webhookQuarantineCount: number;
    missingTemplatesCount: number;
  };
  recentLogs: AuditLogEntry[];
};

type DashboardClientProps = {
  session: InternalSession;
  priorityPeople: PriorityPerson[];
  pilotStats: PilotDashboardData;
  cycleAlerts: OperationalCycleAlert[];
  data: DashboardViewData;
};

function HeroJourneyWelcomeWidget({
  session,
  myQueueCount,
  streak,
}: {
  session: InternalSession;
  myQueueCount: number;
  streak: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-[4px] border-2 border-burnt-yellow bg-charcoal p-6 text-white shadow-[4px_4px_0px_0px_rgba(242,169,0,0.35)]">
      {/* Background glowing effects */}
      <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-burnt-yellow/10 blur-2xl" />
      <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-rust/10 blur-2xl" />

      <div className="relative flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[2px] bg-burnt-yellow/10 border-2 border-burnt-yellow/30 text-burnt-yellow">
            <Flame className={cn("h-8 w-8 fill-amber-500/10 text-amber-500", streak > 0 ? "animate-bounce text-amber-400" : "animate-pulse")} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">Caminho do Herói</span>
              {streak > 0 && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase text-[#0f1b24] animate-pulse">
                  Combo x{streak}!
                </span>
              )}
            </div>
            <h3 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              Olá, {session.internalUser.full_name || "Operador"}!
            </h3>
            <p className="max-w-[48ch] text-xs font-semibold leading-relaxed text-zinc-300">
              {myQueueCount > 0 ? (
                <span>
                  Sua trilha tem <strong className="text-amber-300 font-black">{myQueueCount} missões</strong> ativas esperando por você hoje. Cada retorno fechado fortalece nossa base cooperativa!
                </span>
              ) : (
                <span>
                  Você não tem pendências na sua jornada pessoal. Visite o <strong>Mural de Abordagem</strong> para assumir novos vínculos!
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row md:w-auto">
          {myQueueCount > 0 ? (
            <Button
              className="h-14 rounded-[2px] bg-burnt-yellow px-8 text-xs font-black uppercase tracking-wider text-charcoal border-charcoal hover:bg-burnt-yellow/90 shadow-[3px_3px_0px_0px_rgba(11,11,11,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
              nativeButton={false}
              render={<Link href="/minha-fila" />}
            >
              <Compass className="mr-2 h-4 w-4" /> Jogar Minha Jornada <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="h-14 rounded-[2px] border-2 border-cement bg-charcoal/80 px-8 text-xs font-black uppercase tracking-wider text-off-white hover:bg-cement/15 active:translate-x-[1px] active:translate-y-[1px] transition-all"
              nativeButton={false}
              render={<Link href="/abordagem?filter=sem_responsavel" />}
            >
              <Compass className="mr-2 h-4 w-4" /> Ver Missões Abertas <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardClient({ session, priorityPeople, cycleAlerts, data }: DashboardClientProps) {
  const [selectedPerson, setSelectedPerson] = useState<PriorityPerson | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [streak] = useState(() => {
    if (typeof window !== "undefined") {
      const today = new Date().toISOString().split("T")[0];
      const key = `radar_streak_${today}`;
      const saved = localStorage.getItem(key);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  useEffect(() => {
    trackOperationalEvent("dashboard_viewed");
  }, []);

  const handleOpenDetails = (person: PriorityPerson) => {
    setSelectedPerson(person);
    setIsSheetOpen(true);
  };

  const handleNextPerson = () => {
    if (!selectedPerson) return;
    const currentIndex = priorityPeople.findIndex((person) => person.id === selectedPerson.id);
    if (currentIndex >= 0 && currentIndex < priorityPeople.length - 1) {
      setSelectedPerson(priorityPeople[currentIndex + 1]);
      return;
    }

    setSelectedPerson(null);
    setIsSheetOpen(false);
  };

  const myQueue = priorityPeople.filter((p) => p.responsibleId === session.id);

  return (
    <div className="space-y-8 pb-32 lg:pb-16">
      <HeroSection data={data} />

      <HeroJourneyWelcomeWidget
        session={session}
        myQueueCount={myQueue.length}
        streak={streak}
      />

      <OperationalCommandBar
        title="Barra de comando"
        statusLabel="Status geral"
        statusValue={data.overallStatus.label}
        statusDetail={data.overallStatus.detail}
        primaryAction={{
          label: "Iniciar Jornada",
          href: "/minha-fila",
          icon: Route,
        }}
        secondaryActions={[
          {
            label: "Abrir Central de Ritmo",
            href: "/ritmo",
            icon: TowerControl,
          },
          {
            label: "Ver Mural de Missões",
            href: "/abordagem",
            icon: Radar,
          },
        ]}
        shortcutAction={{
          label: "Abrir Minha Jornada",
          href: "/minha-fila",
          icon: ArrowRight,
        }}
      />

      <OperationStartSection data={data} cycleAlerts={cycleAlerts} />

      <MissionSection priorityPeople={priorityPeople} onOpenDetails={handleOpenDetails} />

      <SystemAlertsSection data={data} />

      <OperationPortalsSection data={data} />

      <AchievementsSection data={data} />

      <QuestLogSection logs={data.recentLogs} />

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <QuickMapSection data={data} />
        <FieldSection data={data} />
      </section>

      <CareSection data={data} />

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

function HeroSection({ data }: { data: DashboardViewData }) {
  const statusTone = {
    healthy: "border-emerald-200 bg-emerald-500/12 text-emerald-900",
    warning: "border-amber-200 bg-amber-500/12 text-amber-900",
    critical: "border-rose-200 bg-rose-500/12 text-rose-900",
  }[data.overallStatus.tone];
  const weeklyPhaseIndex = {
    preparar: 1,
    conversar: 3,
    fechar: 5,
    campo: 6,
  }[data.weeklyRhythmState.phase.dayType];

  return (
    <GamefulHero
      eyebrow="Base de comando"
      title="Base de Operações"
      description={data.narrative.season.summary}
      variant="light"
      compact
      titleClassName="radar-title-display max-w-[11ch] text-4xl lg:text-5xl 2xl:text-6xl"
      descriptionClassName="max-w-[32rem] text-base xl:text-[1.05rem]"
      badges={
        <>
          <GamefulHeroBadge light className={statusTone}>{data.overallStatus.label}</GamefulHeroBadge>
          <GamefulHeroBadge light>{data.narrative.today.label}</GamefulHeroBadge>
          <GamefulHeroBadge light>{data.narrative.week.label}</GamefulHeroBadge>
        </>
      }
      actions={
        <>
          <Button className="h-14 rounded-xl bg-[#0f1b24] px-6 text-sm font-black text-white hover:bg-[#172733]" nativeButton={false} render={<Link href="/minha-fila" />}>
            <Route className="h-4 w-4" />
            Iniciar Jornada
          </Button>
          <Button variant="outline" className="h-14 rounded-xl border-[#d3b98f] bg-[#f7f0e4] px-6 text-sm font-black text-[#11202a]" nativeButton={false} render={<Link href="/ritmo" />}>
            <TowerControl className="h-4 w-4" />
            Abrir Central de Ritmo
          </Button>
        </>
      }
      metricsClassName="sm:grid-cols-2 xl:grid-cols-4"
      metrics={
        <>
          <GamefulMetricCard
            icon={<Target className="h-4 w-4" />}
            label="Rede ativa"
            value={`${data.missionState.progress}%`}
            detail="Avanço do bloco principal."
            tone="light"
            compact
            layout="split"
            title={data.narrative.today.nextStep}
            className="min-w-0"
          />
          <GamefulMetricCard
            icon={<Users className="h-4 w-4" />}
            label="Territórios"
            value={data.quickMap.counts.mobilizacao + data.quickMap.counts.campo + data.quickMap.counts.continuidade}
            detail="Bairros com leitura ativa."
            tone="light"
            compact
            layout="split"
            title={data.narrative.season.nextStep}
            className="min-w-0"
          />
          <GamefulMetricCard
            icon={<Flag className="h-4 w-4" />}
            label="Ações hoje"
            value={data.missionCounts.active}
            detail="Missões em foco."
            tone="light"
            compact
            layout="split"
            title={data.narrative.week.support}
            className="min-w-0"
          />
          <GamefulMetricCard
            icon={<Activity className="h-4 w-4" />}
            label="Clima da rede"
            value={data.overallStatus.tone === "healthy" ? "Positivo" : data.overallStatus.tone === "warning" ? "Ajuste" : "Atencao"}
            detail="Leitura geral."
            tone="light"
            compact
            layout="split"
            title={data.overallStatus.detail}
            className="min-w-0"
          />
        </>
      }
      aside={
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.1fr)_220px]">
          <Card className="radar-outline-card radar-panel-dark border-[#23313b] py-0 text-white shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d4b678]">Hoje</p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-white">{data.narrative.today.headline}</p>
                </div>
                <Target className="h-5 w-5 text-[#f0c15b]" />
              </div>
              <p className="text-base leading-7 text-zinc-200">{data.narrative.today.summary}</p>
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d4b678]">Leitura do ciclo</p>
                <p className="text-sm font-semibold text-white">{data.narrative.today.support}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d4b678]">Próximo passo</p>
                <p className="text-sm font-semibold text-white">{data.narrative.today.nextStep}</p>
                <Progress value={data.missionState.progress} className="h-3 bg-white/10" indicatorClassName="bg-[#f0c15b]" />
              </div>
            </CardContent>
          </Card>

          <Card className="radar-outline-card radar-panel-light border-[#d8c7ac] py-0 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8b7759]">Semana</p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-6xl font-black leading-none text-[#11202a]">{String(weeklyPhaseIndex).padStart(2, "0")}</p>
                  <p className="pb-2 text-sm font-semibold text-zinc-600">de 08</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black uppercase leading-8 tracking-tight text-[#4b4337]">
                  {data.narrative.week.label}
                </p>
                <p className="text-sm leading-6 text-zinc-600">{data.narrative.week.summary}</p>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8b7759]">Temporada</p>
                <p className="text-sm font-semibold text-[#4b4337]">{data.narrative.season.label}</p>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-3 w-3 rounded-full border",
                      index < weeklyPhaseIndex
                        ? "border-[#11202a] bg-[#11202a]"
                        : "border-[#bda98a] bg-transparent",
                    )}
                  />
                ))}
              </div>
              <Button variant="ghost" className="h-auto justify-start px-0 text-sm font-black text-[#11202a] hover:bg-transparent" nativeButton={false} render={<Link href="/ritmo" />}>
                Ver leitura da semana
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}

function OperationStartSection({
  data,
  cycleAlerts,
}: {
  data: DashboardViewData;
  cycleAlerts: OperationalCycleAlert[];
}) {
  return (
    <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
      <Card className="radar-outline-card overflow-hidden border-[#d8c7ac] bg-[rgba(255,250,242,0.92)] py-0 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <CardContent className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-950">
              <Sparkles className="h-5 w-5" />
              <h2 className="text-2xl font-black tracking-tight">Começar Jornada</h2>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-black text-zinc-950">{data.narrative.today.headline}</p>
              <p className="max-w-2xl text-sm leading-6 text-zinc-600">{data.narrative.today.summary}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <SignalBadge icon={Target} label="Rede ativa" value={data.missionCounts.active} />
              <SignalBadge icon={MessageSquare} label="Territorios" value={data.quickMap.counts.mobilizacao + data.quickMap.counts.campo + data.quickMap.counts.continuidade} />
              <SignalBadge icon={Flag} label="Acoes hoje" value={data.missionCounts.replies + data.missionCounts.referrals} />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-[#d8c7ac] bg-[rgba(17,32,42,0.05)] p-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8b7759]">Proximo passo</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-[#11202a]">{data.narrative.today.nextStep}</p>
              <Progress value={data.missionState.progress} className="mt-4 h-3 bg-[#d7c7ae]" indicatorClassName="bg-[#11202a]" />
            </div>
            <Button className="mt-5 h-12 rounded-xl bg-[#0f1b24] font-black text-white hover:bg-[#172733]" nativeButton={false} render={<Link href="/minha-fila" />}>
              Continuar Jornada
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="radar-outline-card rounded-[24px] border border-[#23313b] bg-[#12202a] p-4 text-white shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
        <CycleAlertList alerts={cycleAlerts} />
      </div>
    </section>
  );
}

function MissionSection({
  priorityPeople,
  onOpenDetails,
}: {
  priorityPeople: PriorityPerson[];
  onOpenDetails: (person: PriorityPerson) => void;
}) {
  return (
    <section className="space-y-4">
      <SectionHeader
        icon={Radar}
        title="Próximas Missões"
        description="Contatos que já têm contexto, fase e próximo passo claro."
        actionHref="/pessoas"
        actionLabel="Abrir fila completa"
      />

        {priorityPeople.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {priorityPeople.slice(0, 4).map((person) => (
              <RadarMissionCard
                key={person.id}
                person={person}
                primaryActionLabel="Abrir Missão"
                onPrimaryAction={onOpenDetails}
                footer={
                  <div className="flex flex-wrap gap-2">
                    {person.mainTheme ? (
                      <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 text-xs font-bold text-sky-700">
                        {person.mainTheme}
                      </Badge>
                    ) : null}
                    {person.responsibleName ? (
                      <Badge variant="outline" className="rounded-full border-zinc-300 bg-white text-xs font-bold text-zinc-600">
                        {person.responsibleName}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-xs font-bold text-amber-700">
                        Sem responsável
                      </Badge>
                    )}
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <GamefulEmptyState
            variant="journey"
            title="Nenhuma missão ativa"
            description="Nada travado agora. A base não encontrou vínculos com contexto suficiente para entrar na trilha imediata."
            nextActionLabel="preparar a base"
            nextActionHref="/pessoas"
            secondaryAction={
              <Button variant="outline" className="h-11 rounded-xl border-zinc-200 bg-white text-xs font-black uppercase tracking-[0.18em]" nativeButton={false} render={<Link href="/abordagem" />}>
                Abrir mural
              </Button>
            }
          />
        )}
      </section>
    );
}

function OperationPortalsSection({ data }: { data: DashboardViewData }) {
  const portals = [
    {
      icon: LayoutDashboard,
      title: "Base",
      description: "Centro da operação com sinais, missão do dia e visão geral.",
      status: data.overallStatus.label,
      nextStep: "Ver Base",
      href: "/dashboard",
      cta: "Abrir Base",
    },
    {
      icon: Route,
      title: "Jornada",
      description: "Fila guiada para avançar uma missão por vez.",
      status: `${data.missionCounts.active} ativas`,
      nextStep: "Continuar Jornada",
      href: "/minha-fila",
      cta: "Abrir Missão",
    },
    {
      icon: Map,
      title: "Mapa",
      description: "Territórios por fase, calor e ação recomendada.",
      status: `${data.quickMap.counts.mobilizacao + data.quickMap.counts.campo + data.quickMap.counts.continuidade} bairros`,
      nextStep: "Ver Mapa",
      href: "/relatorios/territorios",
      cta: "Ver Mapa",
    },
    {
      icon: Flag,
      title: "Campo",
      description: "Ações presenciais, confirmações e fechamentos.",
      status: `${data.field.plannedCount} próximas`,
      nextStep: data.field.unresolvedCount > 0 ? "Fechar Ciclo" : "Preparar campo",
      href: "/campo",
      cta: "Abrir Campo",
    },
    {
      icon: TowerControl,
      title: "Ritmo",
      description: "Carga, travas e cadência saudável da equipe.",
      status: data.overallStatus.label,
      nextStep: "Cuidar da Base",
      href: "/ritmo",
      cta: "Abrir Ritmo",
    },
    {
      icon: BookOpenCheck,
      title: "Memória",
      description: "Aprendizados e registros que sustentam continuidade.",
      status: `${data.care.baseReviewCount} revisões`,
      nextStep: "Revisar memória",
      href: "/memoria",
      cta: "Abrir Memória",
    },
  ];

  return (
    <section className="space-y-4">
      <SectionHeader
        icon={Compass}
        title="Mapa Rápido"
        description="Mundos principais da operação, cada um com estado, próximo passo e entrada clara."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {portals.map((portal) => (
          <GamefulPortalCard
            key={portal.title}
            icon={portal.icon}
            title={portal.title}
            description={portal.description}
            status={portal.status}
            nextStep={portal.nextStep}
            href={portal.href}
            ctaLabel={portal.cta}
          />
        ))}
      </div>
    </section>
  );
}

function SystemAlertsSection({ data }: { data: DashboardViewData }) {
  return (
    <section className="space-y-4">
      <SectionHeader
        icon={TowerControl}
        title="Alertas do Sistema"
        description="Beacons operacionais que sinalizam travas, pausas longas e território sem resposta."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AlertBeacon
          icon={Users}
          title="Sem responsável"
          value={data.systemAlerts.unassignedTasks}
          detail="Missões que ainda não têm dono claro."
          tone={data.systemAlerts.unassignedTasks > 0 ? "warning" : "healthy"}
          href="/abordagem?filter=sem_responsavel"
          ctaLabel="Resolver trava"
        />
        <AlertBeacon
          icon={AlertTriangle}
          title="Tarefas paradas"
          value={data.systemAlerts.staleTasks}
          detail="Pendências sem movimento recente no ciclo."
          tone={data.systemAlerts.staleTasks > 0 ? "critical" : "healthy"}
          href="/abordagem"
          ctaLabel="Resolver trava"
        />
        <AlertBeacon
          icon={MapPinned}
          title="Territórios pedindo ação"
          value={data.systemAlerts.territoriesNeedingAction}
          detail="Bairros sem atualização recente de mobilização."
          tone={data.systemAlerts.territoriesNeedingAction > 0 ? "warning" : "healthy"}
          href="/relatorios/territorios"
          ctaLabel="Ver mapa"
        />
        <AlertBeacon
          icon={Flag}
          title="Campo sem fechamento"
          value={data.systemAlerts.fieldWithoutClosure}
          detail="Ações passadas que ainda precisam de devolutiva."
          tone={data.systemAlerts.fieldWithoutClosure > 0 ? "critical" : "healthy"}
          href="/campo"
          ctaLabel="Fechar ciclo"
        />
      </div>
    </section>
  );
}

function QuickMapSection({ data }: { data: DashboardViewData }) {
  return (
    <section className="space-y-4">
      <SectionHeader
        icon={Map}
        title="Mapa Rápido"
        description="Leitura tática dos bairros em mobilização, campo e continuidade."
        actionHref="/relatorios/territorios"
        actionLabel="Ver Mapa"
      />

      <Card className="overflow-hidden border-zinc-200 py-0">
          <CardContent className="grid gap-4 p-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              <QuickMapCard
                title="Mobilização"
                value={data.quickMap.counts.mobilizacao}
                detail={data.quickMap.highlights.mobilizacao?.detail ?? "Mapa ainda sem sinais."}
                neighborhood={data.quickMap.highlights.mobilizacao?.neighborhood ?? "Sem foco"}
                tone="amber"
              />
              <QuickMapCard
                title="Campo"
                value={data.quickMap.counts.campo}
                detail={data.quickMap.highlights.campo?.detail ?? "Sem campo planejado."}
                neighborhood={data.quickMap.highlights.campo?.neighborhood ?? "Sem foco"}
                tone="indigo"
              />
              <QuickMapCard
                title="Continuidade"
                value={data.quickMap.counts.continuidade}
                detail={data.quickMap.highlights.continuidade?.detail ?? "Ciclo em dia."}
                neighborhood={data.quickMap.highlights.continuidade?.neighborhood ?? "Sem foco"}
                tone="emerald"
              />
            </div>

          <div className="radar-outline-card rounded-[24px] border border-[#d8c7ac] bg-[linear-gradient(180deg,_rgba(255,252,247,0.98),_rgba(244,236,223,0.92))] p-5">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-zinc-900" />
              <p className="text-lg font-black tracking-tight text-zinc-950">Mapa da Mobilização</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Cada território deve parecer parte da mesma campanha: fase visível, próximo passo claro e conexão direta com campo e jornada.
            </p>
            <div className="mt-5 grid gap-3">
              <TerritoryLine label="Mobilização" value={`${data.quickMap.counts.mobilizacao} bairros`} color="bg-amber-500" />
              <TerritoryLine label="Campo" value={`${data.quickMap.counts.campo} bairros`} color="bg-indigo-600" />
              <TerritoryLine label="Continuidade" value={`${data.quickMap.counts.continuidade} bairros`} color="bg-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function FieldSection({ data }: { data: DashboardViewData }) {
  return (
    <section className="space-y-4">
      <SectionHeader
        icon={Flag}
        title="Campo em Andamento"
        description="Agenda viva da campanha: próximas ações, confirmações e fechamentos pendentes."
        actionHref="/campo"
        actionLabel="Abrir Campo"
      />

      <Card className="radar-outline-card border-[#d8c7ac] bg-[rgba(255,250,242,0.92)] py-0 shadow-[0_16px_44px_rgba(15,23,42,0.06)]">
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <SignalBadge icon={Route} label="Próximas ações" value={data.field.plannedCount} />
            <SignalBadge icon={MessageSquare} label="Pedindo confirmação" value={data.field.confirmationCount} />
            <SignalBadge icon={ShieldCheck} label="Sem fechamento" value={data.field.unresolvedCount} />
          </div>

          <FieldColumn title="Próximas ações" items={data.field.upcoming} emptyLabel="Sem campo planejado." />
          <FieldColumn title="Precisando confirmação" items={data.field.confirmation} emptyLabel="Nada travado agora." />
          <FieldColumn title="Passadas sem fechamento" items={data.field.unresolved} emptyLabel="Ciclo em dia." />
        </CardContent>
      </Card>
    </section>
  );
}

function CareSection({ data }: { data: DashboardViewData }) {
  return (
    <section className="space-y-4">
      <SectionHeader
        icon={Heart}
        title="Cuidado e Ritmo"
        description="Leitura coletiva de carga, bem-estar operacional, cuidado da base e avanço do ciclo."
        actionHref="/ritmo"
        actionLabel="Cuidar da Base"
      />

      <RhythmPanel
        icon={Heart}
        eyebrow="Leitura coletiva"
        title="Ritmo que sustenta a operação"
        description="Carga, bem-estar e cuidado da base fecham o ciclo da operação antes de abrir novas frentes."
        badge={data.care.wellnessLevel}
        metrics={[
          { label: "Carga da equipe", value: `${data.care.averageQueueLoad}`, helper: "média de tarefas abertas" },
          { label: "Alertas de bem-estar", value: `${data.care.overloadAlerts}`, helper: "pontos pedindo redistribuição" },
          { label: "Cuidado da base", value: `${data.care.baseReviewCount}`, helper: "registros pedindo revisão" },
          { label: "Progresso coletivo", value: `${data.care.collectiveProgress}`, helper: "ciclos concluídos no funil" },
        ]}
        signals={[
          { label: "Nao Abordar respeitados", value: data.care.doNotContactRespected },
          { label: "Alertas sensiveis", value: data.care.sensitiveAlertsCount },
          { label: "Encaminhamentos do ciclo", value: data.care.referralsMade },
        ]}
        footer={
          <>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">Cuidar da Base</p>
            <p className="mt-2 text-lg font-black text-white">{data.care.wellnessMicrocopy}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{data.care.wellnessRecommendation}</p>
          </>
        }
      />
    </section>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: typeof Radar;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-zinc-950">
          <Icon className="h-5 w-5" />
          <h2 className="text-2xl font-black tracking-tight">{title}</h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-[#6f6250]">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Button variant="outline" className="rounded-xl border-[#d3b98f] bg-[#f7f0e4] font-black text-[#11202a]" nativeButton={false} render={<Link href={actionHref} />}>
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

function SignalBadge({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: number;
}) {
  return (
      <div className="radar-outline-card rounded-2xl border border-[#d8c7ac] bg-white/75 p-3">
        <div className="flex items-center gap-2 text-[#8b7759]">
          <Icon className="h-4 w-4" />
          <p className="text-[9px] font-black uppercase tracking-[0.14em] leading-4">{label}</p>
        </div>
        <p className="mt-2 text-2xl font-black text-zinc-950">{value}</p>
      </div>
  );
}

function QuickMapCard({
  title,
  value,
  neighborhood,
  detail,
  tone,
}: {
  title: string;
  value: number;
  neighborhood: string;
  detail: string;
  tone: "amber" | "indigo" | "emerald";
}) {
  const cardTone = tone === "amber" ? "amber" : tone === "emerald" ? "emerald" : "indigo";
  const textTone = tone === "amber" ? "text-amber-900" : tone === "emerald" ? "text-emerald-900" : "text-indigo-900";
  return (
    <div className="rounded-[24px] border border-zinc-200 bg-white/90 p-4">
      <GamefulMetricCard label={title} value={value} tone={cardTone} compact layout="split" className="border-none bg-transparent shadow-none" />
      <p className={cn("mt-4 truncate text-sm font-black", textTone)}>{neighborhood}</p>
      <p className="mt-1 text-sm leading-6 text-zinc-600">{detail}</p>
    </div>
  );
}

function TerritoryLine({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className={cn("h-2.5 w-2.5 rounded-full", color)} />
        <p className="text-sm font-bold text-zinc-700">{label}</p>
      </div>
      <p className="text-sm font-black text-zinc-950">{value}</p>
    </div>
  );
}

function FieldColumn({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: DashboardMissionEvent[];
  emptyLabel: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">{title}</p>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Link key={item.id} href={item.href} className="block rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 transition-colors hover:bg-zinc-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-zinc-950">{item.title}</p>
                  <p className="text-sm text-zinc-500">{item.neighborhood}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.startsAt ? (
                  <Badge variant="outline" className="rounded-full border-zinc-300 bg-white text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                    {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(item.startsAt))}
                  </Badge>
                ) : null}
                {item.pendingConfirmation > 0 ? (
                  <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                    {item.pendingConfirmation} aguardando confirmação
                  </Badge>
                ) : null}
                {item.confirmed > 0 ? (
                  <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                    {item.confirmed} confirmados
                  </Badge>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

function getQuestLogActionStyle(action: string) {
  if (action.startsWith("contact.")) {
    return {
      icon: MessageSquare,
      colorClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    };
  }
  if (action.startsWith("action_execution.") || action.startsWith("field_agenda.")) {
    return {
      icon: Flag,
      colorClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    };
  }
  if (action.startsWith("message.")) {
    return {
      icon: Sparkles,
      colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
  }
  if (action.startsWith("volunteer") || action.startsWith("internal_user.")) {
    return {
      icon: Users,
      colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
  }
  if (action.startsWith("strategic_memory.")) {
    return {
      icon: BookOpenCheck,
      colorClass: "bg-[#d4b678]/10 text-[#f0c15b] border-[#d4b678]/20",
    };
  }
  return {
    icon: Activity,
    colorClass: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };
}

function QuestLogSection({ logs }: { logs: AuditLogEntry[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `Há ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Há ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Ontem";
    return `Há ${diffDays} dias`;
  }

  return (
    <section className="space-y-4">
      <SectionHeader
        icon={Activity}
        title="Diário de Bordo Narrativo"
        description="Crônicas e atividades operacionais recentes realizadas pela guilda de base."
      />

      <Card className="border-none shadow-xl bg-gradient-to-br from-[#121c24] to-[#0a1015] border border-[#23323e] overflow-hidden">
        <CardContent className="p-6">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 font-semibold text-sm">
              Diário de Bordo vazio. Comece a interagir com a base para gerar crônicas!
            </div>
          ) : (
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {logs.slice(0, 10).map((log) => {
                const style = getQuestLogActionStyle(log.action);
                const IconComponent = style.icon;
                return (
                  <div key={log.id} className="flex items-start gap-4 p-3 rounded-2xl bg-black/25 border border-[#23323e]/40 hover:border-[#23323e] transition-all group">
                    <div className={cn("mt-0.5 p-2 rounded-xl border flex items-center justify-center shrink-0", style.colorClass)}>
                      <IconComponent className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#d4b678] truncate">
                          {log.actorEmail || "Sistema Automático"}
                        </p>
                        <span className="text-[10px] font-bold text-zinc-500 shrink-0">
                          {mounted
                            ? formatRelativeTime(log.createdAt)
                            : new Intl.DateTimeFormat("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(log.createdAt))}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-zinc-100 leading-relaxed">
                        {log.summary}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
