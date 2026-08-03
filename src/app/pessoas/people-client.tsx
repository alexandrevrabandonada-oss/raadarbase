"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useTransition } from "react";
import type { OutreachGoalStats } from "@/lib/data/outreach-goal";
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
  MessageSquare,
  Target,
  CalendarDays,
  Trophy,
} from "lucide-react";
import { assumePersonResponsible } from "@/app/actions";
import { syncMetaRecentCommentsAction } from "@/app/integracoes/meta/actions";
import { useToast } from "@/hooks/use-toast";

// Radar Design System
import { PersonPriorityCard } from "@/components/radar/person-priority-card";
import { EmptyState } from "@/components/radar/empty-state";
import { OperationalStatusBar } from "@/components/radar/operational-status-bar";
import { PersonOperationalList } from "@/components/radar/person-operational-list";
import { GamefulHero, GamefulHeroBadge } from "@/components/radar/gameful-hero";
import { GamefulMetricCard } from "@/components/radar/gameful-metric-card";
import { OperationalCommandBar } from "@/components/radar/operational-command-bar";
import { GuidedOnboarding } from "@/components/radar/onboarding/guided-onboarding";
import { ContextHelpCard } from "@/components/radar/context-help-card";
import { LightweightOnboarding } from "@/components/radar/onboarding/lightweight-onboarding";
import { useCompactMode } from "@/hooks/use-compact-mode";
import { CompactModeToggle } from "@/components/radar/compact-mode-toggle";
import { Progress } from "@/components/ui/progress";
import { isPriorityPersonAlreadySent } from "@/lib/outreach-status";
import { getOfflineTasks } from "@/lib/offline-queue";
import {
  INSTAGRAM_CONFIRMATION_CUSTODY_EVENT,
  getInstagramConfirmationCustodyIds,
  useInstagramSendReturn,
} from "@/hooks/use-instagram-send-return";

type Operator = { id: string; email: string; full_name: string | null; role: string };
const LIST_RENDER_BATCH = 250;

const PersonQuickSheet = dynamic(
  () => import("@/components/radar/person-quick-sheet").then((module) => module.PersonQuickSheet),
  { ssr: false },
);

import type { MessageTemplate } from "@/lib/types";

export function PeopleClient({
  priorityPeople,
  operators = [],
  outreachGoal,
  currentOperatorId,
  templates = [],
}: {
  priorityPeople: PriorityPerson[];
  operators?: Operator[];
  outreachGoal: OutreachGoalStats;
  currentOperatorId: string;
  templates?: MessageTemplate[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("radar_pessoas_query") ?? "";
  });
  const [priorityFilter, setPriorityFilter] = useState<string>(() => {
    if (typeof window === "undefined") return "todos";
    return localStorage.getItem("radar_pessoas_filter") ?? "todos";
  });
  const [activeTab, setActiveTab] = useState<"nao_enviadas" | "enviadas">(() => {
    if (typeof window === "undefined") return "nao_enviadas";
    const savedTab = localStorage.getItem("radar_pessoas_tab");
    return savedTab === "enviadas" ? "enviadas" : "nao_enviadas";
  });
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"cards" | "list">(() => {
    if (typeof window === "undefined") return "list";
    return localStorage.getItem("radar_pessoas_view") === "cards" ? "cards" : "list";
  });

  // Save changes to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("radar_pessoas_query", query);
        localStorage.setItem("radar_pessoas_filter", priorityFilter);
        localStorage.setItem("radar_pessoas_tab", activeTab);
        localStorage.setItem("radar_pessoas_view", viewMode);
      } catch (e) {
        console.error("Error saving people-client states:", e);
      }
    }
  }, [query, priorityFilter, activeTab, viewMode]);

  const [dismissedPersonIds, setDismissedPersonIds] = useState<string[]>([]);
  const [confirmationCustodyIds, setConfirmationCustodyIds] = useState<string[]>([]);
  const [visibleListState, setVisibleListState] = useState({ key: "", count: LIST_RENDER_BATCH });

  const [selectedPerson, setSelectedPerson] = useState<PriorityPerson | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isNotebookViewport, setIsNotebookViewport] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const instagramSend = useInstagramSendReturn({
    toast,
    onConfirmed: (pending) => {
      handleActionComplete(pending.personId, { openNext: true, refresh: true });
    },
    onError: (_pending, error) => {
      toast({ title: "Não foi possível registrar o envio", description: error, variant: "destructive" });
    },
  });

  useEffect(() => {
    let active = true;
    const restoredCustodyIds = [...getInstagramConfirmationCustodyIds()];
    if (restoredCustodyIds.length > 0) {
      // Recibos são estado externo persistido e só podem ser restaurados após hidratar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConfirmationCustodyIds(restoredCustodyIds);
    }
    const restoreQueuedConfirmations = async () => {
      const tasks = await getOfflineTasks();
      if (!active) return;
      const personIds = new Set(tasks
        .filter((task) => task.action === "confirmDMSent")
        .map((task) => String(task.args[0])));
      for (const personId of getInstagramConfirmationCustodyIds()) personIds.add(personId);
      setConfirmationCustodyIds([...personIds]);
    };
    const handleOfflineCustody = (event: Event) => {
      const personId = (event as CustomEvent<{ personId?: string }>).detail?.personId;
      if (!personId) return;
      setConfirmationCustodyIds((current) => current.includes(personId) ? current : [...current, personId]);
    };
    void restoreQueuedConfirmations();
    window.addEventListener(INSTAGRAM_CONFIRMATION_CUSTODY_EVENT, handleOfflineCustody);
    window.addEventListener("online", restoreQueuedConfirmations);
    return () => {
      active = false;
      window.removeEventListener(INSTAGRAM_CONFIRMATION_CUSTODY_EVENT, handleOfflineCustody);
      window.removeEventListener("online", restoreQueuedConfirmations);
    };
  }, []);

  const handleOpenDetails = (person: PriorityPerson) => {
    setSelectedPerson(person);
    setIsSheetOpen(true);
  };

  const normalizedQuery = query.trim().toLowerCase();
  const visiblePriorityPeople = useMemo(
    () => priorityPeople.filter((person) => !dismissedPersonIds.includes(person.id)),
    [dismissedPersonIds, priorityPeople],
  );

  const mainQueuePeople = useMemo(() => {
    return visiblePriorityPeople
      .filter((person) => {
        if (!person.priorityEligible) return false;
        if (isPriorityPersonAlreadySent(person)) return false;
        if (confirmationCustodyIds.includes(person.id)) return false;

        if (normalizedQuery) {
          const searchTarget = `${person.username} ${person.displayName ?? ""} ${person.mainTheme ?? ""}`.toLowerCase();
          if (!searchTarget.includes(normalizedQuery)) return false;
        }
        
        return true;
      });
  }, [confirmationCustodyIds, normalizedQuery, visiblePriorityPeople]);

  const teamPriorityPeople = useMemo(() => {
    if (priorityFilter === "todos") return mainQueuePeople;

    const filteredPeople = mainQueuePeople.filter((person) => {
      switch (priorityFilter) {
        case "quentes":
          return person.temperature === "quente";
        case "sem_responsavel":
          return !person.responsibleName;
        case "sem_encaminhamento":
          return person.status === "respondeu" && !person.hasReferral;
        case "prontas_aviso":
          return person.announcementStatus === "preparado" || person.announcementStatus === "nao_iniciado";
        case "confirmacao_pendente":
          return person.announcementStatus === "preparado";
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
          if (operators.some((op) => op.id === priorityFilter)) {
            return person.responsibleId === priorityFilter;
          }
          return true;
      }
    });

    return priorityFilter === "confirmacao_pendente" || filteredPeople.length > 0
      ? filteredPeople
      : mainQueuePeople;
  }, [currentOperatorId, mainQueuePeople, operators, priorityFilter]);

  const waitingPeople = useMemo(() => {
    return visiblePriorityPeople
      .filter((person) => {
        if (!person.priorityEligible) return false;
        if (!isPriorityPersonAlreadySent(person)) return false;

        if (normalizedQuery) {
          const searchTarget = `${person.username} ${person.displayName ?? ""} ${person.mainTheme ?? ""}`.toLowerCase();
          if (!searchTarget.includes(normalizedQuery)) return false;
        }

        return true;
      });
  }, [normalizedQuery, visiblePriorityPeople]);

  const visibleListKey = `${activeTab}:${normalizedQuery}:${priorityFilter}`;
  const visibleListCount = visibleListState.key === visibleListKey ? visibleListState.count : LIST_RENDER_BATCH;

  useEffect(() => {
    const maybeSync = () => {
      const active = visiblePriorityPeople.filter(p => p.status !== "nao_abordar" && !p.doNotContactReason);
      const totalActive = active.length;
      const totalSent = active.filter(isPriorityPersonAlreadySent).length;

      if (totalActive <= 0 || totalSent < totalActive * 0.5) return;

      const lastSync = localStorage.getItem("radar_last_auto_sync_comments");
      const now = Date.now();
      if (lastSync && now - Number(lastSync) <= 10 * 60 * 1000) return;

      localStorage.setItem("radar_last_auto_sync_comments", String(now));
      
      toast({
        title: "Atualizando prioridades",
        description: "Sincronizando novas interações do Instagram em segundo plano.",
      });

      startTransition(async () => {
        try {
          const result = await syncMetaRecentCommentsAction();
          if (result.ok) {
            toast({
              title: "Prioridades atualizadas",
              description: "Novas interações do Instagram foram sincronizadas.",
            });
          }
        } catch (err) {
          console.error("Failed to run auto sync:", err);
        }
      });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(maybeSync, { timeout: 5000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(maybeSync, 2500);
    return () => globalThis.clearTimeout(timeoutId);
  }, [toast, visiblePriorityPeople]);

  useEffect(() => {
    const updateViewport = () => {
      setIsNotebookViewport(window.innerWidth < 1366);
      setIsMobileViewport(window.innerWidth < 768);
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

  const displayedTeamPriorityPeople = useMemo(
    () => teamPriorityPeople.slice(0, visibleListCount),
    [teamPriorityPeople, visibleListCount],
  );
  const displayedWaitingPeople = useMemo(
    () => waitingPeople.slice(0, visibleListCount),
    [visibleListCount, waitingPeople],
  );

  function loadMoreVisiblePeople() {
    setVisibleListState((current) => ({
      key: visibleListKey,
      count: (current.key === visibleListKey ? current.count : LIST_RENDER_BATCH) + LIST_RENDER_BATCH,
    }));
  }

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

  const stats = useMemo(() => {
    const active = visiblePriorityPeople.filter(p => p.status !== "nao_abordar");
    const esperando = active.filter(isPriorityPersonAlreadySent);
    return {
      total: mainQueuePeople.length,
      totalBase: visiblePriorityPeople.length,
      minhasPendencias: mainQueuePeople.filter(p => p.responsibleId === currentOperatorId).length,
      quentes: mainQueuePeople.filter(p => p.temperature === "quente").length,
      semResponsavel: mainQueuePeople.filter(p => !p.responsibleName).length,
      esperando: esperando.length,
      aEncaminhar: mainQueuePeople.filter(p => p.status === "respondeu" && !p.hasReferral).length,
      naoAbordar: visiblePriorityPeople.filter(p => p.status === "nao_abordar" || p.doNotContactReason).length,
      prontasAviso: mainQueuePeople.filter(p => p.announcementStatus === "preparado" || p.announcementStatus === "nao_iniciado").length,
      confirmacoesPendentes: mainQueuePeople.filter(p => p.announcementStatus === "preparado").length,
    };
  }, [currentOperatorId, mainQueuePeople, visiblePriorityPeople]);

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

  function handleActionComplete(personId?: string, options?: { openNext?: boolean; refresh?: boolean }) {
    if (!personId) {
      router.refresh();
      return;
    }
    if (options?.openNext) openNextAfterCompletion(personId);
    else removePersonFromCurrentList(personId);
    if (options?.refresh !== false) router.refresh();
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
        title="Base de Pessoas"
        description={isMobileViewport ? "Lista completa da base local autorizada, uma pessoa por vez." : isCompact ? "Priorize os engajados, mas percorra toda a base local autorizada." : "Comece pelos mais engajados e siga até cobrir toda a base local autorizada: uma pessoa por vez, mensagem manual e registro claro do envio."}
        variant="light"
        compact={isCompact || isMobileViewport}
        titleClassName={cn("radar-title-display max-w-[8ch]", isCompact ? "text-[2.8rem] lg:text-[3.2rem] 2xl:text-6xl" : "text-4xl lg:text-5xl 2xl:text-6xl")}
        descriptionClassName={cn(isCompact ? "max-w-[28rem]" : "max-w-[34rem]")}
        badges={
          <>
            <GamefulHeroBadge light>{outreachGoal.totalRemaining.toLocaleString("pt-BR")} missões ativas</GamefulHeroBadge>
            <GamefulHeroBadge light>{outreachGoal.totalEligible.toLocaleString("pt-BR")} na base local</GamefulHeroBadge>
            <GamefulHeroBadge light>{stats.minhasPendencias} minhas</GamefulHeroBadge>
          </>
        }
        metricsClassName={cn("sm:grid-cols-2", isCompact ? "2xl:grid-cols-4" : "xl:grid-cols-4")}
        metrics={
          <>
            <GamefulMetricCard label="Rede ativa" value={outreachGoal.totalRemaining} tone="light" compact layout="split" detail={isCompact ? undefined : "Toda a base local elegível para primeiro envio."} />
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

      <section className="bloco-concreto border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] sm:p-5 rounded-[2px]">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Meta central</p>
                <h2 className="text-2xl font-black tracking-tight text-charcoal">Chegar em todos até {outreachGoal.targetDateLabel}</h2>
              </div>
              <Badge className="w-fit rounded-[2px] border-2 border-black bg-burnt-yellow px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-charcoal hover:bg-burnt-yellow">
                <Target className="mr-2 h-3.5 w-3.5" />
                {outreachGoal.dailyGoal} por dia
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-5xl font-black tracking-tight text-charcoal">{outreachGoal.progressPercent}%</p>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#645845]">da base elegível enviada</p>
                </div>
                <p className="text-right text-sm font-bold text-charcoal">
                  {outreachGoal.totalSent.toLocaleString("pt-BR")} feitas<br />
                  <span className="text-[#645845]">{outreachGoal.totalRemaining.toLocaleString("pt-BR")} faltam</span>
                </p>
              </div>
              <Progress value={outreachGoal.progressPercent} className="h-4 rounded-[2px] border-2 border-black bg-charcoal/10" indicatorClassName="bg-burnt-yellow" />
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {[
                { icon: MessageSquare, label: "Enviadas", value: outreachGoal.totalSent.toLocaleString("pt-BR") },
                { icon: Target, label: "Faltam", value: outreachGoal.totalRemaining.toLocaleString("pt-BR") },
                { icon: CalendarDays, label: "Dias restantes", value: outreachGoal.daysRemaining.toLocaleString("pt-BR") },
                { icon: Send, label: "Hoje", value: outreachGoal.sentToday.toLocaleString("pt-BR") },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-[2px] border-2 border-black bg-[#f7f1e6] p-3">
                  <Icon className="mb-2 h-4 w-4 text-charcoal" />
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#645845]">{label}</p>
                  <p className="mt-1 text-2xl font-black text-charcoal">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2px] border-2 border-black bg-charcoal p-4 text-white">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">Mural de envios</p>
                <h3 className="text-lg font-black">Mensagens por perfil interno</h3>
              </div>
              <Trophy className="h-5 w-5 text-burnt-yellow" />
            </div>
            <div className="space-y-2">
              {outreachGoal.operatorScores.length === 0 ? (
                <p className="rounded-[2px] border border-white/20 p-3 text-sm font-semibold text-white/70">Nenhum envio registrado ainda.</p>
              ) : (() => {
                const totalSent = outreachGoal.operatorScores.reduce((sum, op) => sum + op.totalSent, 0);
                const displayScores = outreachGoal.operatorScores.slice(0, 8);
                return displayScores.map((operator, index) => {
                  const width = totalSent > 0 ? Math.round((operator.totalSent / totalSent) * 100) : 0;
                  return (
                    <div key={operator.operatorId ?? operator.operatorEmail ?? index} className="rounded-[2px] border border-white/15 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">{index + 1}. {operator.operatorName}</p>
                          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">{operator.operatorEmail ?? "sem email"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-burnt-yellow">{operator.totalSent}</p>
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">hoje {operator.sentToday}</p>
                        </div>
                      </div>
                      <div className="mt-2 h-2 rounded-[2px] bg-white/10">
                        <div className="h-full rounded-[2px] bg-burnt-yellow transition-all duration-300" style={{ width: `${Math.max(0, width)}%` }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </section>

      <OperationalCommandBar
        title="Barra de comando"
        statusLabel="Rodada manual"
        statusValue={`${outreachGoal.totalRemaining.toLocaleString("pt-BR")} pendências de primeiro envio`}
        statusDetail="A aba principal mostra toda a base local elegível, ordenada por engajamento e prioridade. Os já enviados ficam em uma aba separada."
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

      <section className="hidden sm:block bloco-concreto border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] sm:p-5 rounded-[2px]">
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
                { icon: CheckCircle2, title: "Registrar", detail: "O sistema registra o envio automaticamente e abre a próxima." },
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

      <div className={cn("sticky z-20 space-y-3", isMobileViewport ? "top-20" : "top-24")}>
        <div className="radar-outline-card flex items-center gap-2 rounded-[2px] border-2 border-black bg-white p-2 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">
          <Button
            variant="outline"
            className={cn(
              "h-10 flex-1 border-2 border-black bg-white text-[10px] font-black uppercase tracking-[0.16em] text-charcoal rounded-[2px]",
              activeTab === "nao_enviadas" && "bg-burnt-yellow"
            )}
            onClick={() => setActiveTab("nao_enviadas")}
          >
            Lista principal
            <span className="ml-2">{outreachGoal.totalRemaining.toLocaleString("pt-BR")}</span>
          </Button>
          <Button
            variant="outline"
            className={cn(
              "h-10 flex-1 border-2 border-black bg-white text-[10px] font-black uppercase tracking-[0.16em] text-charcoal rounded-[2px]",
              activeTab === "enviadas" && "bg-burnt-yellow"
            )}
            onClick={() => setActiveTab("enviadas")}
          >
            Já enviadas
            <span className="ml-2">{outreachGoal.totalSent.toLocaleString("pt-BR")}</span>
          </Button>
        </div>

        {isMobileViewport ? (
          <div className="radar-outline-card overflow-x-auto rounded-[2px] border-2 border-black bg-white p-2 shadow-[4px_4px_0px_0px_rgba(11,11,11,1)]">
            <div className="flex min-w-max gap-2">
              {[
                { id: "todos", label: "Base local", count: outreachGoal.totalRemaining },
                { id: "quentes", label: "Urgentes", count: stats.quentes },
                { id: "sem_responsavel", label: "Sem dono", count: stats.semResponsavel },
                { id: "prontas_aviso", label: "Preparadas", count: stats.prontasAviso },
                { id: "confirmacao_pendente", label: "Confirmação pendente", count: stats.confirmacoesPendentes },
              ].map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  className={cn(
                    "h-10 shrink-0 border-2 border-black bg-white px-3 text-[10px] font-black uppercase tracking-[0.14em] text-charcoal rounded-[2px]",
                    priorityFilter === item.id && "bg-burnt-yellow"
                  )}
                  onClick={() => setPriorityFilter(item.id)}
                >
                  {item.label}
                  <span className="ml-2">{item.count}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <OperationalStatusBar
            className="border-2 border-black bg-white rounded-[2px] shadow-[4px_4px_0px_0px_rgba(11,11,11,1)]"
            activeFilter={priorityFilter}
            onFilter={(id) => setPriorityFilter(id)}
            metrics={[
              { id: "todos", label: "Geral", value: outreachGoal.totalRemaining, tone: "neutral", icon: Users, filterable: true },
              { id: "quentes", label: "Urgentes", value: stats.quentes, tone: "hot", icon: Flame, filterable: true },
              { id: "sem_responsavel", label: "Sem Dono", value: stats.semResponsavel, tone: stats.semResponsavel > 0 ? "warning" : "neutral", icon: AlertCircle, filterable: true },
              { id: "pendente_resposta", label: "Esperando", value: stats.esperando, tone: "neutral", icon: Clock, filterable: true },
              { id: "sem_encaminhamento", label: "A encaminhar", value: stats.aEncaminhar, tone: stats.aEncaminhar > 0 ? "info" : "neutral", icon: CheckCircle2, filterable: true },
              { id: "prontas_aviso", label: "Prontas p/ Aviso", value: stats.prontasAviso, tone: "neutral", icon: Send, filterable: true },
              { id: "confirmacao_pendente", label: "Confirmação pendente", value: stats.confirmacoesPendentes, tone: stats.confirmacoesPendentes > 0 ? "warning" : "neutral", icon: AlertCircle, filterable: true },
            ]}
            actions={null}
          />
        )}

        {isCompact && !isMobileViewport ? (
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
                  { id: "todos", label: "Base local", count: outreachGoal.totalRemaining },
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
        {activeTab === "nao_enviadas" ? (
          teamPriorityPeople.length > 0 ? (
          viewMode === "cards" ? (
            <>
              <div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 2xl:grid-cols-4", isCompact ? "xl:grid-cols-2" : "xl:grid-cols-3")}>
                {displayedTeamPriorityPeople.map((person, index) => (
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
              {visibleListCount < teamPriorityPeople.length ? (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    className="h-11 border-2 border-black bg-white px-5 text-xs font-black uppercase tracking-[0.18em] text-charcoal rounded-[2px]"
                    onClick={loadMoreVisiblePeople}
                  >
                    Carregar mais {Math.min(LIST_RENDER_BATCH, teamPriorityPeople.length - visibleListCount)}
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <PersonOperationalList 
                people={displayedTeamPriorityPeople}
                onOpenDetails={handleOpenDetails}
                onAssume={(id) => handleAssume(id)}
                isAssuming={isPending}
                onActionComplete={handleActionComplete}
                instagramSend={instagramSend}
              />
              {visibleListCount < teamPriorityPeople.length ? (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    className="h-11 border-2 border-black bg-white px-5 text-xs font-black uppercase tracking-[0.18em] text-charcoal rounded-[2px]"
                    onClick={loadMoreVisiblePeople}
                  >
                    Carregar mais {Math.min(LIST_RENDER_BATCH, teamPriorityPeople.length - visibleListCount)}
                  </Button>
                </div>
              ) : null}
            </>
          )
        ) : (
          <EmptyState 
            type="empty_filter"
            title="Nenhuma pessoa elegível neste filtro"
            description="A equipe já limpou a rodada principal deste filtro. Abra a aba de enviados para acompanhar quem está esperando retorno."
            primaryAction={
              <Button variant="outline" onClick={() => { setQuery(""); setPriorityFilter("todos"); }}>
                Limpar filtros
              </Button>
            }
          />
        )
        ) : waitingPeople.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Nova aba</p>
                <h3 className="text-xl font-black text-charcoal">Pessoas já enviadas</h3>
              </div>
              <Badge className="rounded-[2px] border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-charcoal hover:bg-white">
                {outreachGoal.totalSent.toLocaleString("pt-BR")} enviadas
              </Badge>
            </div>
            <PersonOperationalList
              people={displayedWaitingPeople}
              onOpenDetails={handleOpenDetails}
              onAssume={(id) => handleAssume(id)}
              isAssuming={isPending}
              onActionComplete={handleActionComplete}
              instagramSend={instagramSend}
            />
            {visibleListCount < waitingPeople.length ? (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="h-11 border-2 border-black bg-white px-5 text-xs font-black uppercase tracking-[0.18em] text-charcoal rounded-[2px]"
                  onClick={loadMoreVisiblePeople}
                >
                  Carregar mais {Math.min(LIST_RENDER_BATCH, waitingPeople.length - visibleListCount)}
                </Button>
              </div>
            ) : null}
          </section>
        ) : (
          <EmptyState
            type="empty_filter"
            title="Nenhuma pessoa enviada ainda"
            description="Quando a equipe registrar um envio, o contato aparece nesta aba para acompanhamento."
            primaryAction={
              <Button variant="outline" onClick={() => setActiveTab("nao_enviadas")}>
                Voltar para a lista principal
              </Button>
            }
          />
        )}
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
        templates={templates}
        instagramSend={instagramSend}
      />

      {/* Governance Banner */}
      <footer className="bloco-concreto mt-12 flex flex-col items-center gap-6 rounded-[2px] border-2 border-black bg-charcoal p-6 text-white shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] md:flex-row">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Info className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-lg">Diretrizes de Engajamento Ético</h4>
          <p className="text-white/80 text-sm leading-relaxed">
            O Radar de Base utiliza sinais de interação pública para sugerir a melhor conversa dentro da base local importada ou autorizada. 
            É proibido o uso destes dados para profiling ideológico ou pressão eleitoral. 
            Não há coleta em massa de seguidores; toda conversa deve ser manual e respeitar o pedido de privacidade (&quot;Não Abordar&quot;).
          </p>
        </div>
      </footer>
    </div>
  );
}
