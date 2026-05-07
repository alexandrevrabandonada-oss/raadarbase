import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listFieldAgendaEvents } from "@/lib/data/field-agenda";
import { MapPin, Calendar, Plus, ArrowRight, History, Lightbulb } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
  
  const events = await listFieldAgendaEvents();
  const plannedEvents = events.filter(e => e.status === 'planned');
  const pastEvents = events.filter(e => e.status === 'done');

  return (
    <AppShell>
      <PageHeader
        title="Agenda de Campo"
        description="Organize e registre atividades presenciais e coletivas da pré-campanha: rodas de escuta, reuniões de bairro e plenárias."
      />

      <div className="mb-6 flex gap-2">
        <Button nativeButton={false} render={<Link href="/campo/novo" />}>
          <Plus className="mr-2 h-4 w-4" />
          Nova ação de campo
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/radar/silencios" />}>
          <History className="mr-2 h-4 w-4" />
          Radar de Silêncios
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/voluntarios/inscricoes" />}>
          Convidar voluntários consentidos
        </Button>
      </div>

      <Alert className="mb-8 border-blue-200 bg-blue-50/60">
        <AlertTitle>Ação Coletiva e Pública</AlertTitle>
        <AlertDescription>
          Esta agenda organiza ações de grupo. **Não use para listar alvos individuais ou abordagens personalizadas sem consentimento.** Foco em bairros e pautas agregadas.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Próximos Eventos
              </CardTitle>
              <Badge variant="secondary">{plannedEvents.length}</Badge>
            </CardHeader>
            <CardContent>
              {plannedEvents.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Nenhuma atividade planejada.</p>
                  <Button nativeButton={false} variant="link" render={<Link href="/campo/novo" />}>
                    Criar primeiro evento
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {plannedEvents.map(event => (
                    <Link key={event.id} href={`/campo/${event.id}`}>
                      <div className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                        <div className="space-y-1">
                          <p className="font-bold">{event.title}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(event.startsAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.neighborhood || 'Bairro não definido'}
                            </span>
                          </div>
                          <div className="mt-2 flex gap-1">
                             <Badge variant="outline" className="text-[10px]">{event.type.replace('_', ' ')}</Badge>
                             {event.topicSlug && <Badge variant="secondary" className="text-[10px]">{event.topicSlug}</Badge>}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                Histórico Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pastEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nenhum evento concluído recentemente.</p>
              ) : (
                <div className="space-y-3">
                  {pastEvents.slice(0, 5).map(event => (
                    <Link key={event.id} href={`/campo/${event.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-md border border-slate-100 bg-slate-50/50 text-sm">
                        <span>{event.title}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-muted-foreground">{event.neighborhood}</span>
                           <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">concluído</Badge>
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
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Resumo Territorial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                 <span className="text-sm text-muted-foreground">Bairros com ação</span>
                 <span className="font-bold">{new Set(events.map(e => e.neighborhood).filter(Boolean)).size}</span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-sm text-muted-foreground">Pautas abordadas</span>
                 <span className="font-bold">{new Set(events.map(e => e.topicSlug).filter(Boolean)).size}</span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-sm text-muted-foreground">Total de eventos</span>
                 <span className="font-bold">{events.length}</span>
              </div>
              <Separator />
              <div className="pt-2">
                <p className="text-xs font-semibold mb-2">Tipos de Atividade</p>
                <div className="flex flex-wrap gap-1">
                   {['roda_escuta', 'reuniao', 'panfletagem'].map(t => (
                     <Badge key={t} variant="outline" className="text-[10px]">{t.replace('_', ' ')}</Badge>
                   ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                Sugestões do Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-amber-800 mb-3">
                O Radar de Silêncios sugere ações em bairros com baixa participação.
              </p>
              <Button nativeButton={false} size="sm" variant="outline" className="w-full text-xs" render={<Link href="/radar/silencios" />}>
                Ver sugestões →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
