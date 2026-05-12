"use client";

import * as React from "react";
import { 
  Map, 
  Search, 
  LayoutGrid, 
  List, 
  Filter,
  ArrowLeft,
  Loader2,
  RefreshCcw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TerritorySummary, TerritoryDetail } from "@/lib/types";
import type { TerritorialExpansionResult } from "@/lib/data/territorial-expansion";
import { TerritorialRanking } from "@/components/radar/reports/territorial-ranking";
import { TerritorialCard } from "@/components/radar/reports/territorial-card";
import { NeighborhoodScaleChecklist } from "@/components/radar/territories/neighborhood-scale-checklist";
import { TerritorialExpansionBlock } from "@/components/radar/territorial-expansion-block";
import { TerritorialHeatmap } from "@/components/radar/reports/territorial-heatmap";
import { getTerritoryDetail } from "@/lib/data/territories";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Info } from "lucide-react";

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

  const filteredSummaries = summaries.filter(s => 
    s.neighborhood.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectBairro = async (name: string) => {
    setSelectedBairro(name);
    setIsLoadingDetail(true);
    try {
      const data = await getTerritoryDetail(name);
      setDetail(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar detalhes",
        description: "Não foi possível carregar os dados detalhados deste bairro.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          {selectedBairro ? (
            <Button 
              variant="ghost" 
              onClick={() => setSelectedBairro(null)}
              className="px-0 hover:bg-transparent text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para o ranking
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <Map className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-black text-zinc-900 uppercase tracking-tight">Painel Territorial</h1>
            </div>
          )}
          {!selectedBairro && (
            <p className="text-zinc-500 font-medium">Análise de sinais e planejamento de campo por bairro.</p>
          )}
        </div>

        {!selectedBairro && (
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input 
                placeholder="Buscar bairro..." 
                className="pl-10 h-11 border-zinc-200 focus:border-indigo-300 transition-all font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11 border-zinc-200">
              <Filter className="h-4 w-4 text-zinc-400" />
            </Button>
          </div>
        )}
      </div>

      {/* Visual Guardrail Banner */}
      <div className="bg-zinc-100/50 border border-zinc-200 rounded-2xl p-4 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
        <p className="text-xs font-bold text-zinc-600">
          Este painel orienta ações coletivas. Não exibe localização individual. <span className="text-zinc-400 font-medium">(Bairro é a menor unidade geográfica visível)</span>
        </p>
      </div>

      {selectedBairro ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {isLoadingDetail ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-zinc-300 gap-4">
              <Loader2 className="h-12 w-12 animate-spin" />
              <p className="font-black uppercase text-sm tracking-widest">Carregando diagnóstico do bairro...</p>
            </div>
          ) : detail ? (
            <TerritorialCard detail={detail} />
          ) : (
            <div className="text-center py-20">
              <p className="text-zinc-400 font-bold">Bairro não encontrado ou sem dados suficientes.</p>
            </div>
          )}
        </div>
      ) : (
        <Tabs defaultValue="ranking" className="space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <TabsList className="bg-transparent h-auto p-0 gap-8">
              <TabsTrigger 
                value="ranking" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 pb-2 text-zinc-400 font-black uppercase text-xs tracking-widest transition-all"
              >
                Ranking
              </TabsTrigger>
              <TabsTrigger 
                value="heatmap" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 pb-2 text-zinc-400 font-black uppercase text-xs tracking-widest transition-all"
              >
                Mapa de Calor
              </TabsTrigger>
              <TabsTrigger 
                value="grid" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 pb-2 text-zinc-400 font-black uppercase text-xs tracking-widest transition-all"
              >
                Visão em Grade
              </TabsTrigger>
              <TabsTrigger 
                value="scale" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 pb-2 text-zinc-400 font-black uppercase text-xs tracking-widest transition-all"
              >
                Preparar Expansão
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Total de {summaries.length} territórios</span>
               <Button variant="ghost" size="icon" className="h-8 w-8">
                 <RefreshCcw className="h-3.5 w-3.5 text-zinc-300" />
               </Button>
            </div>
          </div>

          <TabsContent value="ranking" className="mt-0">
            <TerritorialRanking 
              summaries={filteredSummaries} 
              onSelectNeighborhood={handleSelectBairro} 
            />
          </TabsContent>

          <TabsContent value="heatmap" className="mt-0">
            <TerritorialHeatmap 
              summaries={summaries} 
              onSelectNeighborhood={handleSelectBairro} 
            />
          </TabsContent>
          
          <TabsContent value="grid" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredSummaries.map((item) => (
                 <div 
                   key={item.neighborhood}
                   onClick={() => handleSelectBairro(item.neighborhood)}
                   className="bg-white border border-zinc-100 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer group"
                 >
                   <div className="flex items-start justify-between mb-4">
                     <h3 className="font-black uppercase text-lg text-zinc-900 group-hover:text-indigo-600 transition-colors">{item.neighborhood}</h3>
                     <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black text-[10px]">{item.priorityScore}</Badge>
                   </div>
                   <div className="space-y-3">
                     <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                       <span>Sinais</span>
                       <span className="text-zinc-900">{item.peopleMonitored}</span>
                     </div>
                     <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                       <span>Voluntários</span>
                       <span className="text-zinc-900">{item.volunteers}</span>
                     </div>
                     <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                       <span>Última Ação</span>
                       <span className="text-zinc-900">
                         {item.lastActionAt ? new Date(item.lastActionAt).toLocaleDateString('pt-BR') : "N/A"}
                       </span>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </TabsContent>

          <TabsContent value="scale" className="mt-0">
            <TerritorialExpansionBlock expansionData={expansionData} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
