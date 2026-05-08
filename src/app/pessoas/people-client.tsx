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
  PlusCircle,
  Info,
} from "lucide-react";
import { assumePersonResponsible, trackOperationalEvent } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

// Radar Design System
import { PersonPriorityCard } from "@/components/radar/person-priority-card";
import { EmptyState } from "@/components/radar/empty-state";
import { OperationalStatusBar } from "@/components/radar/operational-status-bar";
import { PersonQuickSheet } from "@/components/radar/person-quick-sheet";
import { PersonOperationalList } from "@/components/radar/person-operational-list";
import { GuidedOnboarding } from "@/components/radar/onboarding/guided-onboarding";

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
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PersonStatus | "todos">("todos");
  const [priorityFilter, setPriorityFilter] = useState<string>("todos");
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"cards" | "list">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("radar_pessoas_view_mode");
      if (saved === "list" || saved === "cards") return saved;
    }
    return "cards";
  });

  const [selectedPerson, setSelectedPerson] = useState<PriorityPerson | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleOpenDetails = (person: PriorityPerson) => {
    setSelectedPerson(person);
    setIsSheetOpen(true);
  };

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
      .slice(0, 100);
  }, [operators, priorityFilter, priorityPeople]);

  // Auto-switch to list mode if many results
  useEffect(() => {
    const hasExplicitPreference = localStorage.getItem("radar_pessoas_view_mode");
    if (!hasExplicitPreference && filteredPriorityPeople.length > 10 && viewMode === "cards") {
      startTransition(() => {
        setViewMode("list");
      });
    }
  }, [filteredPriorityPeople.length, viewMode]);

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


  const handleNextPerson = () => {
    if (!selectedPerson) return;
    const currentIndex = filteredPriorityPeople.findIndex(p => p.id === selectedPerson.id);
    if (currentIndex !== -1 && currentIndex < filteredPriorityPeople.length - 1) {
      setSelectedPerson(filteredPriorityPeople[currentIndex + 1]);
    } else {
      setIsSheetOpen(false);
      setSelectedPerson(null);
      toast({ title: "Fim da lista", description: "Você concluiu todas as tarefas deste filtro." });
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-20">
      <GuidedOnboarding compact />

      <OperationalStatusBar
        activeFilter={priorityFilter}
        onFilter={(id) => setPriorityFilter(id)}
        metrics={[
          { id: "todos", label: "Geral", value: stats.total, tone: "neutral", icon: Users, filterable: true },
          { id: "quentes", label: "Urgentes", value: stats.quentes, tone: "hot", icon: Flame, filterable: true },
          { id: "sem_responsavel", label: "Sem Dono", value: stats.semResponsavel, tone: stats.semResponsavel > 0 ? "warning" : "neutral", icon: AlertCircle, filterable: true },
          { id: "pendente_resposta", label: "Esperando", value: stats.esperando, tone: "neutral", icon: Clock, filterable: true },
          { id: "sem_encaminhamento", label: "A encaminhar", value: stats.aEncaminhar, tone: stats.aEncaminhar > 0 ? "info" : "neutral", icon: CheckCircle2, filterable: true },
        ]}
        actions={
          <Link 
            href="/pessoas/importar" 
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 font-black uppercase text-[10px] border-zinc-200")}
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Importar
          </Link>
        }
      />

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-50/50 p-2 rounded-xl border border-zinc-100">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <Input 
            placeholder="Buscar username..." 
            className="pl-9 h-8 text-xs border-zinc-200 bg-white"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-zinc-100 shadow-sm">
            <Button 
              variant={viewMode === "cards" ? "secondary" : "ghost"} 
              size="icon" 
              className={cn("h-7 w-7", viewMode === "cards" && "bg-zinc-100")}
              onClick={() => toggleViewMode("cards")}
            >
              <LayoutGrid className={cn("h-3.5 w-3.5", viewMode === "cards" ? "text-indigo-600" : "text-zinc-400")} />
            </Button>
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="icon" 
              className={cn("h-7 w-7", viewMode === "list" && "bg-zinc-100")}
              onClick={() => toggleViewMode("list")}
            >
              <List className={cn("h-3.5 w-3.5", viewMode === "list" ? "text-indigo-600" : "text-zinc-400")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="space-y-6">
        {filteredPriorityPeople.length > 0 ? (
          viewMode === "cards" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {filteredPriorityPeople.slice(0, 15).map((person, index) => (
                <PersonPriorityCard 
                  key={person.id} 
                  person={person} 
                  index={index} 
                  layout="card"
                  onOpenDetails={handleOpenDetails}
                  onActionComplete={() => window.location.reload()}
                />
              ))}
            </div>
          ) : (
            <PersonOperationalList 
              people={filteredPriorityPeople}
              onOpenDetails={handleOpenDetails}
              onAssume={(id) => handleAssume(id)}
              isAssuming={isPending}
            />
          )
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

      <PersonQuickSheet 
        person={selectedPerson}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onNextPerson={handleNextPerson}
        onActionComplete={() => window.location.reload()}
      />

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
            Toda conversa deve ser manual e respeitar o pedido de privacidade (&quot;Não Abordar&quot;).
          </p>
        </div>
      </footer>
    </div>
  );
}
