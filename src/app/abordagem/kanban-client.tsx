"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { 
  MoveLeft, 
  MoveRight, 
  Instagram, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  Users,
  Filter,
  Check,
  LayoutDashboard,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Radar Design System
import { ActionButtonGroup } from "@/components/radar/action-button-group";
import { PersonScoreBadge } from "@/components/radar/person-score-badge";
import { ContextHelpCard } from "@/components/radar/context-help-card";
import { LightweightOnboarding } from "@/components/radar/onboarding/lightweight-onboarding";
import { GamefulMetricCard } from "@/components/radar/gameful-metric-card";
import { GamefulHero, GamefulHeroBadge } from "@/components/radar/gameful-hero";
import { MissionCard } from "@/components/radar/mission-card";
import { EthicalGuardrailBanner } from "@/components/radar/ethical-guardrail-banner";
import { OperationalCommandBar } from "@/components/radar/operational-command-bar";

import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PersonQuickSheet } from "@/components/radar/person-quick-sheet";
import { 
  assumeTaskResponsible, 
  recordPersonResponse, 
  updateOutreachTaskStatus,
  trackOperationalEvent
} from "@/app/actions";
import { PERSON_RESPONSE_OPTIONS } from "@/lib/data/person-profile";
import { normalizeOutreachColumn, nextBoardColumn, outreachBoardColumns, type BoardColumnId } from "@/lib/outreach-workflow";
import type { OutreachTask, PersonResponseKind, PriorityPerson } from "@/lib/types";
import { balanceTasks } from "./team-actions";
import { cn } from "@/lib/utils";
import { useCompactMode } from "@/hooks/use-compact-mode";
import { CompactModeToggle } from "@/components/radar/compact-mode-toggle";
import {
  getPriorityPersonHoldState,
  getPriorityPersonHoldText,
  getPriorityPersonMissionNextStep,
  getPriorityPersonMissionReason,
  getPriorityPersonMissionTypeLabel,
} from "@/lib/missions/priority-person-mission-adapter";


type Operator = { id: string; email: string; full_name: string | null; role: string };

type BoardTask = OutreachTask & {
  boardColumn: BoardColumnId;
  priority: PriorityPerson | null;
  isStale: boolean; // Over 48h
  waitingStatus: "normal" | "followup" | "review" | "archive" | null;
};

type MissionBoardColumn = "preparar" | "conversar" | "registrar" | "encaminhar" | "concluir";

const missionBoardColumns: Array<{
  id: MissionBoardColumn;
  label: string;
  description: string;
  columns: BoardColumnId[];
}> = [
  {
    id: "preparar",
    label: "Preparar",
    description: "Definir dono, contexto e abertura da missão.",
    columns: ["para_abordar"],
  },
  {
    id: "conversar",
    label: "Conversar",
    description: "Abrir contato e sustentar a conversa com cuidado.",
    columns: ["mensagem_enviada", "esperando_resposta"],
  },
  {
    id: "registrar",
    label: "Registrar",
    description: "Consolidar resposta e decidir o rumo imediato.",
    columns: ["respondeu"],
  },
  {
    id: "encaminhar",
    label: "Encaminhar",
    description: "Levar interesse para o destino certo.",
    columns: ["precisa_encaminhar", "convidado"],
  },
  {
    id: "concluir",
    label: "Concluir",
    description: "Fechar ciclo, pausar ou proteger vínculo.",
    columns: ["entrou_na_base", "primeira_acao_feita", "nao_insistir", "nao_abordar"],
  },
];

const boardMicroLabels: Record<BoardColumnId, string> = {
  para_abordar: "Preparar terreno",
  mensagem_enviada: "Mensagem enviada",
  esperando_resposta: "Aguardando retorno",
  respondeu: "Resposta recebida",
  precisa_encaminhar: "Pedir destino",
  convidado: "Convite ativo",
  entrou_na_base: "Vínculo confirmado",
  primeira_acao_feita: "Primeira ação",
  nao_insistir: "Pausa operacional",
  nao_abordar: "Proteção ética",
};

function mapTasks(initialTasks: OutreachTask[], priorityPeople: PriorityPerson[]): BoardTask[] {
  const priorityByPersonId = new Map(priorityPeople.map((person) => [person.id, person]));
  const now = new Date().getTime();
  const fortyEightHours = 48 * 60 * 60 * 1000;

  return initialTasks.map((task) => {
    const updatedAt = new Date(task.updatedAt || task.createdAt).getTime();
    const boardColumn = normalizeOutreachColumn(task.column);
    const ageHours = (now - updatedAt) / (1000 * 60 * 60);
    
    let waitingStatus: BoardTask["waitingStatus"] = null;
    if (boardColumn === "esperando_resposta") {
      if (ageHours < 24) waitingStatus = "normal";
      else if (ageHours < 72) waitingStatus = "followup";
      else if (ageHours < 168) waitingStatus = "review";
      else waitingStatus = "archive";
    }

    return {
      ...task,
      boardColumn,
      priority: priorityByPersonId.get(task.personId) ?? null,
      isStale: (now - updatedAt) > fortyEightHours && boardColumn !== "entrou_na_base" && boardColumn !== "nao_abordar",
      waitingStatus
    };
  });
}

export function KanbanClient({
  initialTasks,
  priorityPeople,
  operators = [],
}: {
  initialTasks: OutreachTask[];
  priorityPeople: PriorityPerson[];
  operators?: Operator[];
}) {
  const [tasks, setTasks] = useState<BoardTask[]>(() => mapTasks(initialTasks, priorityPeople));
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [responseValues, setResponseValues] = useState<Record<string, PersonResponseKind>>({});
  const [filterType, setFilterType] = useState<"todos" | "meus" | "sem_responsavel" | "stale" | "encaminhar" | "waiting_3d" | "waiting_7d">("todos");
  const [operatorFilter, setOperatorFilter] = useState<string>("todos");
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [isDistributing, setIsDistributing] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PriorityPerson | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isNotebookViewport, setIsNotebookViewport] = useState(false);
  
  const hasTrackedMount = useRef(false);

  useEffect(() => {
    if (!hasTrackedMount.current) {
      trackOperationalEvent("kanban_viewed");
      hasTrackedMount.current = true;
    }
  }, []);

  useEffect(() => {
    if (hasTrackedMount.current) {
      trackOperationalEvent("filter_applied", undefined, { filter: filterType });
    }
  }, [filterType]);

  useEffect(() => {
    const updateViewport = () => {
      setIsNotebookViewport(window.innerWidth < 1366);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const handleOpenDetails = (person: PriorityPerson) => {
    setSelectedPerson(person);
    setIsSheetOpen(true);
  };

  // Derived stats for header
  const stats = useMemo(() => {
    const active = tasks.filter(t => t.boardColumn !== "entrou_na_base" && t.boardColumn !== "nao_abordar");
    return {
      total: active.length,
      unassigned: active.filter(t => !t.responsibleId).length,
      waiting: active.filter(t => t.boardColumn === "esperando_resposta").length,
      needReferral: active.filter(t => t.boardColumn === "precisa_encaminhar").length,
      stale: active.filter(t => t.isStale).length
    };
  }, [tasks]);

  const listPeople = useMemo(() => {
    return tasks
      .filter(t => t.boardColumn !== "entrou_na_base" && t.boardColumn !== "nao_abordar")
      .map(t => t.priority)
      .filter((p): p is PriorityPerson => p !== null)
      .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
  }, [tasks]);

  const handleNextPerson = () => {
    if (!selectedPerson) return;
    const currentIndex = listPeople.findIndex(p => p.id === selectedPerson.id);
    if (currentIndex !== -1 && currentIndex < listPeople.length - 1) {
      setSelectedPerson(listPeople[currentIndex + 1]);
    } else {
      setIsSheetOpen(false);
      setSelectedPerson(null);
    }
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter((task) => task.boardColumn !== "entrou_na_base" || filterType === "todos" || filterType === "meus");

    if (filterType === "meus") filtered = filtered.filter((t) => t.responsibleId === "me");
    if (filterType === "sem_responsavel") filtered = filtered.filter((t) => !t.responsibleId);
    if (filterType === "stale") filtered = filtered.filter((t) => t.isStale);
    if (filterType === "encaminhar") filtered = filtered.filter((t) => t.boardColumn === "precisa_encaminhar");
    if (filterType === "waiting_3d") {
      filtered = filtered.filter(
        (t) => t.boardColumn === "esperando_resposta" && (t.waitingStatus === "review" || t.waitingStatus === "archive"),
      );
    }
    if (filterType === "waiting_7d") {
      filtered = filtered.filter((t) => t.boardColumn === "esperando_resposta" && t.waitingStatus === "archive");
    }
    if (operatorFilter !== "todos") {
      filtered = filtered.filter((t) => t.responsibleId === operatorFilter);
    }

    return filtered;
  }, [tasks, filterType, operatorFilter]);

  const groupedColumns = useMemo(
    () =>
      missionBoardColumns.map((column) => ({
        id: column.id,
        label: column.label,
        description: column.description,
        tasks: filteredTasks.filter((task) => column.columns.includes(task.boardColumn)),
      })),
    [filteredTasks],
  );
  const {
    hydrated: compactHydrated,
    manualCompact,
    isCompact,
    setCompact,
  } = useCompactMode({
    storageKey: "radar_abordagem_compacto",
    autoCompact: isNotebookViewport || filteredTasks.length > 18,
  });

  async function updateTaskColumn(taskId: string, nextColumnValue: BoardColumnId) {
    const previous = tasks;
    setSavingTaskId(taskId);
    setFeedback(null);
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, boardColumn: nextColumnValue, column: nextColumnValue } : task)),
    );

    const result = await updateOutreachTaskStatus(taskId, nextColumnValue);
    if (!result.ok) {
      setTasks(previous);
      setFeedback({ text: result.error, type: "error" });
    } else {
      setFeedback({ text: result.message, type: "success" });
    }
    setSavingTaskId(null);
    setTimeout(() => setFeedback(null), 3000);
  }

  async function runResponse(task: BoardTask) {
    const responseType = responseValues[task.id] ?? "revisar_depois";
    setSavingTaskId(task.id);
    const result = await recordPersonResponse(task.personId, responseType);
    
    if (!result.ok) {
      setFeedback({ text: result.error, type: "error" });
      setSavingTaskId(null);
      return;
    }

    const boardColumn = (() => {
      switch (responseType) {
        case "nao_respondeu":
        case "revisar_depois":
        case "manter_aguardando":
        case "resposta_tardia":
          return "esperando_resposta" as BoardColumnId;
        case "arquivar_sem_retorno":
          return "nao_insistir" as BoardColumnId;
        case "respondeu_bem":
          return "respondeu" as BoardColumnId;
        case "pediu_informacoes":
          return "mensagem_enviada" as BoardColumnId;
        case "quer_entrar_grupo":
        case "quer_ir_evento":
          return "convidado" as BoardColumnId;
        case "quer_conhecer_missao_eluta":
        case "quer_ajudar_online":
        case "quer_ajudar_presencial":
          return "precisa_encaminhar" as BoardColumnId;
        case "nao_quer_contato":
          return "nao_abordar" as BoardColumnId;
      }
    })();

    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, boardColumn, column: boardColumn, updatedAt: new Date().toISOString() } : item)),
    );
    setFeedback({ text: result.message, type: "success" });
    setSavingTaskId(null);
    setTimeout(() => setFeedback(null), 3000);
  }

  async function copyMessage(task: BoardTask) {
    if (!task.priority?.suggestedMessage) return;
    await navigator.clipboard.writeText(task.priority.suggestedMessage);
    setFeedback({ text: "Mensagem copiada para o clipboard.", type: "success" });
    setTimeout(() => setFeedback(null), 3000);
  }

  async function runAssumeTask(taskId: string) {
    setSavingTaskId(taskId);
    const result = await assumeTaskResponsible(taskId);
    if (!result.ok) {
      setFeedback({ text: result.error, type: "error" });
    } else {
      setFeedback({ text: result.message, type: "success" });
      setTasks(current => current.map(t => t.id === taskId ? { ...t, responsibleId: "me" } : t));
    }
    setSavingTaskId(null);
    setTimeout(() => setFeedback(null), 3000);
  }

  async function runBalance() {
    if (selectedOperators.length === 0) {
      setFeedback({ text: "Selecione operadores para balancear.", type: "error" });
      return;
    }
    setIsDistributing(true);
    const result = await balanceTasks(selectedOperators);
    if (result.ok) {
      setFeedback({ text: result.message, type: "success" });
      window.location.reload();
    } else {
      setFeedback({ text: result.error, type: "error" });
    }
    setIsDistributing(false);
  }

  return (
    <div className="flex flex-col gap-6 pb-32 lg:pb-20">
      <GamefulHero
        eyebrow="Fluxo cooperativo"
        title="Mural de Missões"
        description={isCompact ? "Organize dono, fase e próximo passo sem perder o fluxo do mural." : "Organize cada vínculo como uma missão em andamento, com leitura clara de dono, fase e próximo passo."}
        compact={isCompact}
        titleClassName={cn("radar-title-display max-w-[8ch]", isCompact ? "text-[2.8rem] lg:text-[3.2rem] 2xl:text-6xl" : "text-4xl lg:text-5xl 2xl:text-6xl")}
        descriptionClassName={cn(isCompact ? "max-w-[28rem]" : "max-w-[34rem]")}
        badges={
          <>
            <GamefulHeroBadge light>{stats.total} missões ativas</GamefulHeroBadge>
            <GamefulHeroBadge light>{stats.unassigned} sem dono</GamefulHeroBadge>
            <GamefulHeroBadge light>{stats.stale} paradas</GamefulHeroBadge>
          </>
        }
        metricsClassName={cn("sm:grid-cols-2", isCompact ? "2xl:grid-cols-4" : "xl:grid-cols-4")}
        metrics={
          <>
            <GamefulMetricCard label="Ativas" value={stats.total} icon={<LayoutDashboard className="h-4 w-4" />} compact layout="split" />
            <GamefulMetricCard label="Sem dono" value={stats.unassigned} icon={<Users className="h-4 w-4" />} compact layout="split" />
            <GamefulMetricCard label="Em espera" value={stats.waiting} icon={<History className="h-4 w-4" />} tone="amber" compact layout="split" />
            <GamefulMetricCard label="Encaminhar" value={stats.needReferral} icon={<CheckCircle2 className="h-4 w-4" />} compact layout="split" />
          </>
        }
        actions={
          <div className="flex items-center gap-3">
             <Button size="sm" className="h-11 bg-[#13212b] px-5 font-black uppercase tracking-[0.16em] text-white hover:bg-[#0d1820]" onClick={() => runBalance()}>
               Dividir Trabalho
             </Button>
             {compactHydrated ? (
               <CompactModeToggle enabled={manualCompact} autoCompact={isNotebookViewport || filteredTasks.length > 18} onToggle={setCompact} />
             ) : null}
          </div>
        }
        aside={!isCompact ? (
          <div className="radar-panel-dark space-y-4 rounded-[24px] border border-[#24313b] p-5 text-white">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">Regra do mural</p>
              <h2 className="text-2xl font-black text-white">O próximo passo precisa aparecer.</h2>
              <p className="text-sm leading-6 text-zinc-300">
                Assuma missão, registre resposta e mova a etapa. Quando travar, resolva contexto antes de insistir.
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-3 2xl:grid-cols-1">
              <GamefulMetricCard label="Travadas" value={stats.stale} icon={<Clock className="h-4 w-4" />} tone="dark" compact layout="split" />
              <GamefulMetricCard label="Espera longa" value={tasks.filter((task) => task.waitingStatus === "review" || task.waitingStatus === "archive").length} icon={<History className="h-4 w-4" />} tone="dark" compact layout="split" />
              <GamefulMetricCard label="Prontas p/ assumir" value={stats.unassigned} icon={<Users className="h-4 w-4" />} tone="dark" compact layout="split" />
            </div>
          </div>
        ) : null}
      />

      <OperationalCommandBar
        title="Barra de comando"
        statusLabel="Travas visíveis"
        statusValue={`${stats.stale} paradas / ${stats.unassigned} sem dono`}
        statusDetail="Use a barra para puxar o que trava o fluxo antes de descer para o mural completo."
        primaryAction={{
          label: "Dividir Trabalho",
          onClick: runBalance,
          icon: Users,
        }}
        secondaryActions={[
          {
            label: "Ver Travadas",
            onClick: () => setFilterType("stale"),
            icon: Clock,
          },
          {
            label: "Ver Sem Dono",
            onClick: () => setFilterType("sem_responsavel"),
            icon: Filter,
          },
        ]}
        shortcutAction={{
          label: "Abrir Minha Jornada",
          href: "/minha-fila",
        }}
      />

      {/* 2. Filtros e Gestão */}
      <div className="sticky top-24 z-20 radar-outline-card grid gap-4 rounded-[24px] border border-[#d8c7ac] bg-[rgba(255,250,242,0.96)] p-4 backdrop-blur lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
        <div className="flex-1 space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#7d6f59]">
            <Filter className="h-3 w-3" /> Filtros de missão
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "todos", label: "Tudo" },
              { id: "meus", label: "Minhas" },
              { id: "sem_responsavel", label: "Sem dono" },
              { id: "stale", label: "Travadas" },
              { id: "encaminhar", label: "Encaminhar" },
              { id: "waiting_3d", label: "Espera 3+d" },
              { id: "waiting_7d", label: "Espera 7+d" },
            ].map(f => (
              <Button
                key={f.id}
                variant={filterType === f.id ? "default" : "outline"}
                size="sm"
                className={cn("h-9 rounded-full px-4 font-black uppercase tracking-[0.12em]", filterType === f.id ? "bg-[#13212b] text-white" : "border-[#d4c4a8] bg-white text-[#13212b] hover:bg-[rgba(212,182,120,0.08)]")}
                onClick={() => setFilterType(f.id as typeof filterType)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="w-full space-y-2 lg:w-64">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#7d6f59]">Por operador</label>
          <select
            className="h-10 w-full rounded-full border border-[#d4c4a8] bg-white px-4 text-xs font-bold text-[#13212b]"
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
          >
            <option value="todos">Todos os Operadores</option>
            {operators.map(op => (
              <option key={op.id} value={op.id}>{op.full_name || op.email.split("@")[0]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Painel de Balanceamento */}
      {stats.unassigned > 0 ? (
        <details className="radar-outline-card border-[#d5b378] bg-[rgba(212,182,120,0.12)]" open={!isCompact}>
          <summary className="cursor-pointer list-none px-4 py-4 text-sm font-black text-[#13212b]">
            Balanceamento de equipe
          </summary>
          <CardContent className="flex flex-col items-center justify-between gap-6 border-t border-[#d5b378] p-4 md:flex-row">
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 text-sm font-black text-[#13212b]">
                <Users className="h-4 w-4" /> Balanceamento de equipe
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7d6f59]">Selecione operadores para distribuir as {stats.unassigned} missões sem dono.</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
              {operators.map(op => {
                 const isSelected = selectedOperators.includes(op.id);
                 return (
                    <Button
                      key={op.id}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOperators(prev => 
                        isSelected ? prev.filter(id => id !== op.id) : [...prev, op.id]
                      )}
                      className={cn(
                        "h-8 rounded-lg px-3 text-[10px] font-black uppercase transition-all",
                        isSelected ? "border-[#13212b] bg-[#13212b] text-white shadow-md" : "border-[#d4c4a8] bg-white text-[#13212b]"
                      )}
                    >
                      {isSelected && <Check className="mr-1 h-3 w-3" />}
                      {op.full_name || op.email.split("@")[0]}
                    </Button>
                 );
              })}
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger render={<div />}>
                  <div className={cn("inline-block", (isDistributing || selectedOperators.length === 0) && "cursor-not-allowed")}>
                    <Button 
                      onClick={runBalance} 
                      className={cn("h-10 bg-[#13212b] px-8 font-black text-white shadow-lg shadow-black/10", (isDistributing || selectedOperators.length === 0) && "pointer-events-none opacity-50")}
                      tabIndex={(isDistributing || selectedOperators.length === 0) ? -1 : 0}
                    >
                      {isDistributing ? "Distribuindo..." : "Distribuir Agora"}
                    </Button>
                  </div>
                </TooltipTrigger>
                {selectedOperators.length === 0 && (
                  <TooltipContent>Selecione ao menos um operador.</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </details>
      ) : null}

      {/* Kanban Board */}
      <div className="-mx-2 overflow-x-auto px-2 pb-6 scrollbar-thin scrollbar-thumb-[#d4c4a8] xl:-mx-4 xl:px-4">
        <div className="flex gap-4 min-w-max">
          {groupedColumns.map(({ id, label, description, tasks: columnTasks }) => (
            <div key={id} className={cn("shrink-0 space-y-4", isCompact ? "w-[272px] xl:w-[288px] 2xl:w-[308px]" : "w-[300px] xl:w-[320px] 2xl:w-[340px]")}>
              <div className="flex items-center justify-between px-2">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#6e604c]">
                    {label} <span className="ml-1 text-[#9b8c74]">({columnTasks.length})</span>
                  </h3>
                  <p className="mt-1 text-[10px] font-medium text-[#8a7962]">{description}</p>
                </div>
                {columnTasks.some(t => t.isStale) && (
                        <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger render={<div />}>
                           <ShieldAlert className="h-3 w-3 text-rose-500" />
                        </TooltipTrigger>
                        <TooltipContent>Há tarefas paradas nesta coluna.</TooltipContent>
                      </Tooltip>
                   </TooltipProvider>
                )}
              </div>

              <div className={cn(
                "min-h-[420px] space-y-3 rounded-[22px] border p-2 transition-colors",
                id === "concluir"
                  ? "border-[#e7d7c7] bg-[rgba(236,224,209,0.72)]"
                  : "border-[#e2d3bb] bg-[rgba(255,250,242,0.82)]"
              )}>
                {columnTasks.map((task) => (
                  <KanbanTaskCard
                    key={task.id}
                    task={task}
                    savingTaskId={savingTaskId}
                    responseValue={responseValues[task.id] ?? "revisar_depois"}
                    onOpenDetails={handleOpenDetails}
                    onAssume={() => runAssumeTask(task.id)}
                    onCopyDM={() => copyMessage(task)}
                    onRegisterResponse={() => document.getElementById(`response-select-${task.id}`)?.focus()}
                    onMoveBack={() => updateTaskColumn(task.id, nextBoardColumn(task.boardColumn, -1))}
                    onMoveForward={() => updateTaskColumn(task.id, nextBoardColumn(task.boardColumn, 1))}
                    onQuickResponse={(value) => {
                      setResponseValues((prev) => ({ ...prev, [task.id]: value }));
                      setTimeout(() => runResponse(task), 100);
                    }}
                    onResponseChange={(value) => setResponseValues((prev) => ({ ...prev, [task.id]: value }))}
                    onConfirmResponse={() => runResponse(task)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isCompact ? (
        <details className="radar-outline-card rounded-[24px] border border-[#d8c7ac] bg-[rgba(255,250,242,0.92)]">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-black text-[#11202a]">
            Abrir leitura complementar do mural
          </summary>
          <div className="space-y-5 border-t border-[#d8c7ac] px-5 py-4">
            <EthicalGuardrailBanner
              tone="zinc"
              eyebrow="Guardrail do mural"
              badgeLabel="Operação humana"
              description="Silêncio também é resposta. Missão boa respeita tempo, consentimento e o ritmo real da conversa."
            />
            <ContextHelpCard 
              title="Como operar o mural"
              whatIsThis="Este mural concentra as missões de vínculo abertas e mostra em que etapa cada uma está."
              whyItMatters="Ele deixa gargalos visíveis, evita que missões se percam e ajuda a coordenação a apoiar o time na hora certa."
              whatToDoNow="Filtre o fluxo, abra um card para registrar resposta e mova a missão para a próxima coluna quando a etapa mudar."
            />
            <LightweightOnboarding 
              screenId="abordagem"
              title="Mural de Missões"
              highlights={[
                { title: "Onde começar", description: "Comece em 'Preparar' para assumir missão, revisar contexto e abrir a abordagem.", icon: Instagram },
                { title: "Ação principal", description: "Mova o card conforme a conversa avança até registro, encaminhamento e fechamento.", icon: MoveRight },
                { title: "Evite este erro", description: "Respeite rigorosamente o status 'Não Abordar'. Ética e consentimento são fundamentais.", icon: ShieldAlert },
              ]}
            />
          </div>
        </details>
      ) : (
        <>
          <EthicalGuardrailBanner
            tone="zinc"
            eyebrow="Guardrail do mural"
            badgeLabel="Operação humana"
            description="Silêncio também é resposta. Missão boa respeita tempo, consentimento e o ritmo real da conversa."
          />

          <ContextHelpCard 
            title="Como operar o mural"
            whatIsThis="Este mural concentra as missões de vínculo abertas e mostra em que etapa cada uma está."
            whyItMatters="Ele deixa gargalos visíveis, evita que missões se percam e ajuda a coordenação a apoiar o time na hora certa."
            whatToDoNow="Filtre o fluxo, abra um card para registrar resposta e mova a missão para a próxima coluna quando a etapa mudar."
          />

          <LightweightOnboarding 
            screenId="abordagem"
            title="Mural de Missões"
            highlights={[
              { title: "Onde começar", description: "Comece em 'Preparar' para assumir missão, revisar contexto e abrir a abordagem.", icon: Instagram },
              { title: "Ação principal", description: "Mova o card conforme a conversa avança até registro, encaminhamento e fechamento.", icon: MoveRight },
              { title: "Evite este erro", description: "Respeite rigorosamente o status 'Não Abordar'. Ética e consentimento são fundamentais.", icon: ShieldAlert },
            ]}
          />
        </>
      )}

      {feedback && (
        <div className={cn(
          "fixed bottom-6 right-6 px-6 py-3 rounded-2xl shadow-2xl font-black text-sm z-50 animate-in fade-in slide-in-from-bottom-4",
          feedback.type === "error" ? "bg-rose-600 text-white" : "bg-black text-white"
        )}>
          {feedback.text}
        </div>
      )}
      <PersonQuickSheet 
        person={selectedPerson}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onNextPerson={handleNextPerson}
        onActionComplete={() => window.location.reload()}
      />
    </div>
  );
}

function KanbanTaskCard({
  task,
  savingTaskId,
  responseValue,
  onOpenDetails,
  onAssume,
  onCopyDM,
  onRegisterResponse,
  onMoveBack,
  onMoveForward,
  onQuickResponse,
  onResponseChange,
  onConfirmResponse,
}: {
  task: BoardTask;
  savingTaskId: string | null;
  responseValue: PersonResponseKind;
  onOpenDetails: (person: PriorityPerson) => void;
  onAssume: () => void;
  onCopyDM: () => void;
  onRegisterResponse: () => void;
  onMoveBack: () => void;
  onMoveForward: () => void;
  onQuickResponse: (value: PersonResponseKind) => void;
  onResponseChange: (value: PersonResponseKind) => void;
  onConfirmResponse: () => void;
}) {
  if (!task.priority) {
    return (
      <Card className="ring-1 ring-zinc-100">
        <CardContent className="space-y-3 p-4">
          <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-[9px] font-black uppercase tracking-widest text-zinc-500">
            {boardMicroLabels[task.boardColumn]}
          </Badge>
          <div>
            <p className="text-sm font-black text-zinc-950">@{task.person?.username || "usuario"}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{task.title}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const canMoveBack = outreachBoardColumns.indexOf(task.boardColumn) !== 0;
  const canMoveForward = outreachBoardColumns.indexOf(task.boardColumn) !== outreachBoardColumns.length - 1;
  const holdState = getPriorityPersonHoldState(task.priority);
  const missionTypeLabel = getPriorityPersonMissionTypeLabel(task.priority);
  const missionReason = getPriorityPersonMissionReason(task.priority);
  const missionNextStep = getPriorityPersonMissionNextStep(task.priority);
  const holdText = getPriorityPersonHoldText(task.priority);
  const blocksContact = holdState === "blocked";

  return (
    <MissionCard
      person={task.priority}
      primaryActionLabel="Abrir missão"
      onPrimaryAction={onOpenDetails}
      className={cn(task.isStale ? "border-rose-200 bg-rose-50/50 ring-1 ring-rose-100" : "border-[#dccdaf] bg-[rgba(255,252,247,0.96)] ring-1 ring-[#ece1d0]")}
      footer={
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-[#dccdaf] bg-white text-[9px] font-black uppercase tracking-widest text-[#8a7962]">
                {boardMicroLabels[task.boardColumn]}
              </Badge>
              {missionTypeLabel ? (
                <Badge variant="outline" className="border-[#d3b98f] bg-[#f7f0e4] text-[9px] font-black uppercase tracking-widest text-[#8f6e2e]">
                  {missionTypeLabel}
                </Badge>
              ) : null}
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] font-black uppercase tracking-widest",
                  task.responsibleId ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[#d5b378] bg-[rgba(212,182,120,0.14)] text-[#8f6e2e]",
                )}
              >
                {task.priority.responsibleName || "Órfã"}
              </Badge>
              {task.waitingStatus ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[8px] font-black uppercase",
                    task.waitingStatus === "normal"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : task.waitingStatus === "followup"
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : task.waitingStatus === "review"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-rose-50 text-rose-700 border-rose-100",
                  )}
                >
                  {task.waitingStatus === "normal"
                    ? "Aguardando normal"
                    : task.waitingStatus === "followup"
                      ? "Revisar depois"
                      : task.waitingStatus === "review"
                        ? "Evitar insistência"
                        : "Arquivar sugerido"}
                </Badge>
              ) : null}
            </div>
            <PersonScoreBadge score={task.priority.priorityScore} temperature={task.priority.temperature} />
          </div>

          {task.isStale ? (
            <EthicalGuardrailBanner
              tone="rose"
              eyebrow="Missão parada"
              badgeLabel="Resolver trava"
              description="Esta missão ficou tempo demais sem movimento. Revisar contexto, responsável e próximo passo antes de insistir."
              className="rounded-2xl p-4"
            />
          ) : null}

          <div className="space-y-2 rounded-2xl border border-[#dccdaf] bg-[rgba(255,252,247,0.9)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-tighter text-[#8a7962]">Auditoria curta</span>
              <span className="text-[10px] font-bold text-[#8a7962]">{task.title}</span>
            </div>
            <p className="text-[10px] font-medium leading-relaxed italic text-[#6e604c]">
              &quot;{missionNextStep || missionReason || task.notes || "Aguardando próxima definição..."}&quot;
            </p>
          </div>

          {blocksContact ? (
            <EthicalGuardrailBanner
              tone="rose"
              eyebrow="Missão bloqueada"
              badgeLabel="Contato pausado"
              description={holdText}
              className="rounded-2xl p-4"
            />
          ) : null}

          <ActionButtonGroup
            personId={task.personId}
            instagramUsername={blocksContact ? undefined : task.person?.username}
            onAssume={onAssume}
            onCopyDM={onCopyDM}
            onRegisterResponse={onRegisterResponse}
            canAssume={!task.responsibleId && !blocksContact}
            canCopyDM={!!task.priority.suggestedMessage && !blocksContact}
            canRegisterResponse
            className="w-full justify-start"
          />

          <div className="grid grid-cols-2 gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[9px] font-black uppercase text-[#13212b] hover:bg-[rgba(212,182,120,0.08)]"
              onClick={onMoveBack}
              disabled={savingTaskId === task.id || !canMoveBack}
            >
              <MoveLeft className="mr-1 h-3 w-3" /> Recuar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[9px] font-black uppercase text-[#13212b] hover:bg-[rgba(212,182,120,0.08)]"
              onClick={onMoveForward}
              disabled={savingTaskId === task.id || !canMoveForward}
            >
              Avançar <MoveRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          {task.boardColumn === "esperando_resposta" ? (
            <div className="space-y-1.5 border-t border-[#e9decd] pt-3">
              <p className="mb-1 text-[8px] font-black uppercase tracking-widest text-[#8a7962]">Ações rápidas</p>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "manter_aguardando", label: "Manter" },
                  { id: "revisar_depois", label: "Revisar" },
                  { id: "arquivar_sem_retorno", label: "Arquivar" },
                  { id: "nao_quer_contato", label: "Não Abordar" },
                ].map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    className="h-6 rounded-md border-[#dccdaf] bg-white px-2 text-[8px] font-bold uppercase text-[#13212b] hover:bg-[rgba(212,182,120,0.08)]"
                    onClick={() => onQuickResponse(action.id as PersonResponseKind)}
                    disabled={savingTaskId === task.id}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2 rounded-2xl border border-[#dccdaf] bg-[rgba(255,252,247,0.9)] p-3">
            <select
              id={`response-select-${task.id}`}
              className="h-8 w-full rounded-lg border border-[#dccdaf] bg-white px-2 text-[10px] font-bold text-[#13212b] focus:ring-2 focus:ring-[#d5b378]"
              value={responseValue}
              onChange={(e) => onResponseChange(e.target.value as PersonResponseKind)}
            >
              {PERSON_RESPONSE_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              className="h-8 w-full bg-zinc-800 text-[10px] font-black uppercase hover:bg-black"
              onClick={onConfirmResponse}
              disabled={savingTaskId === task.id}
            >
              Confirmar resposta
            </Button>
          </div>
        </div>
      }
    />
  );
}
