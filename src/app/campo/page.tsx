import Link from "next/link";
import AppShell from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listFieldAgendaEvents, listFieldAgendaEventResultsByEventIds } from "@/lib/data/field-agenda";
import {
  MapPin,
  Plus,
  ArrowRight,
  Sparkles,
  ClipboardCheck,
  Megaphone,
} from "lucide-react";
import { RadarPageHeader } from "@/components/radar/radar-page-header";
import { FieldMissionCard } from "@/components/radar/field-mission-card";
import { GamefulEmptyState } from "@/components/radar/gameful-empty-state";
import { GamefulHero } from "@/components/radar/gameful-hero";
import { GamefulMetricCard } from "@/components/radar/gameful-metric-card";
import { getFieldJourneySnapshot } from "@/lib/data/field-agenda-journey";
import { FieldJourneyProgressCompact } from "@/components/radar/field-agenda/field-journey-progress";
import { countStrategicMemoryLinksByEntity } from "@/lib/data/strategic-memory";
import { buildFieldMemoryLoop } from "@/lib/field-memory/field-memory-loop";

export const dynamic = "force-dynamic";

function formatDate(date: string | null) {
  if (!date) return "Não definido";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function FieldAgendaPage() {
  await requireInternalPageSession("/campo");

  const events = await listFieldAgendaEvents({ includeMetrics: true });
  const eventResults = await listFieldAgendaEventResultsByEventIds(events.map((event) => event.id));
  const resultMemoryLinks = await countStrategicMemoryLinksByEntity(
    "result",
    Object.values(eventResults).map((result) => result.id),
  );
  const journeys = Object.fromEntries(
    events.map((event) => [event.id, getFieldJourneySnapshot(event, eventResults[event.id] || null)]),
  );
  const fieldLoop = buildFieldMemoryLoop({
    events,
    resultsByEventId: eventResults,
    resultMemoryLinksByResultId: resultMemoryLinks,
  });

  const activeEvents = events.filter((event) => event.status === "planned" || event.status === "draft");
  const completedEvents = events.filter((event) => event.status === "done");

  const totals = events.reduce(
    (acc, event) => {
      acc.invites += event.metrics?.totalInvited ?? 0;
      acc.confirmed += event.metrics?.confirmed ?? 0;
      acc.attended += event.metrics?.attended ?? 0;
      acc.followUp += journeys[event.id]?.hasFollowUpTasks ? 1 : 0;
      return acc;
    },
    { invites: 0, confirmed: 0, attended: 0, followUp: 0 },
  );

  const nextMission = activeEvents[0] ?? null;
  const loopPriorityMission = fieldLoop.missions[0] ?? null;

  return (
    <AppShell>
      <RadarPageHeader
        eyebrow="Presença Territorial"
        title="Missões de Campo"
        description="Jornadas de campanha no território, da convocação ao follow-up."
        actions={
          <div className="flex gap-2">
            <Button nativeButton={false} className="bg-[#d39b2a] font-bold text-[#11202a] shadow-sm hover:bg-[#e0aa3b]" render={<Link href="/campo/novo" />}>
              <Plus className="mr-2 h-4 w-4" />
              Nova missão
            </Button>
            <Button nativeButton={false} variant="outline" className="border-[#d8c7ac] bg-[#f7f0e4] font-bold text-[#11202a]" render={<Link href="/territorios" />}>
              <MapPin className="mr-2 h-4 w-4" />
              Ver mapa
            </Button>
          </div>
        }
      />

      <div className="mt-8 space-y-8">
        <GamefulHero
          eyebrow="Jornada territorial"
          title="Missões de Campo"
          description="Cada ação de campo vira uma missão de campanha com progresso explícito: convidar, confirmar, realizar, registrar presença e sustentar follow-up no território."
          icon={<Sparkles className="h-5 w-5 text-white" />}
          variant="field"
          titleClassName="radar-title-display max-w-[8ch] text-5xl sm:text-6xl"
          metrics={
            <>
              <GamefulMetricCard label="Missões ativas" value={activeEvents.length} tone="dark" />
              <GamefulMetricCard label="Convites" value={totals.invites} tone="dark" />
              <GamefulMetricCard label="Confirmações" value={totals.confirmed} tone="dark" />
              <GamefulMetricCard label="Presenças" value={totals.attended} tone="dark" />
            </>
          }
          aside={
            <div className="space-y-4 rounded-[28px] border border-white/10 bg-black/15 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">Próxima missão</p>
              {nextMission || loopPriorityMission ? (
                <>
                  <h3 className="text-2xl font-black tracking-tight text-white">
                    {loopPriorityMission ? loopPriorityMission.title : nextMission!.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {nextMission ? (
                      <Badge className="border border-white/10 bg-white/10 text-white hover:bg-white/10">
                        {nextMission.neighborhood || "Território em definição"}
                      </Badge>
                    ) : null}
                    <Badge className="border border-white/10 bg-white/10 text-white hover:bg-white/10">
                      {loopPriorityMission ? "Loop aberto" : journeys[nextMission!.id].currentPhaseLabel}
                    </Badge>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">Próximo passo</p>
                    <p className="mt-2 text-sm font-black text-indigo-200">
                      {loopPriorityMission ? loopPriorityMission.recommendedAction : journeys[nextMission!.id].nextStep}
                    </p>
                  </div>
                  <Button
                    nativeButton={false}
                    className="h-12 bg-[#d39b2a] px-6 text-xs font-black uppercase tracking-wider text-[#11202a] hover:bg-[#e0aa3b]"
                    render={<Link href={loopPriorityMission?.href ?? `/campo/${nextMission!.id}`} />}
                  >
                    Abrir missão <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-2xl font-black tracking-tight text-white">Sem campo planejado</h3>
                  <p className="text-sm font-medium leading-6 text-zinc-300">
                    Nenhuma missão presencial está aberta agora. O campo depende de território, contexto e confirmação humana.
                  </p>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">Próximo passo</p>
                    <p className="mt-2 text-sm font-black text-emerald-200">Preparar a base: revisar territórios quentes ou abrir a próxima missão presencial.</p>
                  </div>
                  <Button
                    nativeButton={false}
                    className="h-12 bg-[#d39b2a] px-6 text-xs font-black uppercase tracking-wider text-[#11202a] hover:bg-[#e0aa3b]"
                    render={<Link href="/campo/novo" />}
                  >
                    Criar missão <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          }
        />

        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Missões ativas</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">Campo em andamento</h3>
            </div>
            <Button nativeButton={false} variant="outline" className="border-[#d8c7ac] bg-[#f7f0e4] font-black text-[#11202a]" render={<Link href={nextMission ? `/campo/${nextMission.id}` : "/campo/novo"} />}>
              {nextMission ? "Fechar ciclo" : "Criar missão"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {activeEvents.length === 0 ? (
            <div className="rounded-[30px] border border-zinc-100 bg-white p-6 shadow-sm">
              {fieldLoop.missions.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Ciclo ainda aberto</p>
                  <h4 className="text-2xl font-black tracking-tight text-zinc-950">{fieldLoop.missions[0].title}</h4>
                  <p className="text-sm leading-6 text-zinc-600">{fieldLoop.missions[0].description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button nativeButton={false} className="bg-[#0f1b24] font-black text-white hover:bg-[#172733]" render={<Link href={fieldLoop.missions[0].href} />}>
                      Fechar ciclo
                    </Button>
                    <Button nativeButton={false} variant="outline" className="border-zinc-200 bg-white text-xs font-black uppercase tracking-[0.18em]" render={<Link href="/memoria" />}>
                      Abrir memória
                    </Button>
                  </div>
                </div>
              ) : (
                <GamefulEmptyState
                  variant="field"
                  title="Nenhuma missão ativa"
                  description="Sem campo planejado. A campanha ainda não abriu uma ação presencial com convites, confirmações e follow-up."
                  nextActionLabel="criar missão de campo"
                  nextActionHref="/campo/novo"
                  secondaryAction={
                    <Button nativeButton={false} variant="outline" className="h-11 rounded-xl border-zinc-200 bg-white text-xs font-black uppercase tracking-[0.18em]" render={<Link href="/relatorios/territorios" />}>
                      Ver mapa
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {activeEvents.map((event) => {
                const journey = journeys[event.id];
                return (
                  <FieldMissionCard
                    key={event.id}
                    href={`/campo/${event.id}`}
                    title={event.title}
                    neighborhood={event.neighborhood}
                    phaseLabel={journey.currentPhaseLabel}
                    dateLabel={formatDate(event.startsAt)}
                    nextStep={journey.nextStep}
                    progress={<FieldJourneyProgressCompact snapshot={journey} />}
                    metrics={[
                      { label: "Convites", value: event.metrics?.totalInvited ?? 0 },
                      { label: "Confirmações", value: event.metrics?.confirmed ?? 0 },
                      { label: "Presença", value: event.metrics?.attended ?? 0 },
                      { label: "Ajuda", value: event.metrics?.helped ?? 0 },
                      { label: "Follow-up", value: journey.hasFollowUpTasks ? "Ativo" : "Pendente" },
                    ]}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Loop do campo</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">Travas e continuidade</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Campo sem fechamento",
                value: fieldLoop.stats.fieldWithoutClosureCount,
                detail: "Evento passado sem resultado ou sem memória vinculada.",
              },
              {
                label: "Confirmação pendente",
                value: fieldLoop.stats.pendingConfirmationCount,
                detail: "Interessados em campo ainda pedindo confirmação manual.",
              },
              {
                label: "Follow-up pendente",
                value: fieldLoop.stats.pendingFollowUpCount,
                detail: "Presença registrada sem próximo passo explícito.",
              },
            ].map((item) => (
              <Card key={item.label} className="radar-outline-card border-[#d8c7ac] bg-[rgba(255,250,242,0.92)] py-0 shadow-sm">
                <CardContent className="space-y-3 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7759]">{item.label}</p>
                  <p className="text-3xl font-black text-zinc-950">{item.value}</p>
                  <p className="text-sm leading-6 text-zinc-600">{item.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="radar-outline-card rounded-[30px] border-[#d8c7ac] bg-[rgba(255,250,242,0.92)] shadow-sm">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-[#b47a0e]" />
                <h3 className="text-lg font-black text-zinc-950">Leitura da jornada</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  { label: "Planejar", count: events.filter((event) => journeys[event.id].currentPhase === "planejar").length },
                  { label: "Convidar", count: events.filter((event) => journeys[event.id].currentPhase === "convidar").length },
                  { label: "Confirmar", count: events.filter((event) => journeys[event.id].currentPhase === "confirmar").length },
                  { label: "Realizar/Registrar", count: events.filter((event) => journeys[event.id].currentPhase === "realizar" || journeys[event.id].currentPhase === "registrar").length },
                  { label: "Follow-up", count: events.filter((event) => journeys[event.id].currentPhase === "follow_up").length },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[#d8c7ac] bg-white/75 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7759]">{item.label}</p>
                    <p className="mt-2 text-2xl font-black text-zinc-950">{item.count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="radar-outline-card rounded-[30px] border-[#d8c7ac] bg-[rgba(255,250,242,0.92)] shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-[#b47a0e]" />
                <h3 className="text-lg font-black text-zinc-950">Fechamento de ciclo</h3>
              </div>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-[#d8c7ac] bg-white/75 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7759]">Convites pendentes</p>
                  <p className="mt-2 text-2xl font-black text-zinc-950">{Math.max(totals.invites - totals.confirmed, 0)}</p>
                </div>
                <div className="rounded-2xl border border-[#d8c7ac] bg-white/75 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7759]">Memória pendente</p>
                  <p className="mt-2 text-2xl font-black text-zinc-950">{fieldLoop.stats.resultsWithoutMemoryCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Memória sugerida</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">O que o campo precisa guardar</h3>
          </div>

          {fieldLoop.memorySuggestions.length === 0 ? (
            <Card className="rounded-[30px] border-zinc-100 shadow-sm">
              <CardContent className="p-6">
                <GamefulEmptyState
                  variant="memory"
                  compact
                  title="Sem memória pendente do campo"
                  description="Quando o campo fecha com resultado e memória, o próximo ciclo começa com mais contexto."
                  nextActionLabel="abrir memória"
                  nextActionHref="/memoria"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {fieldLoop.memorySuggestions.slice(0, 4).map((suggestion) => (
                <Card key={`${suggestion.type}-${suggestion.title}`} className="radar-outline-card border-[#d8c7ac] bg-[rgba(255,250,242,0.92)] py-0 shadow-sm">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline" className="border-[#d8c7ac] bg-white/75 text-[10px] font-black uppercase tracking-[0.16em] text-[#8b7759]">
                        {suggestion.type.replaceAll("_", " ")}
                      </Badge>
                      <span className="text-xs font-semibold text-zinc-500">{suggestion.sourceCount} sinais</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black tracking-tight text-zinc-950">{suggestion.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-zinc-600">{suggestion.summary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button nativeButton={false} className="bg-[#0f1b24] font-black text-white hover:bg-[#172733]" render={<Link href={suggestion.href} />}>
                        Abrir memória
                      </Button>
                      {suggestion.sourceHref ? (
                        <Button nativeButton={false} variant="outline" className="border-[#d8c7ac] bg-[#f7f0e4] font-black text-[#11202a]" render={<Link href={suggestion.sourceHref} />}>
                          Ver origem
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Ciclos fechados</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">Missões concluídas e continuidade</h3>
          </div>

          <div className="grid gap-4">
            {completedEvents.length === 0 ? (
              <Card className="rounded-[30px] border-zinc-100 shadow-sm">
                <CardContent className="p-6">
                  <GamefulEmptyState
                    variant="memory"
                    compact
                    title="Nenhum fechamento recente"
                    description="Ainda não há missão concluída para compor a memória recente do campo."
                    nextActionLabel="fechar o próximo ciclo"
                  />
                </CardContent>
              </Card>
            ) : (
              completedEvents.slice(0, 5).map((event) => (
                <FieldMissionCard
                  key={event.id}
                  href={`/campo/${event.id}`}
                  title={event.title}
                  neighborhood={event.neighborhood}
                  phaseLabel="Concluída"
                  dateLabel={formatDate(event.startsAt)}
                  nextStep={
                    eventResults[event.id] && !(resultMemoryLinks[eventResults[event.id].id] ?? 0)
                      ? "Resultado salvo. Memória do campo ainda pendente."
                      : `Missão fechada com ${event.metrics?.attended ?? 0} presenças registradas.`
                  }
                  completed
                  progress={<div className="hidden md:block"><FieldJourneyProgressCompact snapshot={journeys[event.id]} /></div>}
                  metrics={[
                    { label: "Presenças", value: event.metrics?.attended ?? 0 },
                    { label: "Confirmações", value: event.metrics?.confirmed ?? 0 },
                    { label: "Convites", value: event.metrics?.totalInvited ?? 0 },
                  ]}
                  className="hover:border-emerald-200"
                />
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
