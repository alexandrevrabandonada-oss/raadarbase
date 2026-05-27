import Link from "next/link";
import AppShell from "@/components/app-shell";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  await requireInternalPageSession("/voluntarios");
  const resolvedSearchParams = await searchParams;
  const [stats, volunteers, squads, reviewDashboard] = await Promise.all([
    getVolunteerStats(),
    listVolunteers({
      search: resolvedSearchParams?.search,
      status: parseVolunteerStatus(resolvedSearchParams?.status),
      neighborhood: resolvedSearchParams?.neighborhood,
      skill: resolvedSearchParams?.skill,
      availability: resolvedSearchParams?.availability,
    }),
    listSquads(),
    getVolunteerReviewDashboard(),
  ]);

  return (
    <AppShell>
      <RadarPageHeader
        eyebrow="Rede de Apoio"
        title="Base de Voluntários"
        description="Pessoas que consentiram explicitamente em ajudar. Este banco é separado da base do Instagram."
        compact
        actions={
          <div className="flex flex-wrap gap-2">
            <Button nativeButton={false} className="bg-burnt-yellow text-charcoal border-2 border-black rounded-[2px] shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] hover:bg-burnt-yellow/90 font-black text-xs uppercase tracking-wider" render={<Link href="/voluntarios/novo" />}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Voluntário
            </Button>
            <Button nativeButton={false} variant="outline" className="border-2 border-black bg-white font-black text-charcoal rounded-[2px] hover:bg-charcoal/5 text-xs uppercase tracking-wider" render={<Link href="/voluntarios/inscricoes" />}>
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
        className="mb-8 border-2 border-moss bg-moss/5 rounded-[2px]"
      >
        <p className="text-xs font-semibold text-moss">
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[2.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="bloco-concreto bg-white">
            <CardHeader className="pb-3 border-b-2 border-black">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-charcoal">Busca Estratégica</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form className="grid gap-3 md:grid-cols-5">
                <Input name="search" placeholder="Nome ou bairro" className="bg-charcoal/5 border-2 border-black rounded-[2px] text-charcoal font-semibold" defaultValue={resolvedSearchParams?.search ?? ""} />
                <Input name="status" placeholder="Status" className="bg-charcoal/5 border-2 border-black rounded-[2px] text-charcoal font-semibold" defaultValue={resolvedSearchParams?.status ?? ""} />
                <Input name="neighborhood" placeholder="Bairro" className="bg-charcoal/5 border-2 border-black rounded-[2px] text-charcoal font-semibold" defaultValue={resolvedSearchParams?.neighborhood ?? ""} />
                <Input name="skill" placeholder="Habilidade" className="bg-charcoal/5 border-2 border-black rounded-[2px] text-charcoal font-semibold" defaultValue={resolvedSearchParams?.skill ?? ""} />
                <Input name="availability" placeholder="Disponibilidade" className="bg-charcoal/5 border-2 border-black rounded-[2px] text-charcoal font-semibold" defaultValue={resolvedSearchParams?.availability ?? ""} />
                <div className="md:col-span-5 flex gap-2 pt-2">
                  <Button type="submit" className="bg-charcoal text-white hover:bg-charcoal/90 rounded-[2px] border-2 border-black font-black uppercase text-xs tracking-wider">Filtrar</Button>
                  <Button nativeButton={false} variant="outline" className="border-2 border-black bg-white font-black text-charcoal rounded-[2px] hover:bg-charcoal/5 text-xs uppercase tracking-wider" render={<Link href="/voluntarios" />}>
                    Limpar Filtros
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bloco-concreto bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b-2 border-black">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-charcoal">Base Consentida</CardTitle>
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
                      <Button variant="outline" className="h-11 rounded-[2px] border-2 border-black bg-white text-xs font-black uppercase tracking-[0.18em]" nativeButton={false} render={<Link href="/pessoas" />}>
                        Ver prioridades
                      </Button>
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-3 p-4 lg:hidden">
                    {volunteers.map((volunteer) => (
                      <Link key={volunteer.id} href={`/voluntarios/${volunteer.id}`} className="block">
                        <Card className="bloco-concreto bg-white">
                          <CardContent className="space-y-3 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-base font-black text-charcoal">{volunteer.displayName}</p>
                                <p className="truncate text-xs text-cement font-semibold">{volunteer.neighborhood ?? "Sem bairro"}</p>
                              </div>
                              <Badge
                                className={cn(
                                  "shrink-0 rounded-[2px] border-2 border-black font-black text-[9px] uppercase tracking-widest",
                                  volunteer.status === "ativo"
                                    ? "bg-moss/10 text-moss"
                                    : volunteer.status === "novo"
                                      ? "bg-burnt-yellow/10 text-charcoal"
                                      : "bg-charcoal/10 text-charcoal",
                                )}
                              >
                                {volunteer.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-cement">
                              <span>{volunteer.skills.slice(0, 3).join(", ") || "Sem habilidade"}</span>
                              <span>{[...volunteer.availability.weekdays, ...volunteer.availability.periods].slice(0, 2).join(", ") || "Sem disponibilidade"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-xs pt-1 border-t border-black/10">
                              <span className="text-cement font-semibold">Perfil consentido</span>
                              <span className="font-black text-charcoal">Abrir →</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                  <div className="hidden lg:block">
                    <Table>
                      <TableHeader className="bg-charcoal/5 border-b-2 border-black">
                        <TableRow>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Nome</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Bairro</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Habilidades</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Disponibilidade</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Status</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {volunteers.map((volunteer) => (
                          <TableRow key={volunteer.id} className="group hover:bg-charcoal/5 border-b border-black/10 transition-colors">
                            <TableCell className="py-4">
                              <Link href={`/voluntarios/${volunteer.id}`} className="font-black text-charcoal hover:underline">
                                {volunteer.displayName}
                              </Link>
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-charcoal">{volunteer.neighborhood ?? "-"}</TableCell>
                            <TableCell className="text-[10px] font-bold text-cement uppercase tracking-tighter">{volunteer.skills.join(", ") || "-"}</TableCell>
                            <TableCell className="text-[10px] font-bold text-cement uppercase tracking-tighter">
                              {[...volunteer.availability.weekdays, ...volunteer.availability.periods].join(", ") || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn(
                                "font-black text-[9px] uppercase tracking-widest rounded-[2px] border-2 border-black",
                                volunteer.status === 'ativo' ? 'bg-moss/10 text-moss' : 
                                volunteer.status === 'novo' ? 'bg-burnt-yellow/10 text-charcoal' : 'bg-charcoal/10 text-charcoal'
                              )}>
                                {volunteer.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                               <Link href={`/voluntarios/${volunteer.id}`} className="text-xs font-black text-charcoal opacity-0 group-hover:opacity-100 transition-opacity">
                                 Perfil →
                               </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bloco-concreto bg-white">
            <CardHeader className="pb-3 border-b-2 border-black">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-charcoal">Por habilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {stats.skills.length === 0 ? <p className="text-sm text-cement">Sem dados.</p> : stats.skills.slice(0, 8).map(([label, count]) => <div key={label} className="flex justify-between text-sm text-charcoal font-semibold"><span>{label}</span><strong>{count}</strong></div>)}
            </CardContent>
          </Card>

          <Card className="bloco-concreto bg-white">
            <CardHeader className="pb-3 border-b-2 border-black">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-charcoal">Por bairro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {stats.neighborhoods.length === 0 ? <p className="text-sm text-cement">Sem dados.</p> : stats.neighborhoods.slice(0, 8).map(([label, count]) => <div key={label} className="flex justify-between text-sm text-charcoal font-semibold"><span>{label}</span><strong>{count}</strong></div>)}
            </CardContent>
          </Card>

          <Card className="bloco-concreto bg-white">
            <CardHeader className="pb-3 border-b-2 border-black">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-charcoal">Por disponibilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {stats.availability.length === 0 ? <p className="text-sm text-cement">Sem dados.</p> : stats.availability.slice(0, 8).map(([label, count]) => <div key={label} className="flex justify-between text-sm text-charcoal font-semibold"><span>{label}</span><strong>{count}</strong></div>)}
            </CardContent>
          </Card>

          <Card className="bloco-concreto bg-white">
            <CardHeader className="pb-3 border-b-2 border-black">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-charcoal">Revisão periódica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm text-charcoal font-semibold">
              <div className="flex justify-between"><span>Pendentes +90d</span><strong>{reviewDashboard.pending90d.length}</strong></div>
              <div className="flex justify-between"><span>Elegíveis anonimização</span><strong>{reviewDashboard.rejectedEligible.length + reviewDashboard.archivedEligible.length}</strong></div>
              <div className="text-xs text-cement font-medium">Última rodada: {reviewDashboard.latestRound?.status ?? "nenhuma"}</div>
              <Button nativeButton={false} variant="outline" className="border-2 border-black bg-white font-black text-charcoal rounded-[2px] hover:bg-charcoal/5 text-xs uppercase tracking-wider w-full" render={<Link href="/voluntarios/revisao-periodica" />}>
                Abrir revisão
              </Button>
            </CardContent>
          </Card>

          <Card className="bloco-concreto bg-white">
            <CardHeader className="pb-3 border-b-2 border-black">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-charcoal">Grupos de Trabalho</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="text-sm text-cement font-semibold">{squads.length} grupos cadastrados.</div>
              <Button nativeButton={false} variant="outline" className="border-2 border-black bg-white font-black text-charcoal rounded-[2px] hover:bg-charcoal/5 text-xs uppercase tracking-wider w-full" render={<Link href="/voluntarios/squads" />}>
                Ver grupos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
