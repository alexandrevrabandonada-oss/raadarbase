"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useTransition } from "react";
import type { IgPerson, PeoplePriorityQuickFilter, PriorityPerson, PersonStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, 
  Flame, 
  CheckCircle2, 
  Users, 
  LayoutGrid, 
  List, 
  AlertCircle,
  Clock,
  ShieldAlert,
  PlusCircle,
  Info,
} from "lucide-react";
import { assumePersonResponsible } from "@/app/actions";

// Radar Design System
import { RadarPageHeader } from "@/components/radar/radar-page-header";
import { RadarMetricCard } from "@/components/radar/radar-metric-card";
import { PersonPriorityCard } from "@/components/radar/person-priority-card";
import { EmptyState } from "@/components/radar/empty-state";

type Operator = { id: string; email: string; full_name: string | null; role: string };

const quickFilters: Array<{ id: PeoplePriorityQuickFilter | "quer_evento" | "quer_voluntariado" | "quer_eluta"; label: string }> = [
  { id: "todos", label: "Geral" },
  { id: "quentes", label: "Urgentes" },
  { id: "sem_responsavel", label: "Sem Dono" },
  { id: "pendente_resposta", label: "Esperando" },
  { id: "sem_encaminhamento", label: "A encaminhar" },
];

export function PeopleClient({ 
  people, 
  priorityPeople, 
  operators = [] 
}: { 
  people: IgPerson[]; 
  priorityPeople: PriorityPerson[];
  operators?: Operator[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PersonStatus | "todos">("todos");
  const [priorityFilter, setPriorityFilter] = useState<PeoplePriorityQuickFilter | string>("todos");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = localStorage.getItem("radar_pessoas_view_mode");
    if (saved === "list" || saved === "cards") {
      setViewMode(saved);
    }
  }, []);

  const toggleViewMode = (mode: "cards" | "list") => {
    setViewMode(mode);
    localStorage.setItem("radar_pessoas_view_mode", mode);
  };

  const filteredPriorityPeople = useMemo(() => {
    return priorityPeople
      .filter((person) => {
        if (!person.priorityEligible) return false;
        
        switch (priorityFilter) {
          case "quentes":
            return person.temperature === "quente";
          case "sem_responsavel":
            return !person.responsibleName;
          case "pendente_resposta":
            return person.isPendingResponse;
          case "sem_encaminhamento":
            return person.status === "respondeu" && !person.hasReferral;
          case "quer_evento":
            return person.themes.includes("quer_evento_campo");
          case "quer_voluntariado":
            return person.themes.includes("quer_voluntariado");
          case "quer_eluta":
            return person.themes.includes("quer_missao_eluta");
          default:
            if (operators.some(op => op.id === priorityFilter)) {
              return person.responsibleId === priorityFilter;
            }
            return true;
        }
      })
      .slice(0, viewMode === "cards" ? 10 : 50);
  }, [operators, priorityFilter, priorityPeople, viewMode]);

  const filteredPeople = useMemo(() => {
    return people
      .filter((person) => {
        if (statusFilter === "todos") return person.status !== "nao_abordar";
        return person.status === statusFilter;
      })
      .filter((person) => person.username.toLowerCase().includes(query.replace("@", "").toLowerCase()))
      .sort((a, b) =>
          Date.parse(b.lastInteractionAt ?? "1970-01-01") - Date.parse(a.lastInteractionAt ?? "1970-01-01")
      );
  }, [people, query, statusFilter]);

  function handleAssume(personId: string) {
    startTransition(async () => {
      await assumePersonResponsible(personId);
    });
  }

  const stats = useMemo(() => {
    const active = priorityPeople.filter(p => p.status !== "nao_abordar");
    return {
      total: active.length,
      quentes: active.filter(p => p.temperature === "quente").length,
      semResponsavel: active.filter(p => !p.responsibleName).length,
      esperando: active.filter(p => p.isPendingResponse).length,
      aEncaminhar: active.filter(p => p.status === "respondeu" && !p.hasReferral).length,
      naoAbordar: priorityPeople.filter(p => p.status === "nao_abordar" || p.doNotContactReason).length
    };
  }, [priorityPeople]);

  return (
    <div className="flex flex-col gap-8 pb-20">
      <RadarPageHeader 
        eyebrow="Priorização Diária"
        title="Ranking de Vínculos"
        description="Pessoas com maior potencial de engajamento baseadas em interações recentes e temas estratégicos."
        actions={
          <Link 
            href="/pessoas/importar" 
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "font-bold border-zinc-200")}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Importar
          </Link>
        }
      />


      {/* Indicadores do Topo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <RadarMetricCard label="Pessoas Reais" value={stats.total} icon={Users} tone="neutral" />
        <RadarMetricCard label="Top Quentes" value={stats.quentes} icon={Flame} tone="hot" />
        <RadarMetricCard label="Sem Dono" value={stats.semResponsavel} icon={AlertCircle} tone="neutral" />
        <RadarMetricCard label="Esperando" value={stats.esperando} icon={Clock} tone="warning" />
        <RadarMetricCard label="A Encaminhar" value={stats.aEncaminhar} icon={CheckCircle2} tone="info" />
        <RadarMetricCard label="Não Abordar" value={stats.naoAbordar} icon={ShieldAlert} tone="danger" />
      </div>

      {/* Toolbar Operacional */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-100 shadow-sm sticky top-0 z-20">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Buscar por @username ou nome..." 
            className="pl-10 h-10 border-zinc-200"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-lg">
            {quickFilters.map((f) => (
              <Button
                key={f.id}
                variant={priorityFilter === f.id ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 px-3 text-[10px] font-black uppercase tracking-wider",
                  priorityFilter === f.id ? "bg-white shadow-sm text-indigo-700" : "text-zinc-500"
                )}
                onClick={() => setPriorityFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          <div className="h-6 w-px bg-zinc-200 mx-1 hidden md:block" />

          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
            <Button 
              variant={viewMode === "cards" ? "secondary" : "ghost"} 
              size="icon" 
              className={cn("h-8 w-8", viewMode === "cards" && "bg-white shadow-sm")}
              onClick={() => toggleViewMode("cards")}
            >
              <LayoutGrid className={cn("h-4 w-4", viewMode === "cards" ? "text-indigo-600" : "text-zinc-400")} />
            </Button>
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="icon" 
              className={cn("h-8 w-8", viewMode === "list" && "bg-white shadow-sm")}
              onClick={() => toggleViewMode("list")}
            >
              <List className={cn("h-4 w-4", viewMode === "list" ? "text-indigo-600" : "text-zinc-400")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="space-y-6">
        {filteredPriorityPeople.length > 0 ? (
          <div className={cn(
            viewMode === "cards" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6" 
              : "flex flex-col gap-3"
          )}>
            {filteredPriorityPeople.map((person, index) => (
              <PersonPriorityCard 
                key={person.id} 
                person={person} 
                index={index} 
                layout={viewMode}
              />
            ))}
          </div>
        ) : (
          <EmptyState 
            type="empty_filter"
            title="Ninguém encontrado"
            description="Tente ajustar sua busca ou mudar o filtro de prioridade."
            primaryAction={
              <Button variant="outline" onClick={() => { setQuery(""); setPriorityFilter("todos"); }}>
                Limpar filtros
              </Button>
            }
          />
        )}
      </div>

      {/* Governance Banner */}
      <footer className="mt-12 p-6 rounded-2xl bg-indigo-900 text-indigo-50 flex flex-col md:flex-row items-center gap-6">
        <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <Info className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-lg">Diretrizes de Engajamento Ético</h4>
          <p className="text-indigo-200/80 text-sm leading-relaxed">
            O Radar de Base utiliza sinais de interação pública para sugerir a melhor conversa. 
            É proibido o uso destes dados para profiling ideológico ou pressão eleitoral. 
            Toda conversa deve ser manual e respeitar o pedido de privacidade ("Não Abordar").
          </p>
        </div>
      </footer>
    </div>
  );
}
