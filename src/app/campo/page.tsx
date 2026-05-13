import Link from "next/link";
import AppShell from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listFieldAgendaEvents, listFieldAgendaEventResultsByEventIds } from "@/lib/data/field-agenda";
import {
  MapPin,
  Calendar,
  Plus,
  History,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ClipboardCheck,
  Megaphone,
} from "lucide-react";
import { RadarPageHeader } from "@/components/radar/radar-page-header";
import { EmptyState } from "@/components/radar/empty-state";
import { getFieldJourneySnapshot } from "@/lib/data/field-agenda-journey";
import { FieldJourneyProgressCompact } from "@/components/radar/field-agenda/field-journey-progress";

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
  const journeys = Object.fromEntries(
    events.map((event) => [event.id, getFieldJourneySnapshot(event, eventResults[event.id] || null)]),
  );

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

  return (
    <AppShell>
      <RadarPageHeader
        eyebrow="Presença Territorial"
        title="Missões de Campo"
        description="Jornadas de campanha no território, da convocação ao follow-up."
        actions={
          <div className="flex gap-2">
            <Button nativeButton={false} className="bg-indigo-600 hover:bg-indigo-700 font-bold shadow-sm" render={<Link href="/campo/novo" />}>
              <Plus className="mr-2 h-4 w-4" />
              Nova missão
            </Button>
            <Button nativeButton={false} variant="outline" className="font-bold border-zinc-200" render={<Link href="/territorios" />}>
              <MapPin className="mr-2 h-4 w-4" />
              Ver mapa
            </Button>
          </div>
        }
      />

      <div className="mt-8 space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-zinc-900/10 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_24%),linear-gradient(145deg,#09090b_0%,#18181b_58%,#27272a_100%)] p-8 text-white shadow-2xl shadow-zinc-200/50">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Jornada territorial</p>
                  <h2 className="mt-1 text-4xl font-black tracking-tight text-white">Missões de Campo</h2>
                </div>
              </div>

              <p className="max-w-3xl text-base font-medium leading-relaxed text-zinc-300">
                Cada ação de campo vira uma missão de campanha com progresso explícito: convidar, confirmar, realizar, registrar presença e sustentar follow-up no território.
              </p>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="border border-white/10 bg-white/5 text-white shadow-none">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Missões ativas</p>
                    <p className="mt-2 text-3xl font-black">{activeEvents.length}</p>
                  </CardContent>
                </Card>
                <Card className="border border-white/10 bg-white/5 text-white shadow-none">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Convites</p>
                    <p className="mt-2 text-3xl font-black">{totals.invites}</p>
                  </CardContent>
                </Card>
                <Card className="border border-white/10 bg-white/5 text-white shadow-none">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Confirmações</p>
                    <p className="mt-2 text-3xl font-black">{totals.confirmed}</p>
                  </CardContent>
                </Card>
                <Card className="border border-white/10 bg-white/5 text-white shadow-none">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Presenças</p>
                    <p className="mt-2 text-3xl font-black">{totals.attended}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Próxima missão</p>
              {nextMission ? (
                <>
                  <h3 className="text-2xl font-black tracking-tight text-white">{nextMission.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border border-white/10 bg-white/10 text-white hover:bg-white/10">
                      {nextMission.neighborhood || "Território em definição"}
                    </Badge>
                    <Badge className="border border-white/10 bg-white/10 text-white hover:bg-white/10">
                      {journeys[nextMission.id].currentPhaseLabel}
                    </Badge>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Próximo passo</p>
                    <p className="mt-2 text-sm font-black text-indigo-200">{journeys[nextMission.id].nextStep}</p>
                  </div>
                  <Button
                    nativeButton={false}
                    className="h-12 bg-indigo-600 px-6 text-xs font-black uppercase tracking-wider hover:bg-indigo-700"
                    render={<Link href={`/campo/${nextMission.id}`} />}
                  >
                    Abrir missão <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <p className="text-sm font-medium text-zinc-300">Nenhuma missão ativa no momento.</p>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[30px] border-zinc-200 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-indigo-600" />
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
                  <div key={item.label} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-black text-zinc-950">{item.count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border-zinc-200 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                <h3 className="text-lg font-black text-zinc-950">Fechamento de ciclo</h3>
              </div>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Convites pendentes</p>
                  <p className="mt-2 text-2xl font-black text-zinc-950">{Math.max(totals.invites - totals.confirmed, 0)}</p>
                </div>
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Missões com follow-up</p>
                  <p className="mt-2 text-2xl font-black text-zinc-950">{totals.followUp}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Missões ativas</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">Campo em andamento</h3>
            </div>
          </div>

          {activeEvents.length === 0 ? (
            <div className="rounded-[30px] border border-zinc-100 bg-white p-6 shadow-sm">
              <EmptyState
                type="no_data"
                title="Nenhuma missão de campo aberta"
                description="Crie uma missão territorial para conectar mobilização, presença e follow-up."
                primaryAction={
                  <Button nativeButton={false} className="font-bold" render={<Link href="/campo/novo" />}>
                    <Plus className="mr-2 h-4 w-4" /> Criar missão
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {activeEvents.map((event) => {
                const journey = journeys[event.id];
                return (
                  <Link key={event.id} href={`/campo/${event.id}`}>
                    <Card className="h-full rounded-[30px] border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-xl">
                      <CardContent className="space-y-5 p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50">{journey.currentPhaseLabel}</Badge>
                              {event.neighborhood ? (
                                <Badge variant="outline" className="border-zinc-200 text-zinc-600">
                                  <MapPin className="mr-1 h-3 w-3" /> {event.neighborhood}
                                </Badge>
                              ) : null}
                            </div>
                            <h4 className="mt-3 text-xl font-black tracking-tight text-zinc-950">{event.title}</h4>
                            <p className="mt-1 text-sm font-medium text-zinc-500">{formatDate(event.startsAt)}</p>
                          </div>
                          <FieldJourneyProgressCompact snapshot={journey} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Convites</p>
                            <p className="mt-2 text-lg font-black text-zinc-950">{event.metrics?.totalInvited ?? 0}</p>
                          </div>
                          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Confirmações</p>
                            <p className="mt-2 text-lg font-black text-zinc-950">{event.metrics?.confirmed ?? 0}</p>
                          </div>
                          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Presença</p>
                            <p className="mt-2 text-lg font-black text-zinc-950">{event.metrics?.attended ?? 0}</p>
                          </div>
                          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Ajuda</p>
                            <p className="mt-2 text-lg font-black text-zinc-950">{event.metrics?.helped ?? 0}</p>
                          </div>
                          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Follow-up</p>
                            <p className="mt-2 text-lg font-black text-zinc-950">{journey.hasFollowUpTasks ? "Ativo" : "Pendente"}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-500">Próximo passo da missão</p>
                          <p className="mt-2 text-sm font-black text-indigo-950">{journey.nextStep}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
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
                <CardContent className="p-6 text-sm font-medium text-zinc-500">
                  Nenhuma missão concluída recentemente.
                </CardContent>
              </Card>
            ) : (
              completedEvents.slice(0, 5).map((event) => (
                <Link key={event.id} href={`/campo/${event.id}`}>
                  <Card className="rounded-[30px] border-zinc-100 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                    <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Concluída
                          </Badge>
                          {event.neighborhood ? (
                            <Badge variant="outline" className="border-zinc-200 text-zinc-600">
                              {event.neighborhood}
                            </Badge>
                          ) : null}
                        </div>
                        <h4 className="mt-3 text-lg font-black text-zinc-950">{event.title}</h4>
                        <p className="mt-1 text-sm font-medium text-zinc-500">{formatDate(event.startsAt)}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="hidden md:block">
                          <FieldJourneyProgressCompact snapshot={journeys[event.id]} />
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-zinc-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                          <Users className="h-3 w-3" /> {event.metrics?.attended ?? 0} presenças
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
