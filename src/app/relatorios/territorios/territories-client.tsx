"use client";

import * as React from "react";
import {
  Map,
  Search,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Flame,
  ArrowRight,
  Users,
  Calendar,
  BookOpenText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TerritorySummary, TerritoryDetail } from "@/lib/types";
import type { TerritorialExpansionResult } from "@/lib/data/territorial-expansion";
import { TerritorialCard } from "@/components/radar/reports/territorial-card";
import { TerritorialExpansionBlock } from "@/components/radar/territorial-expansion-block";
import { getTerritoryDetail } from "@/lib/data/territories";
import { useToast } from "@/hooks/use-toast";
import { mapTerritoryToPhase } from "@/lib/data/territory-mapper";
import { TerritoryStageBadge } from "@/components/radar/territories/territory-stage-badge";

interface TerritoriesClientProps {
  initialSummaries: TerritorySummary[];
  expansionData: TerritorialExpansionResult;
}

function territoryNodeTone(score: number) {
  if (score >= 85) return "border-rose-200 bg-rose-50";
  if (score >= 60) return "border-amber-200 bg-amber-50";
  if (score >= 35) return "border-sky-200 bg-sky-50";
  return "border-zinc-200 bg-zinc-50";
}

export function TerritoriesClient({ initialSummaries, expansionData }: TerritoriesClientProps) {
  const [summaries] = React.useState(initialSummaries);
  const [search, setSearch] = React.useState("");
  const [selectedBairro, setSelectedBairro] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<TerritoryDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  const { toast } = useToast();

  const filteredSummaries = React.useMemo(
    () => summaries.filter((s) => s.neighborhood.toLowerCase().includes(search.toLowerCase())),
    [search, summaries],
  );

  const phaseCounts = React.useMemo(() => {
    return summaries.reduce(
      (acc, item) => {
        const phase = mapTerritoryToPhase(item).id;
        acc[phase] += 1;
        return acc;
      },
      { observacao: 0, escuta: 0, mobilizacao: 0, campo: 0, continuidade: 0 },
    );
  }, [summaries]);

  const hottest = React.useMemo(() => summaries.slice().sort((a, b) => b.priorityScore - a.priorityScore)[0], [summaries]);

  const handleSelectBairro = async (name: string) => {
    setSelectedBairro(name);
    setIsLoadingDetail(true);
    try {
      const data = await getTerritoryDetail(name);
      setDetail(data);
    } catch {
      toast({
        title: "Erro ao carregar detalhes",
        description: "Não foi possível abrir o detalhe territorial deste bairro.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  if (selectedBairro) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedBairro(null);
              setDetail(null);
            }}
            className="px-0 text-zinc-500 hover:bg-transparent hover:text-zinc-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao mapa
          </Button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Detalhe do território</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{selectedBairro}</h1>
          </div>
        </div>

        {isLoadingDetail ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-zinc-300">
            <Loader2 className="h-12 w-12 animate-spin" />
            <p className="text-sm font-black uppercase tracking-widest">Abrindo leitura territorial...</p>
          </div>
        ) : detail ? (
          <TerritorialCard detail={detail} />
        ) : (
          <div className="py-20 text-center text-zinc-400">Território sem dados suficientes.</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="overflow-hidden rounded-[32px] border border-zinc-900/10 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.20),_transparent_24%),linear-gradient(145deg,#09090b_0%,#18181b_58%,#27272a_100%)] p-8 text-white shadow-2xl shadow-zinc-200/50">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <Map className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Base territorial</p>
                <h1 className="mt-1 text-4xl font-black tracking-tight text-white">Mapa da Mobilização</h1>
              </div>
            </div>

            <p className="max-w-3xl text-base font-medium leading-relaxed text-zinc-300">
              Cada bairro aparece como nó territorial com fase, calor, temas dominantes e missão recomendada. O foco é decidir onde ouvir, mobilizar, ir a campo e sustentar continuidade.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border border-white/10 bg-white/5 text-white shadow-none">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Bairros mapeados</p>
                  <p className="mt-2 text-3xl font-black">{summaries.length}</p>
                </CardContent>
              </Card>
              <Card className="border border-white/10 bg-white/5 text-white shadow-none">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Em mobilização</p>
                  <p className="mt-2 text-3xl font-black">{phaseCounts.mobilizacao}</p>
                </CardContent>
              </Card>
              <Card className="border border-white/10 bg-white/5 text-white shadow-none">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Em campo</p>
                  <p className="mt-2 text-3xl font-black">{phaseCounts.campo}</p>
                </CardContent>
              </Card>
              <Card className="border border-white/10 bg-white/5 text-white shadow-none">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Em continuidade</p>
                  <p className="mt-2 text-3xl font-black">{phaseCounts.continuidade}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Território mais quente</p>
              <Flame className="h-4 w-4 text-amber-300" />
            </div>
            {hottest ? (
              <>
                <h3 className="text-2xl font-black tracking-tight text-white">{hottest.neighborhood}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <TerritoryStageBadge phase={mapTerritoryToPhase(hottest)} compact />
                  <Badge className="border border-white/10 bg-white/10 text-white hover:bg-white/10">
                    Calor {hottest.priorityScore}
                  </Badge>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Temas que puxam o bairro</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hottest.topThemes.map((theme) => (
                      <Badge key={theme.theme} className="border border-white/10 bg-white/10 text-white hover:bg-white/10">
                        {theme.theme}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  className="h-12 bg-indigo-600 px-6 text-xs font-black uppercase tracking-wider hover:bg-indigo-700"
                  onClick={() => handleSelectBairro(hottest.neighborhood)}
                >
                  Abrir detalhe territorial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Guardrail territorial</p>
          <p className="text-sm font-medium text-zinc-600">
            O mapa mostra leitura agregada por bairro. Nenhuma pessoa é exposta como unidade territorial.
          </p>
        </div>
        <div className="flex items-center gap-2 text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-black uppercase tracking-widest">Leitura ética ativa</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Nós territoriais</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">Bairros em campanha</h2>
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Buscar bairro..."
            className="h-11 border-zinc-200 pl-10 font-semibold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredSummaries.map((item) => {
          const phase = mapTerritoryToPhase(item);
          return (
            <button
              key={item.neighborhood}
              onClick={() => handleSelectBairro(item.neighborhood)}
              className={`
                group rounded-[30px] border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl
                ${territoryNodeTone(item.priorityScore)}
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Nó territorial</p>
                  <h3 className="mt-2 text-xl font-black tracking-tight text-zinc-950">{item.neighborhood}</h3>
                </div>
                <Badge className="border border-zinc-200 bg-white text-zinc-900 hover:bg-white">
                  {item.priorityScore}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <TerritoryStageBadge phase={phase} compact />
                <Badge variant="outline" className="border-zinc-200 bg-white text-zinc-600">
                  {item.fieldActions} campo
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/50 bg-white/70 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Calor</p>
                  <p className="mt-2 text-lg font-black text-zinc-950">{item.priorityScore}%</p>
                </div>
                <div className="rounded-2xl border border-white/50 bg-white/70 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Ação recomendada</p>
                  <p className="mt-2 text-sm font-black text-indigo-700">{phase.nextStep}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-zinc-500">
                  <BookOpenText className="h-4 w-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.24em]">Temas principais</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.topThemes.map((theme) => (
                    <Badge key={theme.theme} variant="outline" className="border-zinc-200 bg-white text-zinc-700">
                      {theme.theme}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-200/70 pt-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Sinais</p>
                  <p className="mt-2 text-sm font-black text-zinc-950">{item.peopleMonitored}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Prioridades</p>
                  <p className="mt-2 text-sm font-black text-zinc-950">{item.priorityPeople}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Voluntários</p>
                  <p className="mt-2 text-sm font-black text-zinc-950">{item.volunteers}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[30px] border-zinc-200 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <h3 className="text-lg font-black text-zinc-950">Leitura rápida das fases</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                { label: "Observação", value: phaseCounts.observacao, color: "bg-zinc-400" },
                { label: "Escuta", value: phaseCounts.escuta, color: "bg-sky-500" },
                { label: "Mobilização", value: phaseCounts.mobilizacao, color: "bg-amber-500" },
                { label: "Campo", value: phaseCounts.campo, color: "bg-indigo-600" },
                { label: "Continuidade", value: phaseCounts.continuidade, color: "bg-emerald-500" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                  <div className={`h-2 w-10 rounded-full ${item.color}`} />
                  <p className="mt-3 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-black text-zinc-950">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <TerritorialExpansionBlock expansionData={expansionData} />
      </div>
    </div>
  );
}
