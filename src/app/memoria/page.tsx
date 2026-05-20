import AppShell from "@/components/app-shell";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listStrategicMemories } from "@/lib/data/strategic-memory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Search, Calendar, MapPin, ArrowRight, Plus, Scroll } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { MemoryNavActions } from "./memory-nav-actions";
import { RadarPageHeader } from "@/components/radar/radar-page-header";
import { listFieldAgendaEvents, listFieldAgendaEventResultsByEventIds } from "@/lib/data/field-agenda";
import { countStrategicMemoryLinksByEntity, getStrategicMemoryStats } from "@/lib/data/strategic-memory";
import { getTeamFlowAdoptionMetrics } from "@/lib/data/team-flow-adoption";
import { getPilotFeedbackLoop } from "@/lib/data/pilot-feedback-loop";
import { buildFieldMemoryLoop } from "@/lib/field-memory/field-memory-loop";
import { GamefulEmptyState } from "@/components/radar/gameful-empty-state";
import { MemoryEngineSuggestionCard } from "./memory-engine-suggestion-card";

export const dynamic = "force-dynamic";


export default async function MemoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tema?: string }>;
}) {
  await requireInternalPageSession("/memoria");
  const { q, tema } = await searchParams;

  const memories = await listStrategicMemories({
    search: q,
    topic_id: tema,
  });
  const [events, teamAdoption, feedbackLoop, memoryStats] = await Promise.all([
    listFieldAgendaEvents({ includeMetrics: true }),
    getTeamFlowAdoptionMetrics(),
    getPilotFeedbackLoop(),
    getStrategicMemoryStats(),
  ]);
  const eventResults = await listFieldAgendaEventResultsByEventIds(events.map((event) => event.id));
  const resultMemoryLinks = await countStrategicMemoryLinksByEntity(
    "result",
    Object.values(eventResults).map((result) => result.id),
  );
  const fieldMemoryLoop = buildFieldMemoryLoop({
    events,
    resultsByEventId: eventResults,
    resultMemoryLinksByResultId: resultMemoryLinks,
    weeklyClosuresGenerated: teamAdoption.indicators.dailyClosuresGenerated,
    feedbackLoop,
  });

  return (
    <AppShell>
      <RadarPageHeader
        eyebrow="Biblioteca de Saberes"
        title="Memória da Guilda"
        description="O acúmulo de sabedoria e crônicas táticas para guiar nossas próximas incursões no território."
        compact
        actions={
          <div className="flex flex-wrap gap-2">
            <Button nativeButton={false} className="bg-amber-700 hover:bg-amber-800 text-white font-black uppercase text-xs tracking-wider" render={<Link href="/memoria/nova" />}>
              <Plus className="mr-2 h-4 w-4" />
              Forjar Pergaminho
            </Button>
            <MemoryNavActions />
          </div>
        }
      />

      <div className="mt-8 space-y-6">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-amber-200 bg-[#faf6ee] shadow-sm">
            <CardHeader className="pb-3 border-b border-amber-200/50">
              <CardTitle className="text-xs font-black uppercase tracking-[0.24em] text-amber-800 flex items-center gap-1.5">
                <Scroll className="h-4 w-4 text-amber-600 animate-pulse" />
                Sussurros do Painel (Sugestões)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {fieldMemoryLoop.memorySuggestions.length === 0 ? (
                <GamefulEmptyState
                  variant="memory"
                  compact
                  title="Biblioteca em silêncio"
                  description="Todos os registros de campo e fechamentos semanais já foram sintetizados em pergaminhos."
                  nextActionLabel="ver memória ativa"
                  nextActionHref="/memoria"
                />
              ) : (
                <div className="grid gap-3">
                  {fieldMemoryLoop.memorySuggestions.slice(0, 5).map((suggestion) => (
                    <MemoryEngineSuggestionCard key={suggestion.id} suggestion={suggestion} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-[#faf6ee] shadow-sm">
            <CardHeader className="pb-3 border-b border-amber-200/50">
              <CardTitle className="text-xs font-black uppercase tracking-[0.24em] text-amber-800">
                Crônicas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4">
              <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-500">Rascunhos atípicos</p>
                <p className="mt-2 text-3xl font-black text-[#3c2f2f]">{memoryStats.draftCount}</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-500">Campo sem registro</p>
                <p className="mt-2 text-3xl font-black text-[#3c2f2f]">{fieldMemoryLoop.stats.resultsWithoutMemoryCount}</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-500">Relatos da semana</p>
                <p className="mt-2 text-3xl font-black text-[#3c2f2f]">{teamAdoption.indicators.dailyClosuresGenerated}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-amber-200 bg-[#faf6ee] shadow-sm">
          <CardContent className="pt-6">
            <form className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <Input
                  name="q"
                  placeholder="Buscar em saberes, títulos ou territórios..."
                  className="pl-9 bg-white border-amber-200/80 focus-visible:ring-amber-600 text-stone-800 font-medium"
                  defaultValue={q}
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto bg-amber-800 hover:bg-amber-900 text-white font-bold uppercase text-xs tracking-wider px-6">
                Consultar
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {memories.length === 0 ? (
            <Card className="border-amber-200 bg-[#faf6ee]">
              <CardContent className="py-12 text-center">
                <p className="text-stone-500 font-semibold">Nenhum pergaminho de memória encontrado para os filtros atuais.</p>
                <Link href="/memoria/nova" className={buttonVariants({ variant: "link", className: "mt-2 text-amber-700 font-black uppercase text-xs" })}>
                  Comece registrando o primeiro aprendizado
                </Link>
              </CardContent>
            </Card>
          ) : (
            memories.map((memory) => (
              <Link key={memory.id} href={`/memoria/${memory.id}`} className="group block">
                <Card className="relative overflow-hidden border-[#d4c3a3] bg-gradient-to-br from-[#fdfbf7] to-[#f4ecd8] hover:border-amber-600 transition-all duration-300 shadow-md hover:shadow-lg rounded-2xl p-6">
                  {/* Decorative corner accents */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#d4c3a3]/60 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#d4c3a3]/60 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#d4c3a3]/60 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#d4c3a3]/60 rounded-br-lg" />

                  <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200/80">
                          <Scroll className="h-3 w-3 text-amber-700" />
                          {memory.topic?.name || "Sabedoria Geral"}
                        </span>
                        {memory.territory && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">
                            <MapPin className="h-3 w-3 text-stone-500" />
                            {memory.territory}
                          </span>
                        )}
                      </div>

                      <CardTitle className="text-lg font-black text-[#3c2f2f] group-hover:text-amber-800 transition-colors mt-2 leading-snug">
                        {memory.title}
                      </CardTitle>

                      <p className="text-xs text-stone-600 font-medium italic line-clamp-2 leading-relaxed pl-3 border-l-2 border-amber-600/30">
                        &quot;{memory.summary}&quot;
                      </p>
                    </div>

                    {/* Virtual Wax Seal */}
                    <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                      {memory.status === 'active' ? (
                        <div className="relative flex items-center justify-center w-12 h-12 bg-red-700 hover:bg-red-800 text-white rounded-full border-4 border-red-800 shadow-md transform rotate-6 group-hover:rotate-12 transition-transform duration-300">
                          {/* Inner seal pattern */}
                          <div className="absolute inset-1 rounded-full border border-dashed border-red-400 flex items-center justify-center text-[8px] font-black tracking-tighter">
                            ★
                          </div>
                          <span className="text-[7px] font-black uppercase tracking-wider text-red-100 absolute bottom-1">ATIVA</span>
                        </div>
                      ) : (
                        <div className="relative flex items-center justify-center w-12 h-12 bg-stone-500 hover:bg-stone-600 text-white rounded-full border-4 border-stone-600 shadow-md transform -rotate-3 group-hover:rotate-3 transition-transform duration-300">
                          <div className="absolute inset-1 rounded-full border border-dashed border-stone-300 flex items-center justify-center text-[8px] font-black tracking-tighter">
                            ●
                          </div>
                          <span className="text-[6px] font-black uppercase tracking-wider text-stone-100 absolute bottom-1.5">ARQUIVO</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#d4c3a3]/30 flex items-center justify-between text-xs text-stone-500 font-medium">
                    <div className="flex items-center gap-2">
                      {memory.period_start && (
                        <div className="flex items-center gap-1.5 text-stone-500">
                          <Calendar className="h-3.5 w-3.5 text-stone-400" />
                          <span>
                            {new Date(memory.period_start).toLocaleDateString('pt-BR')}
                            {memory.period_end ? ` até ${new Date(memory.period_end).toLocaleDateString('pt-BR')}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-amber-800 font-black uppercase tracking-wider text-[10px] group-hover:translate-x-1 transition-transform">
                      Consultar Pergaminho <ArrowRight className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
