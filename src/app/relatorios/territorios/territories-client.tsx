"use client";

import * as React from "react";
import Link from "next/link";
import {
  Map,
  Search,
  Loader2,
  ArrowLeft,
  Flame,
  ArrowRight,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GamefulEmptyState } from "@/components/radar/gameful-empty-state";
import { EthicalGuardrailBanner } from "@/components/radar/ethical-guardrail-banner";
import { GamefulHero, GamefulHeroBadge } from "@/components/radar/gameful-hero";
import { GamefulMetricCard } from "@/components/radar/gameful-metric-card";
import { TerritoryNodeCard } from "@/components/radar/territory-node-card";
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
  const hasTerritories = summaries.length > 0;

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
      <GamefulHero
        eyebrow="Base territorial"
        title="Mapa da Mobilização"
        description="Cada bairro aparece como nó territorial com fase, calor, temas dominantes e missão recomendada. O foco é decidir onde ouvir, mobilizar, ir a campo e sustentar continuidade."
        icon={<Map className="h-5 w-5 text-white" />}
        variant="territory"
        titleClassName="radar-title-display max-w-[9ch] text-5xl sm:text-6xl"
        metrics={
          <>
            <GamefulMetricCard label="Bairros mapeados" value={summaries.length} tone="dark" />
            <GamefulMetricCard label="Em mobilização" value={phaseCounts.mobilizacao} tone="dark" />
            <GamefulMetricCard label="Em campo" value={phaseCounts.campo} tone="dark" />
            <GamefulMetricCard label="Em continuidade" value={phaseCounts.continuidade} tone="dark" />
          </>
        }
        aside={
          <div className="space-y-4 rounded-[28px] border border-white/10 bg-black/15 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">Território mais quente</p>
              <Flame className="h-4 w-4 text-[#f0c15b]" />
            </div>
            {hottest ? (
              <>
                  <h3 className="text-2xl font-black tracking-tight text-white">{hottest.neighborhood}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <TerritoryStageBadge phase={mapTerritoryToPhase(hottest)} compact />
                    <GamefulHeroBadge>Calor {hottest.priorityScore}</GamefulHeroBadge>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">Temas que puxam o bairro</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                    {hottest.topThemes.map((theme) => (
                      <Badge key={theme.theme} className="border border-white/10 bg-white/10 text-white hover:bg-white/10">
                        {theme.theme}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  className="h-12 bg-[#d39b2a] px-6 text-xs font-black uppercase tracking-wider text-[#11202a] hover:bg-[#e0aa3b]"
                  onClick={() => handleSelectBairro(hottest.neighborhood)}
                >
                  Abrir detalhe territorial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <h3 className="text-2xl font-black tracking-tight text-white">Mapa ainda sem sinais</h3>
                <p className="text-sm leading-6 text-zinc-300">
                  O mapa territorial depende de bairro declarado ou registrado. Sem isso, a leitura continua agregada, mas ainda não forma nós territoriais.
                </p>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">Missão territorial inicial</p>
                  <p className="mt-2 text-sm font-black text-amber-200">Registrar bairros, revisar pessoas sem bairro e abrir a primeira ação de campo onde já houver contexto.</p>
                </div>
                <div className="grid gap-2">
                  <Button
                    className="h-11 bg-[#d39b2a] px-4 text-xs font-black uppercase tracking-wider text-[#11202a] hover:bg-[#e0aa3b]"
                    nativeButton={false}
                    render={<Link href="/pessoas" />}
                  >
                    Revisar pessoas sem bairro
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 border-white/15 bg-white/5 px-4 text-xs font-black uppercase tracking-wider text-white hover:bg-white/10"
                    nativeButton={false}
                    render={<Link href="/campo/novo" />}
                  >
                    Criar ação de campo
                  </Button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <EthicalGuardrailBanner
        description="O mapa mostra leitura agregada por bairro. Nenhuma pessoa é exposta como unidade territorial."
        badgeLabel="Leitura ética ativa"
        tone="zinc"
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7759]">Nós territoriais</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">Bairros em campanha</h2>
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Buscar bairro..."
            className="h-11 border-[#d8c7ac] bg-white/80 pl-10 font-semibold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {hasTerritories ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredSummaries.map((item) => (
            <TerritoryNodeCard key={item.neighborhood} territory={item} onSelect={handleSelectBairro} />
          ))}
        </div>
      ) : (
        <GamefulEmptyState
          variant="territory"
          title="Mapa ainda sem sinais"
          description="Nenhum bairro foi mapeado por enquanto. O Radar só abre leitura territorial quando há bairro declarado ou registrado nas interações e ações de campo."
          nextActionLabel="registrar bairro ou revisar pessoas sem bairro"
          nextActionHref="/pessoas"
          secondaryAction={
            <Button variant="outline" className="h-11 rounded-xl border-zinc-200 bg-white text-xs font-black uppercase tracking-[0.18em]" nativeButton={false} render={<Link href="/campo/novo" />}>
              Criar missão de campo
            </Button>
          }
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="radar-outline-card rounded-[30px] border-[#d8c7ac] bg-[rgba(255,250,242,0.92)] shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#b47a0e]" />
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
                <div key={item.label} className="rounded-2xl border border-[#d8c7ac] bg-white/75 p-4">
                  <div className={`h-2 w-10 rounded-full ${item.color}`} />
                  <p className="mt-3 text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7759]">{item.label}</p>
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
