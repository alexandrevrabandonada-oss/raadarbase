import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSquad, listVolunteers } from "@/lib/data/volunteers";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { addVolunteerToSquadAction, removeVolunteerFromSquadAction } from "@/app/voluntarios/actions";

export const dynamic = "force-dynamic";

export default async function SquadDetailPage({ params }: { params: { id: string } }) {
  await requireInternalPageSession(`/voluntarios/squads/${params.id}`);
  const [detail, volunteers] = await Promise.all([getSquad(params.id), listVolunteers()]);
  if (!detail) notFound();

  const availableVolunteers = volunteers.filter((volunteer) => !detail.members.some((member) => member.volunteerId === volunteer.id));

  return (
    <AppShell>
      <PageHeader title={detail.squad.name} description="Membros, funções e ações de campo associadas por vínculo operacional." />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Membros</CardTitle></CardHeader>
          <CardContent>
            {detail.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum membro nesta squad.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Voluntário</TableHead><TableHead>Função</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {detail.members.map((member) => (
                    <TableRow key={member.volunteerId}>
                      <TableCell><Link href={`/voluntarios/${member.volunteerId}`} className="underline">{member.displayName}</Link></TableCell>
                      <TableCell>{member.role ?? "-"}</TableCell>
                      <TableCell>{member.membershipStatus}</TableCell>
                      <TableCell>
                        <form action={removeVolunteerFromSquadAction}>
                          <input type="hidden" name="squadId" value={detail.squad.id} />
                          <input type="hidden" name="volunteerId" value={member.volunteerId} />
                          <input type="hidden" name="returnTo" value={`/voluntarios/squads/${detail.squad.id}`} />
                          <Button type="submit" variant="outline">Remover</Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Adicionar membro</CardTitle></CardHeader>
            <CardContent>
              <form action={addVolunteerToSquadAction} className="space-y-3">
                <input type="hidden" name="squadId" value={detail.squad.id} />
                <input type="hidden" name="returnTo" value={`/voluntarios/squads/${detail.squad.id}`} />
                <select name="volunteerId" className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm" required>
                  <option value="">Selecionar voluntário</option>
                  {availableVolunteers.map((volunteer) => <option key={volunteer.id} value={volunteer.id}>{volunteer.displayName}</option>)}
                </select>
                <Input name="role" placeholder="Função na squad" />
                <Button type="submit">Adicionar</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Ações vinculadas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {detail.fieldEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma ação de campo ligada ainda.</p>
              ) : (
                detail.fieldEvents.map((event) => (
                  <div key={event.eventId} className="rounded-md border p-3 text-sm">
                    <Link href={`/campo/${event.eventId}`} className="font-semibold underline">{event.title}</Link>
                    <p className="text-muted-foreground">{event.neighborhood ?? "Sem bairro"} · {event.volunteerCount} voluntários</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}