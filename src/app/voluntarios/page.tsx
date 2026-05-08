import Link from "next/link";
import AppShell from "@/components/app-shell";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManageContacts } from "@/lib/authz/roles";
import { getVolunteerStats, listSquads, listVolunteers, type VolunteerStatus } from "@/lib/data/volunteers";
import { getVolunteerReviewDashboard } from "@/lib/data/volunteer-review-dashboard";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { Users } from "lucide-react";
import { RadarPageHeader } from "@/components/radar/radar-page-header";


export const dynamic = "force-dynamic";

function parseVolunteerStatus(value: string | undefined): VolunteerStatus | undefined {
  if (!value) return undefined;
  return ["novo", "ativo", "pausado", "arquivado"].includes(value) ? (value as VolunteerStatus) : undefined;
}

export default async function VolunteersPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; status?: string; neighborhood?: string; skill?: string; availability?: string }>;
}) {
  const session = await requireInternalPageSession("/voluntarios");
  const resolvedSearchParams = await searchParams;
  const [stats, volunteers, squads] = await Promise.all([
    getVolunteerStats(),
    listVolunteers({
      search: resolvedSearchParams?.search,
      status: parseVolunteerStatus(resolvedSearchParams?.status),
      neighborhood: resolvedSearchParams?.neighborhood,
      skill: resolvedSearchParams?.skill,
      availability: resolvedSearchParams?.availability,
    }),
    listSquads(),
  ]);
  const reviewDashboard = await getVolunteerReviewDashboard();

  const canExportContacts = canManageContacts(session.internalUser.role);

  return (
    <AppShell>
      <RadarPageHeader
        eyebrow="Rede de Apoio"
        title="Base de Voluntários"
        description="Organize pessoas que consentiram explicitamente em ajudar. Este banco é separado da base do Instagram."
        actions={
          <div className="flex gap-2">
            <Button nativeButton={false} variant="outline" render={<Link href="/api/voluntarios/export" />}>
              Exportar seguro
            </Button>
            <Button nativeButton={false} variant="outline" render={<Link href="/voluntarios/inscricoes" />}>
              Ver inscrições
            </Button>
            {canExportContacts ? (
              <Button nativeButton={false} variant="outline" render={<Link href="/api/voluntarios/export?include_contact=true" />}>
                Exportar com contato
              </Button>
            ) : null}
            <Button nativeButton={false} className="bg-indigo-600 hover:bg-indigo-700 font-bold" render={<Link href="/voluntarios/novo" />}>
              Novo voluntário
            </Button>
          </div>
        }
      />


      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle>Total</CardTitle></CardHeader><CardContent className="text-3xl font-black">{stats.totalCount}</CardContent></Card>
        <Card><CardHeader><CardTitle>Novos</CardTitle></CardHeader><CardContent className="text-3xl font-black">{stats.newCount}</CardContent></Card>
        <Card><CardHeader><CardTitle>Ativos</CardTitle></CardHeader><CardContent className="text-3xl font-black">{stats.activeCount}</CardContent></Card>
        <Card><CardHeader><CardTitle>Pausados</CardTitle></CardHeader><CardContent className="text-3xl font-black">{stats.pausedCount}</CardContent></Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Busca e filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-5">
                <Input name="search" placeholder="Buscar por nome ou bairro" defaultValue={resolvedSearchParams?.search ?? ""} />
                <Input name="status" placeholder="Status" defaultValue={resolvedSearchParams?.status ?? ""} />
                <Input name="neighborhood" placeholder="Bairro" defaultValue={resolvedSearchParams?.neighborhood ?? ""} />
                <Input name="skill" placeholder="Habilidade" defaultValue={resolvedSearchParams?.skill ?? ""} />
                <Input name="availability" placeholder="Disponibilidade" defaultValue={resolvedSearchParams?.availability ?? ""} />
                <div className="md:col-span-5 flex gap-2">
                  <Button type="submit">Filtrar</Button>
                  <Button nativeButton={false} variant="outline" render={<Link href="/voluntarios" />}>
                    Limpar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Base consentida</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">

              {volunteers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-100">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-lg text-emerald-950 mb-2">Sua base consentida está vazia</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                    A base de voluntários reúne apenas pessoas que confirmaram consentimento e engajamento constante. Ninguém é importado do Instagram automaticamente.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button nativeButton={false} render={<Link href="/voluntarios/inscricoes" />}>
                      Revisar inscrições
                    </Button>
                    <Button variant="outline" nativeButton={false} render={<Link href="/pessoas" />}>
                      Buscar nas Pessoas Prioritárias
                    </Button>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Bairro</TableHead>
                      <TableHead>Habilidades</TableHead>
                      <TableHead>Disponibilidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {volunteers.map((volunteer) => (
                      <TableRow key={volunteer.id}>
                        <TableCell>
                          <Link href={`/voluntarios/${volunteer.id}`} className="font-semibold underline">
                            {volunteer.displayName}
                          </Link>
                        </TableCell>
                        <TableCell>{volunteer.neighborhood ?? "-"}</TableCell>
                        <TableCell>{volunteer.skills.join(", ") || "-"}</TableCell>
                        <TableCell>
                          {[...volunteer.availability.weekdays, ...volunteer.availability.periods].join(", ") || "-"}
                        </TableCell>
                        <TableCell><Badge variant="outline">{volunteer.status}</Badge></TableCell>
                        <TableCell>{volunteer.hasContact ? "Oculto por padrão" : "Sem contato"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Por habilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.skills.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : stats.skills.slice(0, 8).map(([label, count]) => <div key={label} className="flex justify-between text-sm"><span>{label}</span><strong>{count}</strong></div>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Por bairro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.neighborhoods.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : stats.neighborhoods.slice(0, 8).map(([label, count]) => <div key={label} className="flex justify-between text-sm"><span>{label}</span><strong>{count}</strong></div>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Por disponibilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.availability.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : stats.availability.slice(0, 8).map(([label, count]) => <div key={label} className="flex justify-between text-sm"><span>{label}</span><strong>{count}</strong></div>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revisão periódica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Pendentes +90d</span><strong>{reviewDashboard.pending90d.length}</strong></div>
              <div className="flex justify-between"><span>Elegíveis anonimização</span><strong>{reviewDashboard.rejectedEligible.length + reviewDashboard.archivedEligible.length}</strong></div>
              <div className="text-muted-foreground">Última rodada: {reviewDashboard.latestRound?.status ?? "nenhuma"}</div>
              <Button nativeButton={false} variant="outline" render={<Link href="/voluntarios/revisao-periodica" />}>
                Abrir revisão
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Squads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">{squads.length} squads cadastrados.</div>
              <Button nativeButton={false} variant="outline" render={<Link href="/voluntarios/squads" />}>
                Ver squads
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
