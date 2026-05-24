import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { RadarPageHeader } from "@/components/radar/radar-page-header";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManageContacts } from "@/lib/authz/roles";
import { listFieldAgendaEvents } from "@/lib/data/field-agenda";
import { getVolunteer, listSquads } from "@/lib/data/volunteers";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import {
  addVolunteerToSquadAction,
  archiveVolunteerAction,
  assignVolunteerToFieldEventAction,
  pauseVolunteerAction,
  removeVolunteerFromSquadAction,
  updateVolunteerEventStatusAction,
} from "@/app/voluntarios/actions";

export const dynamic = "force-dynamic";

export default async function VolunteerDetailPage({ params }: { params: { id: string } }) {
  const session = await requireInternalPageSession(`/voluntarios/${params.id}`);
  const includeContact = canManageContacts(session.internalUser.role);
  const [detail, squads, events] = await Promise.all([
    getVolunteer(params.id, { includeContact }),
    listSquads(),
    listFieldAgendaEvents(),
  ]);

  if (!detail) notFound();

  const manageable = session.internalUser.role !== "leitura";
  const availableSquads = squads.filter((squad) => !detail.squads.some((item) => item.squadId === squad.id && item.membershipStatus !== "removido"));
  const availableEvents = events.filter((event) => !detail.fieldEvents.some((item) => item.eventId === event.id));

  return (
    <AppShell>
      <RadarPageHeader
        eyebrow="Base Consentida"
        title={detail.volunteer.displayName}
        description="Detalhe seguro de voluntário para organização interna, sem microtargeting e sem vínculo automático com Instagram."
        compact
        actions={
          manageable ? (
            <div className="flex flex-wrap gap-2">
              <Button nativeButton={false} variant="outline" className="w-full sm:w-auto font-bold border-zinc-200" render={<Link href={`/voluntarios/${params.id}/editar`} />}>
                Editar
              </Button>
              <form action={pauseVolunteerAction.bind(null, params.id)}>
                <Button type="submit" variant="outline" className="w-full sm:w-auto font-bold border-zinc-200">Pausar</Button>
              </form>
              <form action={archiveVolunteerAction.bind(null, params.id)}>
                <Button type="submit" variant="outline" className="w-full sm:w-auto font-bold border-zinc-200">Arquivar</Button>
              </form>
            </div>
          ) : null
        }
      />


      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Dados básicos</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div><p className="text-xs text-muted-foreground">Bairro</p><p>{detail.volunteer.neighborhood ?? "-"}</p></div>
              <div><p className="text-xs text-muted-foreground">Cidade</p><p>{detail.volunteer.city ?? "-"}</p></div>
              <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline">{detail.volunteer.status}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Origem</p><p>{detail.volunteer.source}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Habilidades e disponibilidade</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><p className="text-xs text-muted-foreground">Habilidades</p><p>{detail.volunteer.skills.join(", ") || "-"}</p></div>
              <div><p className="text-xs text-muted-foreground">Disponibilidade</p><p>{[...detail.volunteer.availability.weekdays, ...detail.volunteer.availability.periods].join(", ") || "-"}</p></div>
              <div><p className="text-xs text-muted-foreground">Observações</p><p>{detail.volunteer.availability.notes ?? "-"}</p></div>
              <div><p className="text-xs text-muted-foreground">Interesses</p><p>{detail.volunteer.interests.join(", ") || "-"}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Squads</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {detail.squads.length === 0 ? <p className="text-sm text-muted-foreground">Sem squads vinculadas.</p> : (
                <>
                  <div className="space-y-3 lg:hidden">
                    {detail.squads.map((membership) => (
                      <Card key={membership.squadId} className="border border-zinc-200 bg-white shadow-sm">
                        <CardContent className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link href={`/voluntarios/squads/${membership.squadId}`} className="truncate text-sm font-black text-indigo-950">
                                {membership.squadName}
                              </Link>
                              <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                                {membership.role ?? "Sem função"}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0 text-[9px] font-black uppercase tracking-widest">
                              {membership.membershipStatus}
                            </Badge>
                          </div>
                          {manageable ? (
                            <form action={removeVolunteerFromSquadAction}>
                              <input type="hidden" name="squadId" value={membership.squadId} />
                              <input type="hidden" name="volunteerId" value={detail.volunteer.id} />
                              <input type="hidden" name="returnTo" value={`/voluntarios/${detail.volunteer.id}`} />
                              <Button type="submit" variant="outline" className="w-full">Remover</Button>
                            </form>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="hidden lg:block">
                <Table>
                  <TableHeader><TableRow><TableHead>Squad</TableHead><TableHead>Função</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
                    {detail.squads.map((membership) => (
                      <TableRow key={membership.squadId}>
                        <TableCell><Link href={`/voluntarios/squads/${membership.squadId}`} className="underline">{membership.squadName}</Link></TableCell>
                        <TableCell>{membership.role ?? "-"}</TableCell>
                        <TableCell>{membership.membershipStatus}</TableCell>
                        <TableCell>
                          {manageable ? (
                            <form action={removeVolunteerFromSquadAction}>
                              <input type="hidden" name="squadId" value={membership.squadId} />
                              <input type="hidden" name="volunteerId" value={detail.volunteer.id} />
                              <input type="hidden" name="returnTo" value={`/voluntarios/${detail.volunteer.id}`} />
                              <Button type="submit" variant="outline">Remover</Button>
                            </form>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                  </div>
                </>
              )}

              {manageable && availableSquads.length > 0 ? (
                <form action={addVolunteerToSquadAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input type="hidden" name="volunteerId" value={detail.volunteer.id} />
                  <input type="hidden" name="returnTo" value={`/voluntarios/${detail.volunteer.id}`} />
                  <select name="squadId" className="flex h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm" required>
                    <option value="">Selecionar squad</option>
                    {availableSquads.map((squad) => <option key={squad.id} value={squad.id}>{squad.name}</option>)}
                  </select>
                  <Input name="role" placeholder="Função na squad" />
                  <Button type="submit">Adicionar</Button>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Eventos de campo vinculados</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {detail.fieldEvents.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma ação de campo vinculada.</p> : (
                <>
                  <div className="space-y-3 lg:hidden">
                    {detail.fieldEvents.map((event) => (
                      <Card key={event.eventId} className="border border-zinc-200 bg-white shadow-sm">
                        <CardContent className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link href={`/campo/${event.eventId}`} className="truncate text-sm font-black text-indigo-950">
                                {event.title}
                              </Link>
                              <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                                {event.role ?? "Sem função"}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0 text-[9px] font-black uppercase tracking-widest">
                              {event.volunteerStatus}
                            </Badge>
                          </div>
                          {manageable ? (
                            <form action={updateVolunteerEventStatusAction} className="grid gap-2">
                              <input type="hidden" name="eventId" value={event.eventId} />
                              <input type="hidden" name="volunteerId" value={detail.volunteer.id} />
                              <input type="hidden" name="returnTo" value={`/voluntarios/${detail.volunteer.id}`} />
                              <select name="status" defaultValue={event.volunteerStatus} className="flex h-9 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm">
                                <option value="convidado">Convidado</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="presente">Presente</option>
                                <option value="ausente">Ausente</option>
                                <option value="removido">Removido</option>
                              </select>
                              <Button type="submit" variant="outline">Atualizar</Button>
                            </form>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="hidden lg:block">
                <Table>
                  <TableHeader><TableRow><TableHead>Ação</TableHead><TableHead>Status</TableHead><TableHead>Função</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
                    {detail.fieldEvents.map((event) => (
                      <TableRow key={event.eventId}>
                        <TableCell><Link href={`/campo/${event.eventId}`} className="underline">{event.title}</Link></TableCell>
                        <TableCell>{event.volunteerStatus}</TableCell>
                        <TableCell>{event.role ?? "-"}</TableCell>
                        <TableCell>
                          {manageable ? (
                            <form action={updateVolunteerEventStatusAction} className="flex gap-2">
                              <input type="hidden" name="eventId" value={event.eventId} />
                              <input type="hidden" name="volunteerId" value={detail.volunteer.id} />
                              <input type="hidden" name="returnTo" value={`/voluntarios/${detail.volunteer.id}`} />
                              <select name="status" defaultValue={event.volunteerStatus} className="flex h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm">
                                <option value="convidado">Convidado</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="presente">Presente</option>
                                <option value="ausente">Ausente</option>
                                <option value="removido">Removido</option>
                              </select>
                              <Button type="submit" variant="outline">Atualizar</Button>
                            </form>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                  </div>
                </>
              )}

              {manageable && availableEvents.length > 0 ? (
                <form action={assignVolunteerToFieldEventAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input type="hidden" name="volunteerId" value={detail.volunteer.id} />
                  <input type="hidden" name="returnTo" value={`/voluntarios/${detail.volunteer.id}`} />
                  <select name="eventId" className="flex h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm" required>
                    <option value="">Selecionar ação de campo</option>
                    {availableEvents.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
                  </select>
                  <Input name="role" placeholder="Função na ação" />
                  <Button type="submit">Vincular</Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Consentimentos</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Armazenamento</span><strong>{detail.volunteer.consentToStoreData ? "Sim" : "Não"}</strong></div>
              <div className="flex justify-between"><span>Contato</span><strong>{detail.volunteer.consentToContact ? "Sim" : "Não"}</strong></div>
              <div className="flex justify-between"><span>Preferência</span><strong>{detail.volunteer.contactPreference}</strong></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contato</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {includeContact ? (
                <>
                  <div><p className="text-xs text-muted-foreground">E-mail</p><p>{detail.volunteer.contactEmail ?? "-"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Telefone</p><p>{detail.volunteer.contactPhone ?? "-"}</p></div>
                </>
              ) : (
                <p className="text-muted-foreground">Contato oculto. Só admin e operador autorizados veem telefone ou e-mail.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Histórico seguro</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Criado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(detail.volunteer.createdAt))}</p>
              <p>Última atualização em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(detail.volunteer.updatedAt))}</p>
              <p>Squads ativas: {detail.squads.length}</p>
              <p>Ações de campo vinculadas: {detail.fieldEvents.length}</p>
              <p>Sem score político, sem classificação individual e sem automação de DM.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
