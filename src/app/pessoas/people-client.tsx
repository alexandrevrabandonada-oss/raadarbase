"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useTransition } from "react";
import type { PriorityPerson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, 
  Flame, 
  CheckCircle2, 
  Users, 
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
import { syncMetaRecentCommentsAction } from "@/app/integracoes/meta/actions";
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
  currentOperatorId,
  currentOperatorName,
}: {
  priorityPeople: PriorityPerson[];
  operators?: Operator[];
  currentOperatorId: string;
  currentOperatorName: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("minhas_pendencias");
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");
  const [dismissedPersonIds, setDismissedPersonIds] = useState<string[]>([]);

  const [selectedPerson, setSelectedPerson] = useState<PriorityPerson | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isNotebookViewport, setIsNotebookViewport] = useState(false);

  const handleOpenDetails = (person: PriorityPerson) => {
    setSelectedPerson(person);
    setIsSheetOpen(true);
  };

  const normalizedQuery = query.trim().toLowerCase();
  const visiblePriorityPeople = useMemo(
    () => priorityPeople.filter((person) => !dismissedPersonIds.includes(person.id)),
    [dismissedPersonIds, priorityPeople],
  );

  const teamPriorityPeople = useMemo(() => {
    return visiblePriorityPeople
      .filter((person) => {
        if (!person.priorityEligible) return false;
        if (person.isPendingResponse) return false;

        if (normalizedQuery) {
          const searchTarget = `${person.username} ${person.displayName ?? ""} ${person.mainTheme ?? ""}`.toLowerCase();
          if (!searchTarget.includes(normalizedQuery)) return false;
        }
        
        switch (priorityFilter) {
          case "quentes":
            return person.temperature === "quente";
          case "sem_responsavel":
            return !person.responsibleName;
          case "sem_encaminhamento":
            return person.status === "respondeu" && !person.hasReferral;
          case "prontas_aviso":
            return person.announcementStatus === "preparado" || person.announcementStatus === "nao_iniciado";
          case "minhas_pendencias":
            return person.responsibleId === currentOperatorId;
          case "pendente_resposta":
            return false;
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
  }, [currentOperatorId, normalizedQuery, operators, priorityFilter, visiblePriorityPeople]);

  const waitingPeople = useMemo(() => {
    return visiblePriorityPeople
      .filter((person) => {
        if (!person.priorityEligible) return false;
        if (!person.isPendingResponse) return false;

        if (normalizedQuery) {
          const searchTarget = `${person.username} ${person.displayName ?? ""} ${person.mainTheme ?? ""}`.toLowerCase();
          if (!searchTarget.includes(normalizedQuery)) return false;
        }

        if (priorityFilter !== "todos" && priorityFilter !== "pendente_resposta" && priorityFilter !== "minhas_pendencias") {
          return false;
        }

        if (priorityFilter === "minhas_pendencias" && person.responsibleId !== currentOperatorId) {
          return false;
        }

        return true;
      })
      .slice(0, 100);
  }, [currentOperatorId, normalizedQuery, priorityFilter, visiblePriorityPeople]);

  useEffect(() => {
    const active = visiblePriorityPeople.filter(p => p.status !== "nao_abordar" && !p.doNotContactReason);
    const totalActive = active.length;
    const totalSent = active.filter(p => p.isPendingResponse).length;

    if (totalActive > 0 && totalSent >= totalActive * 0.5) {
      const lastSync = localStorage.getItem("radar_last_auto_sync_comments");
      const now = Date.now();
      if (!lastSync || now - Number(lastSync) > 10 * 60 * 1000) {
        localStorage.setItem("radar_last_auto_sync_comments", String(now));
        
        toast({
          title: "Atualizando prioridades 🔄",
          description: "A maioria da lista já recebeu mensagens. Sincronizando novas interações do Instagram...",
        });

        startTransition(async () => {
          try {
            const result = await syncMetaRecentCommentsAction();
            if (result.ok) {
              toast({
                title: "Prioridades atualizadas! 🎉",
                description: "Novas interações do Instagram foram sincronizadas e a lista foi atualizada.",
              });
            }
          } catch (err) {
            console.error("Failed to run auto sync:", err);
          }
        });
      }
    }
  }, [toast, visiblePriorityPeople]);

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
    autoCompact: isNotebookViewport || teamPriorityPeople.length > 20,
  });

  // Auto-switch to list mode if many results
  useEffect(() => {
    if (teamPriorityPeople.length > 20 && viewMode === "cards") {
      startTransition(() => {
        setViewMode("list");
      });
    }
  }, [teamPriorityPeople.length, viewMode]);

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
    const active = visiblePriorityPeople.filter(p => p.status !== "nao_abordar");
    const esperando = active.filter(p => p.isPendingResponse);
    const naoEsperando = active.filter(p => !p.isPendingResponse);
    return {
      total: naoEsperando.length,
      minhasPendencias: naoEsperando.filter(p => p.responsibleId === currentOperatorId).length,
      quentes: naoEsperando.filter(p => p.temperature === "quente").length,
      semResponsavel: naoEsperando.filter(p => !p.responsibleName).length,
      esperando: esperando.length,
      aEncaminhar: naoEsperando.filter(p => p.status === "respondeu" && !p.hasReferral).length,
      naoAbordar: visiblePriorityPeople.filter(p => p.status === "nao_abordar" || p.doNotContactReason).length,
      prontasAviso: naoEsperando.filter(p => p.announcementStatus === "preparado" || p.announcementStatus === "nao_iniciado").length
    };
  }, [currentOperatorId, visiblePriorityPeople]);

  useEffect(() => {
    if (priorityFilter === "minhas_pendencias" && stats.minhasPendencias === 0 && stats.total > 0) {
      setPriorityFilter("todos");
    }
  }, [priorityFilter, stats.minhasPendencias, stats.total]);

  function removePersonFromCurrentList(personId: string) {
    setDismissedPersonIds((current) => (current.includes(personId) ? current : [...current, personId]));
  }

  function openNextAfterCompletion(personId: string) {
    const currentIndex = teamPriorityPeople.findIndex((person) => person.id === personId);
    const nextPerson = currentIndex >= 0 ? teamPriorityPeople[currentIndex + 1] ?? null : null;
    removePersonFromCurrentList(personId);
    if (nextPerson) {
      setSelectedPerson(nextPerson);
      setIsSheetOpen(true);
      return;
    }
    setIsSheetOpen(false);
    setSelectedPerson(null);
    toast({ title: "Rodada concluída", description: "Não há outra pendência neste filtro agora." });
  }

  function handleActionComplete(personId?: string, options?: { openNext?: boolean }) {
    if (!personId) {
      router.refresh();
      return;
    }
    if (options?.openNext) openNextAfterCompletion(personId);
    else removePersonFromCurrentList(personId);
    router.refresh();
  }

  function handleAssumeNextUnassigned() {
    const nextUnassigned = teamPriorityPeople.find((person) => !person.responsibleId);
    if (!nextUnassigned) {
      toast({ title: "Sem pendência sem dono", description: "Todas as missões deste filtro já têm responsável." });
      return;
    }

    startTransition(async () => {
      await assumePersonResponsible(nextUnassigned.id);
      setPriorityFilter("minhas_pendencias");
      setSelectedPerson(nextUnassigned);
      setIsSheetOpen(true);
      router.refresh();
    });
  }


  const handleNextPerson = () => {
    if (!selectedPerson) return;
    const currentIndex = teamPriorityPeople.findIndex(p => p.id === selectedPerson.id);
    if (currentIndex !== -1 && currentIndex < teamPriorityPeople.length - 1) {
      setSelectedPerson(teamPriorityPeople[currentIndex + 1]);
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
            <GamefulHeroBadge light>{stats.minhasPendencias} minhas</GamefulHeroBadge>
          </>
        }
        metricsClassName={cn("sm:grid-cols-2", isCompact ? "2xl:grid-cols-4" : "xl:grid-cols-4")}
        metrics={
          <>
            <GamefulMetricCard label="Rede ativa" value={stats.total} tone="light" compact layout="split" detail={isCompact ? undefined : "Pendências de primeiro envio."} />
            <GamefulMetricCard label="Urgentes" value={stats.quentes} tone="light" compact layout="split" detail={isCompact ? undefined : "Missões com maior calor."} />
            <GamefulMetricCard label="Esperando" value={stats.esperando} tone="light" compact layout="split" detail={isCompact ? undefined : "Conversas pedindo retorno."} />
            <GamefulMetricCard label="A encaminhar" value={stats.aEncaminhar} tone="light" compact layout="split" detail={isCompact ? undefined : "Interesses prontos para destino."} />
          </>
        }
        actions={
          <>
            <Button
              className="h-12 border-2 border-black bg-burnt-yellow px-6 text-xs font-black uppercase tracking-[0.18em] text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] hover:bg-burnt-yellow/90 hover:-translate-y-0.5 transition-all rounded-[2px]"
              nativeButton={false}
              render={<Link href="/minha-fila?rodada=foco" />}
            >
              <Send className="mr-2 h-4 w-4" />
              Começar rodada
            </Button>
            <Button
              variant="outline"
              className="h-12 border-2 border-black bg-white px-6 text-xs font-black uppercase tracking-[0.18em] text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] hover:bg-charcoal/5 hover:-translate-y-0.5 transition-all rounded-[2px]"
              onClick={handleAssumeNextUnassigned}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assumir próxima
            </Button>
            <Button
              variant="outline"
              className="h-12 border-2 border-black bg-white px-6 text-xs font-black uppercase tracking-[0.18em] text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] hover:bg-charcoal/5 hover:-translate-y-0.5 transition-all rounded-[2px]"
              nativeButton={false}
              render={<Link href="/pessoas/importar" />}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Importar base
            </Button>
            {compactHydrated ? (
              <CompactModeToggle enabled={manualCompact} autoCompact={isNotebookViewport || teamPriorityPeople.length > 20} onToggle={setCompact} />
            ) : null}
          </>
        }
      />

      <OperationalCommandBar
        title="Barra de comando"
        statusLabel="Rodada manual"
        statusValue={`${stats.minhasPendencias} minhas pendências`}
        statusDetail="A lista principal fica só com quem ainda não recebeu mensagem. Quem já foi abordado sai automaticamente para esperando retorno."
        primaryAction={{
          label: "Começar Rodada",
          href: "/minha-fila?rodada=foco",
          icon: Send,
        }}
        secondaryActions={[
          {
            label: "Assumir Próxima Sem Dono",
            onClick: handleAssumeNextUnassigned,
            icon: UserPlus,
          },
        ]}
        shortcutAction={{
          label: "Importar Base",
          href: "/pessoas/importar",
          icon: PlusCircle,
        }}
      />

      <section className="bloco-concreto border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] sm:p-5 rounded-[2px]">
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
              { icon: CheckCircle2, title: "Registrar", detail: "Marcar envio e mover direto para esperando resposta." },
              ].map(({ icon: Icon, title, detail }) => (
                <div key={title} className="flex min-w-0 items-start gap-2 border-2 border-black bg-white p-3 rounded-[2px]">
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
            className="h-12 border-2 border-black bg-burnt-yellow px-6 text-xs font-black uppercase tracking-[0.18em] text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] hover:bg-burnt-yellow/90 hover:-translate-y-0.5 transition-all rounded-[2px]"
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
          className="border-2 border-black bg-white rounded-[2px] shadow-[4px_4px_0px_0px_rgba(11,11,11,1)]"
          activeFilter={priorityFilter}
          onFilter={(id) => setPriorityFilter(id)}
          metrics={[
            { id: "todos", label: "Geral", value: stats.total, tone: "neutral", icon: Users, filterable: true },
            { id: "minhas_pendencias", label: "Minhas", value: stats.minhasPendencias, tone: "info", icon: List, filterable: true },
            { id: "quentes", label: "Urgentes", value: stats.quentes, tone: "hot", icon: Flame, filterable: true },
            { id: "sem_responsavel", label: "Sem Dono", value: stats.semResponsavel, tone: stats.semResponsavel > 0 ? "warning" : "neutral", icon: AlertCircle, filterable: true },
            { id: "pendente_resposta", label: "Esperando", value: stats.esperando, tone: "neutral", icon: Clock, filterable: true },
            { id: "sem_encaminhamento", label: "A encaminhar", value: stats.aEncaminhar, tone: stats.aEncaminhar > 0 ? "info" : "neutral", icon: CheckCircle2, filterable: true },
            { id: "prontas_aviso", label: "Prontas p/ Aviso", value: stats.prontasAviso, tone: "neutral", icon: Send, filterable: true },
          ]}
          actions={null}
        />

        {isCompact ? (
          <details className="radar-outline-card rounded-[2px] border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">
            <summary className="cursor-pointer list-none px-3 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#7d6f59]">
              Filtros e busca
            </summary>
            <div className="space-y-3 border-t border-black p-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="Buscar username..."
                  className="h-8 border-2 border-black bg-white pl-9 text-xs"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "minhas_pendencias", label: "Minhas", count: stats.minhasPendencias },
                  { id: "todos", label: "Primeiro envio", count: stats.total },
                  { id: "quentes", label: "Urgentes", count: stats.quentes },
                  { id: "sem_responsavel", label: "Sem dono", count: stats.semResponsavel },
                ].map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    className={cn(
                      "h-10 justify-between border-2 border-black bg-white px-3 text-[10px] font-black uppercase tracking-[0.14em] text-charcoal rounded-[2px]",
                      priorityFilter === item.id && "bg-burnt-yellow"
                    )}
                    onClick={() => setPriorityFilter(item.id)}
                  >
                    <span>{item.label}</span>
                    <span>{item.count}</span>
                  </Button>
                ))}
              </div>
            </div>
          </details>
        ) : (
          <div className="radar-outline-card flex flex-col items-center justify-between gap-4 rounded-[2px] border-2 border-black bg-white p-4 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] md:flex-row">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <Input
                placeholder="Buscar username..."
                className="h-8 border-2 border-black bg-white pl-9 text-xs"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Badge className="rounded-[2px] border-2 border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-charcoal hover:bg-white">
                <List className="mr-2 h-3.5 w-3.5" />
                Lista operacional
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo Principal */}
      <div className="space-y-6">
        {teamPriorityPeople.length > 0 ? (
          viewMode === "cards" ? (
            <div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 2xl:grid-cols-4", isCompact ? "xl:grid-cols-2" : "xl:grid-cols-3")}>
              {teamPriorityPeople.slice(0, 15).map((person, index) => (
                <PersonPriorityCard 
                  key={person.id} 
                  person={person} 
                  index={index} 
                  layout="card"
                  onOpenDetails={handleOpenDetails}
                  onActionComplete={() => router.refresh()}
                />
              ))}
            </div>
          ) : (
            <PersonOperationalList 
              people={teamPriorityPeople}
              onOpenDetails={handleOpenDetails}
              onAssume={(id) => handleAssume(id)}
              isAssuming={isPending}
              onActionComplete={handleActionComplete}
            />
          )
        ) : (
          <EmptyState 
            type="empty_filter"
            title="Nenhuma pendência de primeiro envio"
            description="A equipe já limpou a rodada principal deste filtro. Veja abaixo quem está esperando retorno."
            primaryAction={
              <Button variant="outline" onClick={() => { setQuery(""); setPriorityFilter("todos"); }}>
                Limpar filtros
              </Button>
            }
          />
        )}

        {waitingPeople.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Lista separada</p>
                <h3 className="text-xl font-black text-charcoal">Pessoas esperando retorno</h3>
              </div>
              <Badge className="rounded-[2px] border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-charcoal hover:bg-white">
                {waitingPeople.length} aguardando
              </Badge>
            </div>
            <PersonOperationalList
              people={waitingPeople}
              onOpenDetails={handleOpenDetails}
              onAssume={(id) => handleAssume(id)}
              isAssuming={isPending}
              onActionComplete={handleActionComplete}
            />
          </section>
        ) : null}
      </div>

      {isCompact ? (
        <details className="radar-outline-card rounded-[2px] border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(11,11,11,1)]">
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
        onActionComplete={(personId, options) => handleActionComplete(personId, options)}
      />

      {/* Governance Banner */}
      <footer className="bloco-concreto mt-12 flex flex-col items-center gap-6 rounded-[2px] border-2 border-black bg-charcoal p-6 text-white shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] md:flex-row">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Info className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-lg">Diretrizes de Engajamento Ético</h4>
          <p className="text-white/80 text-sm leading-relaxed">
            O Radar de Base utiliza sinais de interação pública para sugerir a melhor conversa. 
            É proibido o uso destes dados para profiling ideológico ou pressão eleitoral. 
            Toda conversa deve ser manual e respeitar o pedido de privacidade (&quot;Não Abordar&quot;).
          </p>
        </div>
      </footer>
    </div>
  );
}
