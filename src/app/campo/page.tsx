import Link from "next/link";
import AppShell from "@/components/app-shell";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listFieldAgendaEvents, listFieldAgendaEventResultsByEventIds } from "@/lib/data/field-agenda";
import { MapPin, Calendar, Plus, ArrowRight, History, Lightbulb, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { RadarPageHeader } from "@/components/radar/radar-page-header";
import { OperationalAlert } from "@/components/radar/operational-alert";
import { EmptyState } from "@/components/radar/empty-state";
import { getFieldJourneySnapshot } from "@/lib/data/field-agenda-journey";
import { FieldJourneyProgressCompact } from "@/components/radar/field-agenda/field-journey-progress";


export const dynamic = "force-dynamic";

function formatDate(date: string | null) {
  if (!date) return 'Não definido';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export default async function FieldAgendaPage() {
  await requireInternalPageSession("/campo");
  
  const events = await listFieldAgendaEvents({ includeMetrics: true });
  const eventResults = await listFieldAgendaEventResultsByEventIds(events.map((event) => event.id));
  const plannedEvents = events.filter(e => e.status === 'planned' || e.status === 'draft');
  const pastEvents = events.filter(e => e.status === 'done');

  const journeyByEventId = Object.fromEntries(
    events.map((event) => [event.id, getFieldJourneySnapshot(event, eventResults[event.id] || null)])
  );

  const totalParticipants = events.reduce((acc, e) => acc + (e.metrics?.attended || 0), 0);
  const totalInterested = events.reduce((acc, e) => acc + (e.metrics?.totalInvited || 0), 0);

  return (
    <AppShell>
      <RadarPageHeader
        eyebrow="Presença Territorial"
        title="Agenda de Campo"
        description="Organize rodas de escuta, reuniões de bairro e plenárias presenciais."
        actions={
          <div className="flex gap-2">
            <Button nativeButton={false} className="bg-indigo-600 hover:bg-indigo-700 font-bold shadow-sm" render={<Link href="/campo/novo" />}>
              <Plus className="mr-2 h-4 w-4" />
              Nova ação
            </Button>
            <Button nativeButton={false} variant="outline" className="font-bold border-zinc-200" render={<Link href="/radar/silencios" />}>
              <History className="mr-2 h-4 w-4" />
              Ações Sugeridas
            </Button>
          </div>
        }
      />

      <div className="mt-8 mb-8">
        <OperationalAlert 
          type="contato_recente" 
          message="Esta agenda organiza ações coletivas. Foco em fortalecer o vínculo em bairros e pautas do território."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-zinc-200 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4 bg-zinc-50/50 border-b border-zinc-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Próximos Eventos
              </CardTitle>
              <Badge variant="outline" className="font-black text-indigo-600 border-indigo-100 bg-white">{plannedEvents.length}</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {plannedEvents.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    type="no_data"
                    title="Nenhuma atividade planejada"
                    description="Organize rodas de escuta, reuniões de bairro ou plenárias presenciais para fortalecer o vínculo territorial."
                    primaryAction={
                      <Button nativeButton={false} className="font-bold" render={<Link href="/campo/novo" />}>
                        <Plus className="mr-2 h-4 w-4" /> Criar Primeiro Evento
                      </Button>
                    }
                    secondaryAction={
                      <Button variant="outline" className="font-bold" nativeButton={false} render={<Link href="/radar/silencios" />}>
                        Ver Radar de Silêncios
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {plannedEvents.map(event => (
                    <Link key={event.id} href={`/campo/${event.id}`}>
                      <div className="flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors group">
                        <div className="space-y-1">
                          <p className="font-black text-zinc-900 group-hover:text-indigo-600 transition-colors">{event.title}</p>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(event.startsAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-rose-500" />
                              {event.neighborhood || 'Bairro não definido'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden lg:block">
                            <FieldJourneyProgressCompact snapshot={journeyByEventId[event.id]} />
                          </div>
                          <div className="hidden md:flex flex-col items-end mr-2">
                             <span className="text-[10px] font-black text-zinc-400 uppercase">Interessados</span>
                             <span className="text-sm font-black text-zinc-900">{event.metrics?.totalInvited || 0}</span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-zinc-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico de Impacto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pastEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4">Nenhum evento concluído recentemente.</p>
              ) : (
                <div className="space-y-2">
                  {pastEvents.slice(0, 5).map(event => (
                    <Link key={event.id} href={`/campo/${event.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-50 bg-zinc-50/30 text-sm hover:border-zinc-200 transition-all">
                        <div className="space-y-2">
                          <span className="font-bold text-zinc-700 block">{event.title}</span>
                          <FieldJourneyProgressCompact snapshot={journeyByEventId[event.id]} />
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <div className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            <Users className="h-3 w-3" /> {event.metrics?.attended || 0}
                          </div>
                          <Badge variant="outline" className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 border-emerald-100">concluído</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-indigo-600 border-none text-white shadow-lg shadow-indigo-200">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-indigo-200">Engajamento de Campo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end justify-between">
                 <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">Total Presenças</p>
                   <p className="text-4xl font-black">{totalParticipants}</p>
                 </div>
                 <Users className="h-10 w-10 text-indigo-400/50 mb-1" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span>Interesse Digital</span>
                  <span>{totalInterested} pessoas</span>
                </div>
                <div className="h-1.5 w-full bg-indigo-800 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${Math.min((totalParticipants / (totalInterested || 1)) * 100, 100)}%` }} />
                </div>
                <p className="text-[10px] text-indigo-200 font-bold italic">Conversão de digital para campo: {totalInterested > 0 ? Math.round((totalParticipants / totalInterested) * 100) : 0}%</p>
              </div>

              <Separator className="bg-indigo-500/30" />
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">Bairros</p>
                    <p className="text-xl font-black">{new Set(events.map(e => e.neighborhood).filter(Boolean)).size}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">Pautas</p>
                    <p className="text-xl font-black">{new Set(events.map(e => e.topicSlug).filter(Boolean)).size}</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-700 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                Déficit Territorial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-amber-800 mb-4 leading-relaxed font-medium">
                O Radar de Silêncios identificou <strong>3 bairros</strong> com alto volume de reclamações mas nenhuma ação de campo nos últimos 15 dias.
              </p>
              <Button nativeButton={false} size="sm" variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest border-amber-200 bg-white hover:bg-amber-50 text-amber-700 h-10" render={<Link href="/radar/silencios" />}>
                Ver Bairros Prioritários →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
