"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useTransition } from "react";
import type { PriorityPerson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  Filter,
  UserPlus,
  ShieldAlert,
  Copy,
  Instagram,
  Route,
  Send,
} from "lucide-react";
import { assumePersonResponsible } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

// Radar Design System
import { PersonPriorityCard } from "@/components/radar/person-priority-card";
import { EmptyState } from "@/components/radar/empty-state";
import { OperationalStatusBar } from "@/components/radar/operational-status-bar";
import { PersonQuickSheet } from "@/components/radar/person-quick-sheet";
import { PersonOperationalList } from "@/components/radar/person-operational-list";
import { GamefulHero, GamefulHeroBadge } from "@/components/radar/gameful-hero";
import { GamefulMetricCard } from "@/components/radar/gameful-metric-card";
import { OperationalCommandBar } from "@/components/radar/operational-command-bar";
import { GuidedOnboarding } from "@/components/radar/onboarding/guided-onboarding";
import { ContextHelpCard } from "@/components/radar/context-help-card";
import { LightweightOnboarding } from "@/components/radar/onboarding/lightweight-onboarding";
import { useCompactMode } from "@/hooks/use-compact-mode";
import { CompactModeToggle } from "@/components/radar/compact-mode-toggle";

type Operator = { id: string; email: string; full_name: string | null; role: string };

export function PeopleClient({
  priorityPeople,
  operators = [],
}: {
  priorityPeople: PriorityPerson[];
  operators?: Operator[];
}) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
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
  const [isNotebookViewport, setIsNotebookViewport] = useState(false);

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
          case "prontas_aviso":
            return person.announcementStatus === "preparado" || person.announcementStatus === "nao_iniciado";
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

  useEffect(() => {
    const updateViewport = () => {
      setIsNotebookViewport(window.innerWidth < 1366);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const {
    hydrated: compactHydrated,
    manualCompact,
    isCompact,
    setCompact,
  } = useCompactMode({
    storageKey: "radar_pessoas_compacto",
    autoCompact: isNotebookViewport || filteredPriorityPeople.length > 20,
  });

  // Auto-switch to list mode if many results
  useEffect(() => {
    const hasExplicitPreference = localStorage.getItem("radar_pessoas_view_mode");
    if (!hasExplicitPreference && filteredPriorityPeople.length > 20 && viewMode === "cards") {
      startTransition(() => {
        setViewMode("list");
      });
    }
  }, [filteredPriorityPeople.length, viewMode]);

  function handleAssume(personId: string) {
    startTransition(async () => {
      await assumePersonResponsible(personId);
    });
  }

  function focusUnassignedMissions() {
    setPriorityFilter("sem_responsavel");
    setViewMode("list");
    localStorage.setItem("radar_pessoas_view_mode", "list");
    window.scrollTo({ top: 720, behavior: "smooth" });
  }

  const stats = useMemo(() => {
    const active = priorityPeople.filter(p => p.status !== "nao_abordar");
    return {
      total: active.length,
      quentes: active.filter(p => p.temperature === "quente").length,
      semResponsavel: active.filter(p => !p.responsibleName).length,
      esperando: active.filter(p => p.isPendingResponse).length,
      aEncaminhar: active.filter(p => p.status === "respondeu" && !p.hasReferral).length,
      naoAbordar: priorityPeople.filter(p => p.status === "nao_abordar" || p.doNotContactReason).length,
      prontasAviso: active.filter(p => p.announcementStatus === "preparado" || p.announcementStatus === "nao_iniciado").length
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
      <GamefulHero
        eyebrow="Sala de vínculos"
        title="Prioridades da Equipe"
        description={isCompact ? "Entre na rodada de avisos individuais ou revise a lista operacional." : "Comece pela rodada de avisos individuais: uma pessoa por vez, mensagem manual e registro claro do envio."}
        variant="light"
        compact={isCompact}
        titleClassName={cn("radar-title-display max-w-[8ch]", isCompact ? "text-[2.8rem] lg:text-[3.2rem] 2xl:text-6xl" : "text-4xl lg:text-5xl 2xl:text-6xl")}
        descriptionClassName={cn(isCompact ? "max-w-[28rem]" : "max-w-[34rem]")}
        badges={
          <>
            <GamefulHeroBadge light>{stats.total} missões ativas</GamefulHeroBadge>
            <GamefulHeroBadge light>{stats.semResponsavel} sem dono</GamefulHeroBadge>
          </>
        }
        metricsClassName={cn("sm:grid-cols-2", isCompact ? "2xl:grid-cols-4" : "xl:grid-cols-4")}
        metrics={
          <>
            <GamefulMetricCard label="Rede ativa" value={stats.total} tone="light" compact layout="split" detail={isCompact ? undefined : "Vínculos operacionais no radar."} />
            <GamefulMetricCard label="Urgentes" value={stats.quentes} tone="light" compact layout="split" detail={isCompact ? undefined : "Missões com maior calor."} />
            <GamefulMetricCard label="Esperando" value={stats.esperando} tone="light" compact layout="split" detail={isCompact ? undefined : "Conversas pedindo retorno."} />
            <GamefulMetricCard label="A encaminhar" value={stats.aEncaminhar} tone="light" compact layout="split" detail={isCompact ? undefined : "Interesses prontos para destino."} />
          </>
        }
        actions={
          <>
            <Button
              className="h-12 bg-[#0f1b24] px-6 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#172733]"
              nativeButton={false}
              render={<Link href="/minha-fila?rodada=foco" />}
            >
              <Send className="mr-2 h-4 w-4" />
              Começar rodada
            </Button>
            <Button
              variant="outline"
              className="h-12 border-[#d8c7ac] bg-[#f7f0e4] px-6 text-xs font-black uppercase tracking-[0.18em] text-[#11202a]"
              onClick={() => setPriorityFilter("sem_responsavel")}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assumir missões
            </Button>
            <Button
              variant="outline"
              className="h-12 border-[#d8c7ac] bg-[#f7f0e4] px-6 text-xs font-black uppercase tracking-[0.18em] text-[#11202a]"
              nativeButton={false}
              render={<Link href="/pessoas/importar" />}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Importar base
            </Button>
            {compactHydrated ? (
              <CompactModeToggle enabled={manualCompact} autoCompact={isNotebookViewport || filteredPriorityPeople.length > 20} onToggle={setCompact} />
            ) : null}
          </>
        }
      />

      <OperationalCommandBar
        title="Barra de comando"
        statusLabel="Rodada manual"
        statusValue={`${stats.total} missões ativas`}
        statusDetail="A jornada trabalha uma pessoa por vez: prepara a fala, abre o canal e registra o envio."
        primaryAction={{
          label: "Começar Rodada",
          href: "/minha-fila?rodada=foco",
          icon: Send,
        }}
        secondaryActions={[
          {
            label: "Assumir Sem Dono",
            onClick: focusUnassignedMissions,
            icon: UserPlus,
          },
        ]}
        shortcutAction={{
          label: "Importar Base",
          href: "/pessoas/importar",
          icon: PlusCircle,
        }}
      />

      <section className="radar-outline-card border-2 border-black bg-[#fff8ed] p-4 shadow-[4px_4px_0px_0px_rgba(11,11,11,0.12)] sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center border-2 border-black bg-burnt-yellow text-charcoal">
                <Route className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Caminho mais simples</p>
                <h2 className="text-xl font-black tracking-tight text-charcoal">Rodada de avisos individuais</h2>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {[
                { icon: Copy, title: "Preparar", detail: "Copiar a mensagem da pessoa." },
                { icon: Instagram, title: "Enviar", detail: "Personalizar e mandar manualmente." },
                { icon: CheckCircle2, title: "Registrar", detail: "Salvar que o aviso foi enviado." },
              ].map(({ icon: Icon, title, detail }) => (
                <div key={title} className="flex min-w-0 items-start gap-2 border-2 border-[#d8c7ac] bg-white/80 p-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-charcoal" />
                  <span className="min-w-0">
                    <span className="block text-xs font-black uppercase tracking-[0.14em] text-charcoal">{title}</span>
                    <span className="mt-1 block text-xs font-semibold leading-4 text-[#645845]">{detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Button
            className="h-12 border-2 border-black bg-charcoal px-6 text-xs font-black uppercase tracking-[0.18em] text-off-white shadow-[3px_3px_0px_0px_rgba(242,169,0,0.5)] hover:bg-charcoal/90"
            nativeButton={false}
            render={<Link href="/minha-fila?rodada=foco" />}
          >
            <Send className="mr-2 h-4 w-4" />
            Abrir rodada agora
          </Button>
        </div>
      </section>

      <div className="sticky top-24 z-20 space-y-3">
        <OperationalStatusBar
          className="border-[#d8c7ac] bg-[rgba(255,250,242,0.96)] backdrop-blur"
          activeFilter={priorityFilter}
          onFilter={(id) => setPriorityFilter(id)}
          metrics={[
            { id: "todos", label: "Geral", value: stats.total, tone: "neutral", icon: Users, filterable: true },
            { id: "quentes", label: "Urgentes", value: stats.quentes, tone: "hot", icon: Flame, filterable: true },
            { id: "sem_responsavel", label: "Sem Dono", value: stats.semResponsavel, tone: stats.semResponsavel > 0 ? "warning" : "neutral", icon: AlertCircle, filterable: true },
            { id: "pendente_resposta", label: "Esperando", value: stats.esperando, tone: "neutral", icon: Clock, filterable: true },
            { id: "sem_encaminhamento", label: "A encaminhar", value: stats.aEncaminhar, tone: stats.aEncaminhar > 0 ? "info" : "neutral", icon: CheckCircle2, filterable: true },
            { id: "prontas_aviso", label: "Prontas p/ Aviso", value: stats.prontasAviso, tone: "neutral", icon: Send, filterable: true },
          ]}
          actions={null}
        />

        {isCompact ? (
          <details className="radar-outline-card rounded-[20px] border border-[#d8c7ac] bg-[rgba(255,250,242,0.96)] backdrop-blur">
            <summary className="cursor-pointer list-none px-3 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#7d6f59]">
              Filtros e busca
            </summary>
            <div className="space-y-3 border-t border-[#d8c7ac] p-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="Buscar username..."
                  className="h-8 border-[#d8c7ac] bg-white/80 pl-9 text-xs"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-[#d8c7ac] bg-white/80 p-1 shadow-sm">
                  <Button
                    variant={viewMode === "cards" ? "secondary" : "ghost"}
                    size="icon"
                    className={cn("h-7 w-7", viewMode === "cards" && "bg-[#11202a]/8")}
                    onClick={() => toggleViewMode("cards")}
                  >
                    <LayoutGrid className={cn("h-3.5 w-3.5", viewMode === "cards" ? "text-[#11202a]" : "text-zinc-400")} />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className={cn("h-7 w-7", viewMode === "list" && "bg-[#11202a]/8")}
                    onClick={() => toggleViewMode("list")}
                  >
                    <List className={cn("h-3.5 w-3.5", viewMode === "list" ? "text-[#11202a]" : "text-zinc-400")} />
                  </Button>
                </div>
              </div>
            </div>
          </details>
        ) : (
          <div className="radar-outline-card flex flex-col items-center justify-between gap-4 rounded-xl border border-[#d8c7ac] bg-[rgba(255,250,242,0.96)] p-2 backdrop-blur md:flex-row">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <Input
                placeholder="Buscar username..."
                className="h-8 border-[#d8c7ac] bg-white/80 pl-9 text-xs"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-[#d8c7ac] bg-white/80 p-1 shadow-sm">
                <Button
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  size="icon"
                  className={cn("h-7 w-7", viewMode === "cards" && "bg-[#11202a]/8")}
                  onClick={() => toggleViewMode("cards")}
                >
                  <LayoutGrid className={cn("h-3.5 w-3.5", viewMode === "cards" ? "text-[#11202a]" : "text-zinc-400")} />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className={cn("h-7 w-7", viewMode === "list" && "bg-[#11202a]/8")}
                  onClick={() => toggleViewMode("list")}
                >
                  <List className={cn("h-3.5 w-3.5", viewMode === "list" ? "text-[#11202a]" : "text-zinc-400")} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo Principal */}
      <div className="space-y-6">
        {filteredPriorityPeople.length > 0 ? (
          viewMode === "cards" ? (
            <div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 2xl:grid-cols-4", isCompact ? "xl:grid-cols-2" : "xl:grid-cols-3")}>
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

      {isCompact ? (
        <details className="radar-outline-card rounded-[24px] border border-[#d8c7ac] bg-[rgba(255,250,242,0.92)]">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-black text-[#11202a]">
            Abrir leitura complementar da operação
          </summary>
          <div className="space-y-5 border-t border-[#d8c7ac] px-5 py-4">
            <LightweightOnboarding 
              screenId="pessoas"
              title="Prioridades da Equipe"
              highlights={[
                { title: "Onde começar", description: "Use a barra de status para filtrar por 'Sem Dono' ou 'Urgentes'.", icon: Filter },
                { title: "Ação principal", description: "Clique em 'Assumir' para garantir que cada cidadão tenha um responsável.", icon: UserPlus },
                { title: "Evite este erro", description: "Não altere o status de uma pessoa antes de realizar o contato manual de fato.", icon: ShieldAlert },
              ]}
            />
            <GuidedOnboarding compact />
            <ContextHelpCard 
              title="Como filtrar prioridades"
              whatIsThis="Esta é a lista inteligente de contatos filtrados por interesse e urgência de resposta."
              whyItMatters="Garante que nenhum cidadão interessado fique sem resposta e que os temas quentes sejam tratados rápido."
              whatToDoNow="Use os filtros da barra de status para encontrar quem precisa de um dono ou quem já respondeu e aguarda encaminhamento."
            />
          </div>
        </details>
      ) : (
        <>
          <LightweightOnboarding 
            screenId="pessoas"
            title="Prioridades da Equipe"
            highlights={[
              { title: "Onde começar", description: "Use a barra de status para filtrar por 'Sem Dono' ou 'Urgentes'.", icon: Filter },
              { title: "Ação principal", description: "Clique em 'Assumir' para garantir que cada cidadão tenha um responsável.", icon: UserPlus },
              { title: "Evite este erro", description: "Não altere o status de uma pessoa antes de realizar o contato manual de fato.", icon: ShieldAlert },
            ]}
          />
          <GuidedOnboarding compact />
          <ContextHelpCard 
            title="Como filtrar prioridades"
            whatIsThis="Esta é a lista inteligente de contatos filtrados por interesse e urgência de resposta."
            whyItMatters="Garante que nenhum cidadão interessado fique sem resposta e que os temas quentes sejam tratados rápido."
            whatToDoNow="Use os filtros da barra de status para encontrar quem precisa de um dono ou quem já respondeu e aguarda encaminhamento."
          />
        </>
      )}

      <PersonQuickSheet 
        person={selectedPerson}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onNextPerson={handleNextPerson}
        onActionComplete={() => window.location.reload()}
      />

      {/* Governance Banner */}
      <footer className="radar-panel-dark mt-12 flex flex-col items-center gap-6 rounded-2xl border border-[#23313b] p-6 text-indigo-50 md:flex-row">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10">
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
