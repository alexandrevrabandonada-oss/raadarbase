"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  MoveLeft, 
  MoveRight, 
  Flame, 
  User, 
  Instagram, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  Users,
  Search,
  Filter,
  Check,
  ChevronDown,
  LayoutDashboard,
  History,
  AlertTriangle,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Radar Design System
import { RadarPageHeader } from "@/components/radar/radar-page-header";
import { RadarMetricCard } from "@/components/radar/radar-metric-card";
import { ActionButtonGroup } from "@/components/radar/action-button-group";
import { PersonScoreBadge } from "@/components/radar/person-score-badge";
import { OperationalAlert } from "@/components/radar/operational-alert";
import { ContextHelpCard } from "@/components/radar/context-help-card";
import { LightweightOnboarding } from "@/components/radar/onboarding/lightweight-onboarding";
import { GamefulMetricCard } from "@/components/radar/gameful-metric-card";
import { MissionCard } from "@/components/radar/mission-card";
import { EthicalGuardrailBanner } from "@/components/radar/ethical-guardrail-banner";

import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PersonQuickSheet } from "@/components/radar/person-quick-sheet";
import { formatDateTime } from "@/lib/mock-data";
import { 
  assumeTaskResponsible, 
  recordPersonResponse, 
  updateOutreachTaskStatus,
  trackOperationalEvent
} from "@/app/actions";
import { PERSON_RESPONSE_OPTIONS } from "@/lib/data/person-profile";
import { normalizeOutreachColumn, nextBoardColumn, outreachBoardColumns, outreachColumnLabels, type BoardColumnId } from "@/lib/outreach-workflow";
import type { OutreachTask, PersonResponseKind, PriorityPerson } from "@/lib/types";
import { balanceTasks } from "./team-actions";
import { cn } from "@/lib/utils";

import { StatusBadge } from "@/components/status-badge";
import { mapPersonToJourney } from "@/lib/data/journey-mapper";
import { JourneyProgress } from "@/components/radar/journey-progress";


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
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"todos" | "meus" | "sem_responsavel" | "stale" | "encaminhar" | "waiting_3d" | "waiting_7d">("todos");
  const [operatorFilter, setOperatorFilter] = useState<string>("todos");
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [isDistributing, setIsDistributing] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PriorityPerson | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
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
    setCopiedTaskId(task.id);
    setFeedback({ text: "Mensagem copiada para o clipboard.", type: "success" });
    window.setTimeout(() => setCopiedTaskId(null), 2000);
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
    <div className="flex flex-col gap-6 pb-20">
      <RadarPageHeader 
        title="Mural de Missões"
        description="Visualize cada vínculo como uma missão cooperativa, da preparação ao fechamento do ciclo."
        actions={
          <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" className="font-bold border-zinc-200" onClick={() => runBalance()}>
               Dividir Trabalho
             </Button>
          </div>
        }
      />

      {/* Indicadores do Topo */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <GamefulMetricCard label="Ativas" value={stats.total} icon={<LayoutDashboard className="h-4 w-4" />} compact layout="split" className="border-zinc-200 bg-white shadow-none" />
        <GamefulMetricCard label="Sem dono" value={stats.unassigned} icon={<Users className="h-4 w-4" />} compact layout="split" className="border-zinc-200 bg-white shadow-none" />
        <GamefulMetricCard label="Em espera" value={stats.waiting} icon={<History className="h-4 w-4" />} tone="amber" compact layout="split" className="shadow-none" />
        <GamefulMetricCard label="Travadas" value={stats.stale} icon={<Clock className="h-4 w-4" />} tone="amber" compact layout="split" className="shadow-none" />
        <GamefulMetricCard label="Encaminhar" value={stats.needReferral} icon={<CheckCircle2 className="h-4 w-4" />} tone="indigo" compact layout="split" className="shadow-none" />
      </div>

      {/* 2. Filtros e Gestão */}
      <div className="flex flex-col lg:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
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
                className={cn("h-8 font-bold px-4 rounded-full", filterType === f.id ? "bg-black" : "border-zinc-200")}
                onClick={() => setFilterType(f.id as typeof filterType)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-64 space-y-2">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Por operador</label>
          <select
            className="w-full h-8 rounded-full border border-zinc-200 bg-white px-4 text-xs font-bold"
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
        <Card className="border-indigo-100 bg-indigo-50/20">
          <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                <Users className="h-4 w-4" /> Balanceamento de equipe
              </h3>
              <p className="text-[10px] font-bold text-indigo-700/70 uppercase tracking-widest">Selecione operadores para distribuir as {stats.unassigned} missões sem dono.</p>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
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
                        "h-8 px-3 text-[10px] font-black uppercase transition-all rounded-lg",
                        isSelected ? "bg-indigo-600 text-white border-indigo-700 shadow-md" : "bg-white border-zinc-200 text-zinc-600"
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
                      className={cn("bg-black text-white font-black h-10 px-8 shadow-lg shadow-black/10", (isDistributing || selectedOperators.length === 0) && "opacity-50 pointer-events-none")}
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
        </Card>
      ) : null}

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-6 -mx-4 px-4 scrollbar-thin scrollbar-thumb-zinc-200">
        <div className="flex gap-4 min-w-max">
          {groupedColumns.map(({ id, label, description, tasks: columnTasks }) => (
            <div key={id} className="w-[340px] shrink-0 space-y-4">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">
                    {label} <span className="ml-1 text-zinc-400">({columnTasks.length})</span>
                  </h3>
                  <p className="mt-1 text-[10px] font-medium text-zinc-400">{description}</p>
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
                "space-y-3 p-2 rounded-2xl min-h-[420px] transition-colors",
                id === "concluir" ? "bg-rose-50/30" : "bg-zinc-50/50"
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

  return (
    <MissionCard
      person={task.priority}
      primaryActionLabel="Abrir missão"
      onPrimaryAction={onOpenDetails}
      className={cn(task.isStale ? "bg-rose-50/30 ring-1 ring-rose-100" : "ring-1 ring-zinc-100")}
      footer={
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                {boardMicroLabels[task.boardColumn]}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] font-black uppercase tracking-widest",
                  task.responsibleId ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-rose-200 bg-rose-50 text-rose-700",
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

          <div className="space-y-2 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-400">Auditoria curta</span>
              <span className="text-[10px] font-bold text-zinc-500">{task.title}</span>
            </div>
            <p className="text-[10px] font-medium leading-relaxed text-zinc-500 italic">
              &quot;{task.priority.nextAction || task.notes || "Aguardando próxima definição..."}&quot;
            </p>
          </div>

          <ActionButtonGroup
            personId={task.personId}
            instagramUsername={task.person?.username}
            onAssume={onAssume}
            onCopyDM={onCopyDM}
            onRegisterResponse={onRegisterResponse}
            canAssume={!task.responsibleId}
            canCopyDM={!!task.priority.suggestedMessage}
            canRegisterResponse
            className="w-full justify-start"
          />

          <div className="grid grid-cols-2 gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[9px] font-black uppercase"
              onClick={onMoveBack}
              disabled={savingTaskId === task.id || !canMoveBack}
            >
              <MoveLeft className="mr-1 h-3 w-3" /> Recuar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[9px] font-black uppercase"
              onClick={onMoveForward}
              disabled={savingTaskId === task.id || !canMoveForward}
            >
              Avançar <MoveRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          {task.boardColumn === "esperando_resposta" ? (
            <div className="space-y-1.5 border-t border-zinc-100 pt-3">
              <p className="mb-1 text-[8px] font-black uppercase tracking-widest text-zinc-400">Ações rápidas</p>
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
                    className="h-6 rounded-md border-zinc-200 px-2 text-[8px] font-bold uppercase hover:bg-zinc-100"
                    onClick={() => onQuickResponse(action.id as PersonResponseKind)}
                    disabled={savingTaskId === task.id}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3">
            <select
              id={`response-select-${task.id}`}
              className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2 text-[10px] font-bold focus:ring-2 focus:ring-indigo-500"
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
