import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { getFieldAgendaEvent, getFieldAgendaEventResult } from "@/lib/data/field-agenda";
import { listFieldEventVolunteers, listVolunteers } from "@/lib/data/volunteers";
import { listPersonReferralsForEvent } from "@/lib/data/referrals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, CheckCircle2, Info, AlertTriangle, Users, Target, Zap, Heart } from "lucide-react";
import { notFound } from "next/navigation";
import { markEventDoneAction } from "./actions";
import { assignVolunteerToFieldEventAction, updateVolunteerEventStatusAction } from "@/app/voluntarios/actions";
import { EventParticipants } from "@/components/radar/field-agenda/event-participants";
import { getFieldJourneySnapshot } from "@/lib/data/field-agenda-journey";
import { FieldJourneyPanel } from "@/components/radar/field-agenda/field-journey-progress";
import { countStrategicMemoryLinksByEntity } from "@/lib/data/strategic-memory";
import { buildFieldResultMemoryHref } from "@/lib/field-memory/assisted-memory";

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

export default async function FieldEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireInternalPageSession(`/campo/${id}`);
  
  const [event, result, volunteerLinks, volunteers, participants] = await Promise.all([
    getFieldAgendaEvent(id),
    getFieldAgendaEventResult(id),
    listFieldEventVolunteers(id),
    listVolunteers(),
    listPersonReferralsForEvent(id),
  ]);

  if (!event) notFound();

  const manageable = session.internalUser.role !== "leitura";
  const availableVolunteers = volunteers.filter((volunteer) => volunteer.status !== "arquivado" && !volunteerLinks.some((item) => item.volunteerId === volunteer.id));

  const metrics = event.metrics || { totalInvited: 0, confirmed: 0, attended: 0, helped: 0, pendingConfirmation: 0 };
  const journey = getFieldJourneySnapshot(event, result);
  const resultMemoryLinks = result ? await countStrategicMemoryLinksByEntity("result", [result.id]) : {};
  const hasLinkedMemory = result ? (resultMemoryLinks[result.id] ?? 0) > 0 : false;
  const createMemoryHref = result ? buildFieldResultMemoryHref(event.id, result.id) : null;

  return (
    <AppShell>
      <PageHeader
        title={event.title}
        description={`Evento de campo: ${event.type.replace('_', ' ')}`}
      />

      <div className="mb-6 flex gap-2">
        <Button nativeButton={false} variant="outline" className="font-bold border-zinc-200" render={<Link href="/campo" />}>
          ← Voltar para Agenda
        </Button>
        {event.status === 'planned' && (
          <form action={markEventDoneAction.bind(null, event.id)}>
             <Button type="submit" variant="default" className="bg-emerald-600 hover:bg-emerald-700 font-bold">
               <CheckCircle2 className="mr-2 h-4 w-4" />
               Marcar como Concluído
             </Button>
          </form>
        )}
      </div>

      {journey.shouldShowClosureAlert && (
        <Alert className="mb-6 border-2 border-rust bg-rust/5 text-rust rounded-[2px] shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">
          <AlertTriangle className="h-4 w-4 text-rust" />
          <AlertTitle className="text-sm font-black uppercase text-rust">Fechamento pendente</AlertTitle>
          <AlertDescription className="text-xs font-semibold leading-relaxed">
            Esta ação precisa ser fechada para virar memória e aprendizado.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Métricas de Participação */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <Card className="bloco-concreto relative overflow-hidden py-0 bg-white">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black uppercase text-cement tracking-widest mb-1">Convidados</span>
                  <p className="text-2xl font-black text-charcoal">{metrics.totalInvited}</p>
                </CardContent>
             </Card>
             <Card className="bloco-concreto relative overflow-hidden py-0 bg-white">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black uppercase text-moss tracking-widest mb-1">Confirmados</span>
                  <p className="text-2xl font-black text-moss">{metrics.confirmed}</p>
                </CardContent>
             </Card>
             <Card className="bloco-concreto relative overflow-hidden py-0 bg-white">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black uppercase text-charcoal tracking-widest mb-1">Presentes</span>
                  <p className="text-2xl font-black text-charcoal">{metrics.attended}</p>
                </CardContent>
             </Card>
             <Card className="bloco-concreto relative overflow-hidden py-0 bg-white">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black uppercase text-burnt-yellow tracking-widest mb-1">Ajudaram</span>
                  <p className="text-2xl font-black text-charcoal">{metrics.helped}</p>
                </CardContent>
             </Card>
          </div>

          <Card className="bloco-concreto relative overflow-hidden py-0 bg-white">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="text-base font-black uppercase flex items-center gap-2 text-charcoal">
                <Target className="h-4 w-4 text-cement" />
                Interessados (Base Radar)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
               <EventParticipants 
                 eventId={event.id} 
                 initialParticipants={participants} 
                 manageable={manageable} 
               />
            </CardContent>
          </Card>

          <Card className="bloco-concreto relative overflow-hidden py-0 bg-white">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="text-base font-black uppercase flex items-center gap-2 text-charcoal">
                <Info className="h-4 w-4 text-cement" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-cement uppercase tracking-widest">Status</p>
                  <Badge variant={event.status === 'done' ? 'default' : 'secondary'} className="font-black uppercase text-[10px] rounded-[2px] border-2 border-black">
                    {event.status === 'done' ? 'Concluído' : event.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-cement uppercase tracking-widest">Tipo</p>
                  <p className="text-sm font-black text-charcoal">{event.type.replace('_', ' ')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-cement uppercase tracking-widest">Início</p>
                  <p className="text-sm font-semibold text-charcoal">
                    {formatDate(event.startsAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-cement uppercase tracking-widest">Fim</p>
                  <p className="text-sm font-semibold text-charcoal">
                    {formatDate(event.endsAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-cement/20">
                <p className="text-[10px] font-black text-cement uppercase tracking-widest">Localização</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-cement mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-charcoal">{event.neighborhood || 'Bairro não definido'}</p>
                    <p className="text-xs font-semibold text-cement">{event.locationText || 'Endereço não detalhado'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-cement/20">
                <p className="text-[10px] font-black text-cement uppercase tracking-widest">Descrição</p>
                <p className="text-xs font-semibold whitespace-pre-wrap leading-relaxed text-charcoal">{event.description || 'Sem descrição.'}</p>
              </div>
            </CardContent>
          </Card>

          {event.status === 'done' && (
            <Card className="bloco-concreto relative overflow-hidden py-0 border-moss bg-moss/5 text-charcoal">
              <CardHeader className="border-b-2 border-black bg-white">
                <CardTitle className="text-base font-black uppercase flex items-center gap-2 text-charcoal">
                  <CheckCircle2 className="h-4 w-4 text-moss" />
                  Resultado da Ação
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {result ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-cement uppercase tracking-widest">Resumo</p>
                       <p className="text-xs font-semibold leading-relaxed text-charcoal">{result.resultSummary}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-cement uppercase tracking-widest">Pessoas estimadas</p>
                         <p className="text-xl font-black text-charcoal">{result.estimatedPeopleCount || 'N/A'}</p>
                      </div>
                    </div>
                    {result.nextSteps && (
                      <div className="space-y-1.5 pt-2 bg-white p-3 rounded-[2px] border-2 border-black">
                         <p className="text-[10px] font-black text-charcoal uppercase tracking-widest mb-1 flex items-center gap-1">
                           <Zap className="h-3 w-3 text-burnt-yellow" /> Próximos Passos
                         </p>
                         <p className="text-xs font-semibold text-cement italic leading-relaxed">{result.nextSteps}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {!hasLinkedMemory && createMemoryHref ? (
                        <Button
                          size="sm"
                          className="h-10 bg-burnt-yellow text-charcoal border-2 border-black rounded-[2px] px-4 text-xs font-black uppercase tracking-wider hover:bg-burnt-yellow/90 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] transition-all"
                          nativeButton={false}
                          render={<Link href={createMemoryHref} />}
                        >
                          Criar memória deste resultado
                        </Button>
                      ) : (
                        <Badge variant="outline" className="rounded-[2px] border-2 border-black bg-white text-charcoal font-black uppercase text-[10px]">
                          Memória já vinculada
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                     <p className="text-xs text-cement mb-4 font-semibold italic">O resultado ainda não foi registrado.</p>
                     <Button size="sm" variant="outline" className="h-10 border-2 border-black bg-white text-charcoal font-black uppercase text-xs rounded-[2px] shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] hover:bg-burnt-yellow" nativeButton={false} render={<Link href={`/campo/${event.id}/resultado`} />}>
                        Registrar Resultado
                     </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="bloco-concreto relative overflow-hidden py-0 bg-white">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="text-base font-black uppercase text-charcoal">Equipe de Apoio (Voluntários)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <p className="text-xs text-charcoal/70 italic bg-charcoal/5 p-3 rounded-[2px] border-2 border-dashed border-cement">
                Esta seção é para organização da equipe interna. Pessoas interessadas vindas do Instagram devem ser gerenciadas na seção &quot;Interessados&quot;.
              </p>

              {volunteerLinks.length === 0 ? (
                <p className="text-sm text-cement py-4 text-center font-bold">Nenhum voluntário vinculado a esta ação.</p>
              ) : (
                <>
                  {/* Desktop View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b-2 border-black hover:bg-transparent">
                          <TableHead className="text-[10px] font-black uppercase text-charcoal">Voluntário</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-charcoal">Função</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-charcoal">Status</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {volunteerLinks.map((volunteer) => (
                          <TableRow key={volunteer.volunteerId} className="border-b border-cement/20 hover:bg-charcoal/5">
                            <TableCell>
                              <Link href={`/voluntarios/${volunteer.volunteerId}`} className="underline font-bold text-sm text-charcoal">
                                {volunteer.displayName}
                              </Link>
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-charcoal">{volunteer.role ?? "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider rounded-[2px] border-2 border-black bg-white text-charcoal">{volunteer.status}</Badge>
                            </TableCell>
                            <TableCell>
                              {manageable ? (
                                <form action={updateVolunteerEventStatusAction} className="flex gap-2">
                                  <input type="hidden" name="eventId" value={id} />
                                  <input type="hidden" name="volunteerId" value={volunteer.volunteerId} />
                                  <input type="hidden" name="returnTo" value={`/campo/${id}`} />
                                  <select name="status" defaultValue={volunteer.status} className="flex h-8 rounded-[2px] border-2 border-charcoal bg-off-white text-charcoal px-2.5 py-0.5 text-xs font-black uppercase">
                                    <option value="convidado">Convidado</option>
                                    <option value="confirmado">Confirmado</option>
                                    <option value="presente">Presente</option>
                                    <option value="ausente">Ausente</option>
                                  </select>
                                  <Button type="submit" variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase border-2 border-black rounded-[2px]">Atualizar</Button>
                                </form>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile View: Card list fallback */}
                  <div className="grid gap-3 md:hidden">
                    {volunteerLinks.map((volunteer) => (
                      <div key={volunteer.volunteerId} className="rounded-[2px] border-2 border-black bg-white p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <Link href={`/voluntarios/${volunteer.volunteerId}`} className="underline font-black text-sm text-charcoal">
                              {volunteer.displayName}
                            </Link>
                            <p className="text-xs font-semibold text-cement mt-1">Função: {volunteer.role ?? "-"}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider rounded-[2px] border-2 border-black bg-white text-charcoal">{volunteer.status}</Badge>
                        </div>
                        {manageable ? (
                          <form action={updateVolunteerEventStatusAction} className="flex flex-col gap-2 pt-2 border-t border-cement/10">
                            <input type="hidden" name="eventId" value={id} />
                            <input type="hidden" name="volunteerId" value={volunteer.volunteerId} />
                            <input type="hidden" name="returnTo" value={`/campo/${id}`} />
                            <div className="flex gap-2">
                              <select name="status" defaultValue={volunteer.status} className="flex-1 h-9 rounded-[2px] border-2 border-charcoal bg-off-white text-charcoal px-2 py-1 text-xs font-black uppercase">
                                <option value="convidado">Convidado</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="presente">Presente</option>
                                <option value="ausente">Ausente</option>
                              </select>
                              <Button type="submit" variant="outline" size="sm" className="h-9 text-[10px] font-black uppercase border-2 border-black rounded-[2px] px-4">Atualizar</Button>
                            </div>
                          </form>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {manageable && availableVolunteers.length > 0 ? (
                <form action={assignVolunteerToFieldEventAction} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] pt-4 border-t border-zinc-100">
                  <input type="hidden" name="eventId" value={id} />
                  <input type="hidden" name="returnTo" value={`/campo/${id}`} />
                  <select name="volunteerId" className="flex h-10 rounded-[2px] border-2 border-charcoal bg-off-white text-charcoal px-2.5 py-1 text-sm font-black uppercase" required>
                    <option value="">Vincular Equipe...</option>
                    {availableVolunteers.map((volunteer) => (
                      <option key={volunteer.id} value={volunteer.id}>{volunteer.displayName}</option>
                    ))}
                  </select>
                  <Input name="role" placeholder="Função na ação" className="font-bold h-10 rounded-[2px] border-2 border-charcoal bg-off-white" />
                  <Button type="submit" className="h-10 px-6 font-black uppercase text-xs tracking-widest bg-burnt-yellow text-charcoal border-2 border-black rounded-[2px] shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">Adicionar</Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <FieldJourneyPanel snapshot={journey} />

          <Card className="border-indigo-100 bg-indigo-50/10">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-indigo-600">Vínculos Territoriais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Pauta Principal</p>
                 {event.topicSlug ? (
                   <Badge className="bg-indigo-600 font-bold">
                     {event.topicSlug}
                   </Badge>
                 ) : (
                   <span className="text-xs text-muted-foreground italic">Nenhuma pauta vinculada</span>
                 )}
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Origem da Ação</p>
                 {event.sourceCorrectiveActionId ? (
                   <div className="flex flex-col gap-1">
                     <Badge variant="outline" className="w-fit text-[10px] font-bold border-indigo-200 text-indigo-700 bg-white">Ação Corretiva</Badge>
                     <Link href={`/radar/silencios/acoes`} className="text-xs text-indigo-600 underline font-bold mt-1 flex items-center gap-1">
                        Ver no Radar <ArrowRight className="h-3 w-3" />
                     </Link>
                   </div>
                 ) : (
                   <span className="text-xs text-muted-foreground italic">Planejamento Direto</span>
                 )}
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Próxima Ação Sugerida</p>
                 {event.status === "planned" ? (
                   <div className="bg-white p-3 rounded-lg border border-indigo-100 flex items-start gap-3">
                     <Users className="h-4 w-4 text-indigo-600 mt-0.5" />
                     <p className="text-xs font-bold text-zinc-700">Confirmar com todos os interessados no Instagram via DM.</p>
                   </div>
                 ) : (
                   <div className="bg-white p-3 rounded-lg border border-indigo-100 flex items-start gap-3">
                     <Heart className="h-4 w-4 text-indigo-600 mt-0.5" />
                     <p className="text-xs font-bold text-zinc-700">Aprofundar vínculo com quem esteve presente e ajudou.</p>
                   </div>
                 )}
              </div>
            </CardContent>
          </Card>

          <Alert className="border-rose-200 bg-rose-50/40">
             <AlertTriangle className="h-4 w-4 text-rose-600" />
             <AlertTitle className="text-xs font-black uppercase text-rose-900 tracking-tight">Regra Ética Radar</AlertTitle>
             <AlertDescription className="text-[11px] leading-tight font-medium text-rose-800">
                Não coletar ou armazenar usernames, fotos ou contatos de participantes coletivos sem consentimento explícito para voluntariado. 
                Foco no saldo qualitativo da escuta.
             </AlertDescription>
          </Alert>
        </div>
      </div>
    </AppShell>
  );
}

const Separator = () => <div className="h-px w-full bg-zinc-100 my-4" />;
const ArrowRight = ({ className }: { className?: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
