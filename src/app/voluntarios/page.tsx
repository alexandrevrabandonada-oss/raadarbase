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
import { Users, PlusCircle, Heart, ShieldCheck, Clock } from "lucide-react";
import { RadarPageHeader } from "@/components/radar/radar-page-header";
import { ContextHelpCard } from "@/components/radar/context-help-card";
import { RadarMetricCard } from "@/components/radar/radar-metric-card";
import { OperationalAlert } from "@/components/radar/operational-alert";
import { GamefulEmptyState } from "@/components/radar/gameful-empty-state";
import { cn } from "@/lib/utils";


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
        description="Pessoas que consentiram explicitamente em ajudar. Este banco é separado da base do Instagram."
        actions={
          <div className="flex gap-2">
            <Button nativeButton={false} className="bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200" render={<Link href="/voluntarios/novo" />}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Voluntário
            </Button>
            <Button nativeButton={false} variant="outline" className="border-zinc-200" render={<Link href="/voluntarios/inscricoes" />}>
              Ver inscrições
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <RadarMetricCard label="Total Geral" value={stats.totalCount} icon={Users} tone="neutral" />
        <RadarMetricCard label="Aguardando Boas-vindas" value={stats.newCount} icon={Heart} tone="hot" />
        <RadarMetricCard label="Mobilizados" value={stats.activeCount} icon={ShieldCheck} tone="success" />
        <RadarMetricCard label="Em Pausa" value={stats.pausedCount} icon={Clock} tone="warning" />
      </div>

      <OperationalAlert 
        type="contato_manual" 
        className="mb-8 border-emerald-100 bg-emerald-50/50"
      >
        <p className="text-xs font-medium text-emerald-800">
          <strong>Lembrete Ético:</strong> Voluntários são pessoas que preencheram o formulário oficial ou confirmaram interesse em ajudar. Nunca use dados do Instagram para cadastrar voluntários sem consentimento direto.
        </p>
      </OperationalAlert>

      <ContextHelpCard 
        title="Como mobilizar voluntários"
        whatIsThis="Esta é a lista de cidadãos que levantaram a mão para ajudar ativamente na campanha."
        whyItMatters="É onde você encontra braços para ações presenciais, especialistas para pautas técnicas e apoio em bairros específicos."
        whatToDoNow="Filtre por bairro ou habilidade para encontrar o apoio necessário para um Plano de Ação ou Evento de Campo."
        className="mb-8"
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white ring-1 ring-zinc-100">
            <CardHeader className="pb-3 border-b border-zinc-50">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">Busca Estratégica</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form className="grid gap-3 md:grid-cols-5">
                <Input name="search" placeholder="Nome ou bairro" className="bg-zinc-50 border-zinc-100" defaultValue={resolvedSearchParams?.search ?? ""} />
                <Input name="status" placeholder="Status" className="bg-zinc-50 border-zinc-100" defaultValue={resolvedSearchParams?.status ?? ""} />
                <Input name="neighborhood" placeholder="Bairro" className="bg-zinc-50 border-zinc-100" defaultValue={resolvedSearchParams?.neighborhood ?? ""} />
                <Input name="skill" placeholder="Habilidade" className="bg-zinc-50 border-zinc-100" defaultValue={resolvedSearchParams?.skill ?? ""} />
                <Input name="availability" placeholder="Disponibilidade" className="bg-zinc-50 border-zinc-100" defaultValue={resolvedSearchParams?.availability ?? ""} />
                <div className="md:col-span-5 flex gap-2 pt-2">
                  <Button type="submit" className="bg-zinc-900 text-white hover:bg-zinc-800 px-8">Filtrar</Button>
                  <Button nativeButton={false} variant="outline" className="border-zinc-200" render={<Link href="/voluntarios" />}>
                    Limpar Filtros
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white ring-1 ring-zinc-100 overflow-hidden">
            <CardHeader className="pb-3 border-b border-zinc-50">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">Base Consentida</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">

              {volunteers.length === 0 ? (
                <div className="p-6">
                  <GamefulEmptyState
                    variant="field"
                    title="Nenhum voluntário ativo"
                    description="A base consentida ainda não recebeu inscrições ou confirmações suficientes para abrir uma frente de apoio."
                    nextActionLabel="revisar inscrições"
                    nextActionHref="/voluntarios/inscricoes"
                    secondaryAction={
                      <Button variant="outline" className="h-11 rounded-xl border-zinc-200 bg-white text-xs font-black uppercase tracking-[0.18em]" nativeButton={false} render={<Link href="/pessoas" />}>
                        Ver prioridades
                      </Button>
                    }
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-zinc-50/50">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Nome</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Bairro</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Habilidades</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Disponibilidade</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Status</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {volunteers.map((volunteer) => (
                      <TableRow key={volunteer.id} className="group hover:bg-zinc-50/50 transition-colors">
                        <TableCell className="py-4">
                          <Link href={`/voluntarios/${volunteer.id}`} className="font-black text-indigo-950 hover:text-indigo-600 transition-colors">
                            {volunteer.displayName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-zinc-600">{volunteer.neighborhood ?? "-"}</TableCell>
                        <TableCell className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{volunteer.skills.join(", ") || "-"}</TableCell>
                        <TableCell className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                          {[...volunteer.availability.weekdays, ...volunteer.availability.periods].join(", ") || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "font-black text-[9px] uppercase tracking-widest",
                            volunteer.status === 'ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                            volunteer.status === 'novo' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                          )}>
                            {volunteer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                           <Link href={`/voluntarios/${volunteer.id}`} className="text-xs font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                             Perfil →
                           </Link>
                        </TableCell>
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
              <CardTitle>Grupos de Trabalho</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">{squads.length} grupos cadastrados.</div>
              <Button nativeButton={false} variant="outline" render={<Link href="/voluntarios/squads" />}>
                Ver grupos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
