import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { getFieldAgendaEvent, getFieldAgendaEventResult } from "@/lib/data/field-agenda";
import { listFieldEventVolunteers, listVolunteers } from "@/lib/data/volunteers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, CheckCircle2, Info, Clock, AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";
import { markEventDoneAction } from "./actions";
import { assignVolunteerToFieldEventAction, updateVolunteerEventStatusAction } from "@/app/voluntarios/actions";

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

export default async function FieldEventDetailPage({ params }: { params: { id: string } }) {
  const session = await requireInternalPageSession(`/campo/${params.id}`);
  
  const [event, result, volunteerLinks, volunteers] = await Promise.all([
    getFieldAgendaEvent(params.id),
    getFieldAgendaEventResult(params.id),
    listFieldEventVolunteers(params.id),
    listVolunteers(),
  ]);

  if (!event) notFound();

  const manageable = session.internalUser.role !== "leitura";
  const availableVolunteers = volunteers.filter((volunteer) => volunteer.status !== "arquivado" && !volunteerLinks.some((item) => item.volunteerId === volunteer.id));

  return (
    <AppShell>
      <PageHeader
        title={event.title}
        description={`Evento de campo: ${event.type.replace('_', ' ')}`}
      />

      <div className="mb-6 flex gap-2">
        <Button nativeButton={false} variant="outline" render={<Link href="/campo" />}>
          ← Voltar para Agenda
        </Button>
        {event.status === 'planned' && (
          <form action={markEventDoneAction.bind(null, event.id)}>
             <Button type="submit" variant="default">
               <CheckCircle2 className="mr-2 h-4 w-4" />
               Marcar como Concluído
             </Button>
          </form>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Status</p>
                  <Badge variant={event.status === 'done' ? 'default' : 'secondary'}>
                    {event.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Tipo</p>
                  <p className="text-sm font-medium">{event.type.replace('_', ' ')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Início</p>
                  <p className="text-sm font-medium">
                    {formatDate(event.startsAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Fim</p>
                  <p className="text-sm font-medium">
                    {formatDate(event.endsAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Localização</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{event.neighborhood || 'Bairro não definido'}</p>
                    <p className="text-xs text-muted-foreground">{event.locationText || 'Endereço não detalhado'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Descrição</p>
                <p className="text-sm whitespace-pre-wrap">{event.description || 'Sem descrição.'}</p>
              </div>
            </CardContent>
          </Card>

          {event.status === 'done' && (
            <Card className="border-green-200 bg-green-50/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Resultado da Ação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                       <p className="text-xs text-muted-foreground font-semibold uppercase">Resumo</p>
                       <p className="text-sm">{result.resultSummary}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <p className="text-xs text-muted-foreground font-semibold uppercase">Pessoas estimadas</p>
                         <p className="text-sm font-bold">{result.estimatedPeopleCount || 'N/A'}</p>
                      </div>
                    </div>
                    {result.nextSteps && (
                      <div className="space-y-1">
                         <p className="text-xs text-muted-foreground font-semibold uppercase">Próximos Passos</p>
                         <p className="text-sm italic">{result.nextSteps}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                     <p className="text-sm text-muted-foreground mb-4">O resultado ainda não foi registrado.</p>
                     <Button size="sm" variant="outline" render={<Link href={`/campo/${event.id}/resultado`} />}>
                        Registrar Resultado
                     </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Checklist de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-green-500" />
                  Pauta e Bairro definidos
                </li>
                <li className="flex items-center gap-2">
                   <div className="size-1.5 rounded-full bg-green-500" />
                   Foco em ação pública e coletiva
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                   <div className="size-1.5 rounded-full bg-slate-300" />
                   Aviso de privacidade preparado
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                   <div className="size-1.5 rounded-full bg-slate-300" />
                   Material de apoio com link de escuta
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Voluntários da ação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Organização interna apenas. Nenhum convite automático, nenhuma DM automática e nenhum vínculo com Instagram.
              </p>

              {volunteerLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum voluntário vinculado a esta ação.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Voluntário</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {volunteerLinks.map((volunteer) => (
                      <TableRow key={volunteer.volunteerId}>
                        <TableCell>
                          <Link href={`/voluntarios/${volunteer.volunteerId}`} className="underline">
                            {volunteer.displayName}
                          </Link>
                        </TableCell>
                        <TableCell>{volunteer.role ?? "-"}</TableCell>
                        <TableCell>{volunteer.status}</TableCell>
                        <TableCell>
                          {manageable ? (
                            <form action={updateVolunteerEventStatusAction} className="flex gap-2">
                              <input type="hidden" name="eventId" value={params.id} />
                              <input type="hidden" name="volunteerId" value={volunteer.volunteerId} />
                              <input type="hidden" name="returnTo" value={`/campo/${params.id}`} />
                              <select name="status" defaultValue={volunteer.status} className="flex h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm">
                                <option value="convidado">Convidado</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="presente">Presente</option>
                                <option value="ausente">Ausente</option>
                              </select>
                              <Button type="submit" variant="outline">Atualizar</Button>
                            </form>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {manageable && availableVolunteers.length > 0 ? (
                <form action={assignVolunteerToFieldEventAction} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <input type="hidden" name="eventId" value={params.id} />
                  <input type="hidden" name="returnTo" value={`/campo/${params.id}`} />
                  <select name="volunteerId" className="flex h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm" required>
                    <option value="">Adicionar voluntário</option>
                    {availableVolunteers.map((volunteer) => (
                      <option key={volunteer.id} value={volunteer.id}>{volunteer.displayName}</option>
                    ))}
                  </select>
                  <Input name="role" placeholder="Função na ação" />
                  <Button type="submit">Adicionar</Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Conexões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                 <p className="text-xs text-muted-foreground">Pauta</p>
                 {event.topicSlug ? (
                   <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">
                     {event.topicSlug}
                   </Badge>
                 ) : (
                   <span className="text-xs text-muted-foreground italic">Nenhuma pauta vinculada</span>
                 )}
              </div>
              <div className="space-y-1">
                 <p className="text-xs text-muted-foreground">Origem</p>
                 {event.sourceCorrectiveActionId ? (
                   <div className="flex flex-col gap-1">
                     <Badge variant="secondary" className="w-fit text-[10px]">Ação Corretiva</Badge>
                     <Link href={`/radar/silencios/acoes`} className="text-xs text-primary underline">
                        Ver no Radar
                     </Link>
                   </div>
                 ) : (
                   <span className="text-xs text-muted-foreground italic">Criação direta</span>
                 )}
              </div>
            </CardContent>
          </Card>

          <Alert className="border-amber-200 bg-amber-50/40">
             <AlertTriangle className="h-4 w-4 text-amber-600" />
             <AlertTitle className="text-xs">Guardrail Ativo</AlertTitle>
             <AlertDescription className="text-[10px] leading-tight">
                Não registre nomes, usernames ou telefones de participantes individuais. Registre apenas percepções coletivas e volume agregado.
             </AlertDescription>
          </Alert>
        </div>
      </div>
    </AppShell>
  );
}
