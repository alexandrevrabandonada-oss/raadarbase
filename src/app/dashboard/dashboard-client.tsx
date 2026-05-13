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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { PriorityPerson } from "@/lib/types";
import type { PilotDashboardData } from "@/lib/data/pilot-stats";
import type { MissionState } from "@/lib/data/mission-engine";
import type { WeeklyRhythmState } from "@/lib/data/weekly-rhythm";
import type { OperationalCycleAlert } from "@/lib/data/operational-cycle-alerts";
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
};

type DashboardClientProps = {
  priorityPeople: PriorityPerson[];
  pilotStats: PilotDashboardData;
  cycleAlerts: OperationalCycleAlert[];
  data: DashboardViewData;
};

export function DashboardClient({ priorityPeople, cycleAlerts, data }: DashboardClientProps) {
  const [selectedPerson, setSelectedPerson] = useState<PriorityPerson | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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

  return (
    <div className="space-y-8 pb-12">
      <HeroSection data={data} />

      <OperationStartSection data={data} cycleAlerts={cycleAlerts} />

      <MissionSection priorityPeople={priorityPeople} onOpenDetails={handleOpenDetails} />

      <SystemAlertsSection data={data} />

      <OperationPortalsSection data={data} />

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

  return (
    <GamefulHero
      eyebrow="Base de comando"
      title="Base de Operações"
      description="Seu centro de missões, ritmo e mobilização territorial."
      variant="light"
      badges={
        <>
          <GamefulHeroBadge light className={statusTone}>{data.overallStatus.label}</GamefulHeroBadge>
          <GamefulHeroBadge light>{data.weeklyRhythmState.phase.name}</GamefulHeroBadge>
        </>
      }
      actions={
        <>
          <Button className="h-12 rounded-xl bg-zinc-950 px-5 text-sm font-black hover:bg-zinc-800" nativeButton={false} render={<Link href="/minha-fila" />}>
            <Route className="h-4 w-4" />
            Iniciar Jornada
          </Button>
          <Button variant="outline" className="h-12 rounded-xl border-zinc-300 bg-white/85 px-5 text-sm font-black text-zinc-800" nativeButton={false} render={<Link href="/ritmo" />}>
            <TowerControl className="h-4 w-4" />
            Abrir Central de Ritmo
          </Button>
        </>
      }
      metrics={
        <>
          <GamefulMetricCard icon={Target} label="Missão do Dia" value={`${data.missionState.progress}%`} detail={data.missionState.objective} />
          <GamefulMetricCard icon={Compass} label="Fase da Semana" value={data.weeklyRhythmState.phase.name.split(":")[0] ?? data.weeklyRhythmState.phase.name} detail={data.weeklyRhythmState.phase.description} />
          <GamefulMetricCard icon={Activity} label="Status Geral" value={data.overallStatus.label} detail={`${data.systemAlerts.staleTasks} paradas, ${data.systemAlerts.fieldWithoutClosure} fechamentos pendentes.`} />
        </>
      }
      aside={
        <Card className="border-zinc-200/80 bg-white/90 py-0 shadow-[0_12px_48px_rgba(15,23,42,0.08)]">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">Painel de Comando</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-zinc-950">{data.missionState.title}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Progresso</p>
                <p className="text-2xl font-black text-zinc-950">{data.missionState.progress}%</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <GamefulMetricCard icon={Users} label="Missões ativas" value={data.missionCounts.active} tone="light" compact className="border-zinc-200 bg-zinc-50/90 shadow-none" />
              <GamefulMetricCard icon={MessageSquare} label="Respostas no ciclo" value={data.missionCounts.replies} tone="light" compact className="border-zinc-200 bg-zinc-50/90 shadow-none" />
              <GamefulMetricCard icon={Flag} label="Encaminhamentos" value={data.missionCounts.referrals} tone="light" compact className="border-zinc-200 bg-zinc-50/90 shadow-none" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Avanço da missão do dia</p>
                <p className="text-sm font-black text-zinc-950">{data.missionState.progress}%</p>
              </div>
              <Progress value={data.missionState.progress} className="h-4 bg-zinc-200/70" indicatorClassName="bg-zinc-950" />
            </div>

            <div className="grid gap-2">
              {data.missionState.steps.slice(0, 4).map((step) => (
                <div key={step.id} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-2.5 w-2.5 rounded-full", step.isCompleted ? "bg-emerald-500" : step.isCritical ? "bg-amber-500" : "bg-zinc-300")} />
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{step.label}</p>
                      {step.hint ? <p className="text-xs text-zinc-500">{step.hint}</p> : null}
                    </div>
                  </div>
                  <Badge variant="outline" className="rounded-full border-zinc-300 bg-white text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
                    {step.isCompleted ? "Feita" : "Aberta"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
      <Card className="overflow-hidden border-zinc-200 bg-white py-0 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-950">
              <Sparkles className="h-5 w-5" />
              <h2 className="text-2xl font-black tracking-tight">Começar Jornada</h2>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-black text-zinc-950">{data.missionState.title}</p>
              <p className="max-w-2xl text-sm leading-6 text-zinc-600">{data.missionState.objective}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <SignalBadge icon={Target} label="Missões ativas" value={data.missionCounts.active} />
              <SignalBadge icon={MessageSquare} label="Respostas" value={data.missionCounts.replies} />
              <SignalBadge icon={Flag} label="Encaminhamentos" value={data.missionCounts.referrals} />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Próximo passo</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{data.missionState.progress}%</p>
              <Progress value={data.missionState.progress} className="mt-4 h-4 bg-zinc-200" indicatorClassName="bg-zinc-950" />
            </div>
            <Button className="mt-5 h-12 rounded-xl bg-zinc-950 font-black hover:bg-zinc-800" nativeButton={false} render={<Link href="/minha-fila" />}>
              Continuar Jornada
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-[24px] border border-zinc-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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
        <BeaconCard
          icon={Users}
          title="Sem responsável"
          value={data.systemAlerts.unassignedTasks}
          detail="Missões que ainda não têm dono claro."
          tone={data.systemAlerts.unassignedTasks > 0 ? "warning" : "healthy"}
          href="/abordagem?filter=sem_responsavel"
        />
        <BeaconCard
          icon={AlertTriangle}
          title="Tarefas paradas"
          value={data.systemAlerts.staleTasks}
          detail="Pendências sem movimento recente no ciclo."
          tone={data.systemAlerts.staleTasks > 0 ? "critical" : "healthy"}
          href="/abordagem"
        />
        <BeaconCard
          icon={MapPinned}
          title="Territórios pedindo ação"
          value={data.systemAlerts.territoriesNeedingAction}
          detail="Bairros sem atualização recente de mobilização."
          tone={data.systemAlerts.territoriesNeedingAction > 0 ? "warning" : "healthy"}
          href="/relatorios/territorios"
        />
        <BeaconCard
          icon={Flag}
          title="Campo sem fechamento"
          value={data.systemAlerts.fieldWithoutClosure}
          detail="Ações passadas que ainda precisam de devolutiva."
          tone={data.systemAlerts.fieldWithoutClosure > 0 ? "critical" : "healthy"}
          href="/campo"
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
          <CardContent className="grid gap-4 p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <TerritoryStat
              title="Mobilização"
              value={data.quickMap.counts.mobilizacao}
                detail={data.quickMap.highlights.mobilizacao?.detail ?? "Mapa ainda sem sinais."}
                neighborhood={data.quickMap.highlights.mobilizacao?.neighborhood ?? "Sem foco"}
              tone="amber"
            />
            <TerritoryStat
              title="Campo"
              value={data.quickMap.counts.campo}
                detail={data.quickMap.highlights.campo?.detail ?? "Sem campo planejado."}
                neighborhood={data.quickMap.highlights.campo?.neighborhood ?? "Sem foco"}
              tone="indigo"
            />
            <TerritoryStat
              title="Continuidade"
              value={data.quickMap.counts.continuidade}
                detail={data.quickMap.highlights.continuidade?.detail ?? "Ciclo em dia."}
                neighborhood={data.quickMap.highlights.continuidade?.neighborhood ?? "Sem foco"}
              tone="emerald"
            />
          </div>

          <div className="rounded-[24px] border border-zinc-200 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.04),_transparent_50%),linear-gradient(135deg,_rgba(248,250,252,1),_rgba(241,245,249,1))] p-5">
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

      <Card className="border-zinc-200 py-0 shadow-[0_16px_44px_rgba(15,23,42,0.06)]">
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
        <p className="max-w-2xl text-sm leading-6 text-zinc-500">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Button variant="outline" className="rounded-xl border-zinc-300 bg-white font-black text-zinc-800" nativeButton={false} render={<Link href={actionHref} />}>
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
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/90 p-3">
        <div className="flex items-center gap-2 text-zinc-500">
          <Icon className="h-4 w-4" />
          <p className="text-[9px] font-black uppercase tracking-[0.14em] leading-4">{label}</p>
        </div>
        <p className="mt-2 text-2xl font-black text-zinc-950">{value}</p>
      </div>
  );
}

function BeaconCard({
  icon: Icon,
  title,
  value,
  detail,
  tone,
  href,
}: {
  icon: typeof AlertTriangle;
  title: string;
  value: number;
  detail: string;
  tone: "healthy" | "warning" | "critical";
  href: string;
}) {
  const toneClass = {
    healthy: "border-emerald-200 bg-emerald-50/70",
    warning: "border-amber-200 bg-amber-50/70",
    critical: "border-rose-200 bg-rose-50/80",
  }[tone];

  const iconClass = {
    healthy: "text-emerald-600",
    warning: "text-amber-600",
    critical: "text-rose-600",
  }[tone];

  return (
    <Link href={href} className="block">
      <Card className={cn("h-full border py-0 transition-transform duration-200 hover:-translate-y-0.5", toneClass)}>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/70", iconClass)}>
              <Icon className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{title}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{value}</p>
          </div>
          <p className="text-sm leading-6 text-zinc-600">{detail}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function TerritoryStat({
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
  const toneClass = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }[tone];

  return (
    <div className={cn("rounded-[24px] border p-4", toneClass)}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em]">{title}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-4 truncate text-sm font-black">{neighborhood}</p>
      <p className="mt-1 text-sm leading-6 opacity-80">{detail}</p>
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
