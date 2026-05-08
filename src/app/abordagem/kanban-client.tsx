"use client";

import { useMemo, useState } from "react";
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
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDateTime } from "@/lib/mock-data";
import { assumeTaskResponsible, recordPersonResponse, updateOutreachTaskStatus } from "@/app/actions";
import { PERSON_RESPONSE_OPTIONS } from "@/lib/data/person-profile";
import { normalizeOutreachColumn, nextBoardColumn, outreachBoardColumns, outreachColumnLabels, type BoardColumnId } from "@/lib/outreach-workflow";
import type { OutreachTask, PersonResponseKind, PriorityPerson } from "@/lib/types";
import { balanceTasks } from "./team-actions";
import { cn } from "@/lib/utils";

type Operator = { id: string; email: string; full_name: string | null; role: string };

type BoardTask = OutreachTask & {
  boardColumn: BoardColumnId;
  priority: PriorityPerson | null;
  isStale: boolean; // Over 48h
};

function mapTasks(initialTasks: OutreachTask[], priorityPeople: PriorityPerson[]): BoardTask[] {
  const priorityByPersonId = new Map(priorityPeople.map((person) => [person.id, person]));
  const now = new Date().getTime();
  const fortyEightHours = 48 * 60 * 60 * 1000;

  return initialTasks.map((task) => {
    const updatedAt = new Date(task.updatedAt || task.createdAt).getTime();
    const boardColumn = normalizeOutreachColumn(task.column);
    return {
      ...task,
      boardColumn,
      priority: priorityByPersonId.get(task.personId) ?? null,
      isStale: (now - updatedAt) > fortyEightHours && boardColumn !== "entrou_na_base" && boardColumn !== "nao_abordar"
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
  const [filterType, setFilterType] = useState<"todos" | "meus" | "sem_responsavel" | "stale" | "encaminhar">("todos");
  const [operatorFilter, setOperatorFilter] = useState<string>("todos");
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [isDistributing, setIsDistributing] = useState(false);

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

  const groupedColumns = useMemo(
    () =>
      outreachBoardColumns.map((column) => {
        let filtered = tasks.filter((task) => task.boardColumn === column);
        
        // Apply Header Filters
        if (filterType === "meus") filtered = filtered.filter(t => t.responsibleId === "me"); // Placeholder for session
        if (filterType === "sem_responsavel") filtered = filtered.filter(t => !t.responsibleId);
        if (filterType === "stale") filtered = filtered.filter(t => t.isStale);
        if (filterType === "encaminhar") filtered = filtered.filter(t => t.boardColumn === "precisa_encaminhar");

        // Apply Operator Filter
        if (operatorFilter !== "todos") {
           filtered = filtered.filter(t => t.responsibleId === operatorFilter);
        }

        return {
          column,
          label: outreachColumnLabels[column],
          tasks: filtered,
        };
      }),
    [tasks, filterType, operatorFilter],
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
          return "esperando_resposta" as BoardColumnId;
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
    <div className="space-y-8 pb-10">
      {/* 1. Cabeçalho Operacional */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Tarefas Ativas", value: stats.total, icon: Users, color: "zinc" },
          { label: "Sem Responsável", value: stats.unassigned, icon: AlertCircle, color: "orange" },
          { label: "Aguardando Resposta", value: stats.waiting, icon: Clock, color: "amber" },
          { label: "Precisa Encaminhar", value: stats.needReferral, icon: ExternalLink, color: "emerald" },
          { label: "Paradas > 48h", value: stats.stale, icon: ShieldAlert, color: "rose" },
        ].map((s) => (
          <Card key={s.label} className={cn("border-none shadow-sm", `bg-${s.color}-50 text-${s.color}-900`)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={cn("h-4 w-4", `text-${s.color}-600`)} />
                <span className="text-2xl font-black">{s.value}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2. Filtros e Gestão */}
      <div className="flex flex-col lg:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
            <Filter className="h-3 w-3" /> Filtros Operacionais
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "todos", label: "Tudo" },
              { id: "meus", label: "Minhas" },
              { id: "sem_responsavel", label: "Órfãs" },
              { id: "stale", label: "Atrasadas" },
              { id: "encaminhar", label: "Encaminhar" },
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
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Por Operador</label>
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
      <Card className="border-indigo-100 bg-indigo-50/20">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-indigo-950 flex items-center gap-2">
              <Users className="h-4 w-4" /> Balanceamento de Equipe
            </h3>
            <p className="text-[10px] font-bold text-indigo-700/70 uppercase tracking-widest">Selecione os operadores para distribuir as {stats.unassigned} tarefas órfãs.</p>
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

          <Button 
            onClick={runBalance} 
            disabled={isDistributing || selectedOperators.length === 0}
            className="bg-black text-white font-black h-10 px-8 shadow-lg shadow-black/10"
          >
            {isDistributing ? "Distribuindo..." : "Distribuir Agora"}
          </Button>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-6 -mx-4 px-4 scrollbar-thin scrollbar-thumb-zinc-200">
        <div className="flex gap-4 min-w-[2000px]">
          {groupedColumns.map(({ column, label, tasks: columnTasks }) => (
            <div key={column} className="w-[300px] shrink-0 space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">
                  {label} <span className="ml-1 text-zinc-400">({columnTasks.length})</span>
                </h3>
                {columnTasks.some(t => t.isStale) && (
                   <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                           <ShieldAlert className="h-3 w-3 text-rose-500" />
                        </TooltipTrigger>
                        <TooltipContent>Há tarefas paradas nesta coluna.</TooltipContent>
                      </Tooltip>
                   </TooltipProvider>
                )}
              </div>

              <div className={cn(
                "space-y-3 p-2 rounded-2xl min-h-[500px] transition-colors",
                column === "nao_abordar" ? "bg-rose-50/50" : "bg-zinc-50/50"
              )}>
                {columnTasks.map((task) => (
                  <Card 
                    key={task.id} 
                    className={cn(
                      "border shadow-sm group hover:border-indigo-400 transition-all",
                      task.isStale ? "border-rose-200 shadow-rose-100/50" : "border-zinc-100"
                    )}
                  >
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                           <p className="text-xs font-black text-indigo-950 truncate">@{task.person?.username || "usuario"}</p>
                           <p className="text-[10px] font-bold text-zinc-500 truncate mt-0.5">{task.title}</p>
                        </div>
                        <div className="flex items-center gap-1">
                           {task.priority?.temperature === "quente" && <Flame className="h-3 w-3 text-orange-500 fill-orange-500" />}
                           <Badge variant="outline" className="text-[9px] font-black tracking-tighter h-4 px-1">
                             {task.priority?.priorityScore || 0}
                           </Badge>
                        </div>
                      </div>

                      <div className="space-y-1.5 py-2 border-y border-zinc-50">
                        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                           <span>Responsável</span>
                           <span className={cn(task.responsibleId ? "text-indigo-600" : "text-rose-500")}>
                             {task.priority?.responsibleName || "Órfã"}
                           </span>
                        </div>
                        <p className="text-[10px] font-medium leading-tight text-zinc-600 line-clamp-2 italic">
                          &quot;{(task.priority?.nextAction || task.notes) || "Sem próxima ação"}&quot;
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                         <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button  size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-indigo-600">
                                    <Link href={`/pessoas/${task.personId}`}><Search className="h-3 w-3" /></Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Abrir Ficha</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button  size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-pink-600">
                                    <a href={`https://instagram.com/${task.person?.username}`} target="_blank" rel="noreferrer"><Instagram className="h-3 w-3" /></a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Abrir Instagram</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-6 w-6 text-zinc-400 hover:text-emerald-600"
                                    onClick={() => copyMessage(task)}
                                    disabled={!task.priority?.suggestedMessage}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copiar DM</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                         </div>

                         {!task.responsibleId && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-[9px] font-black uppercase text-indigo-600 hover:bg-indigo-50"
                              onClick={() => runAssumeTask(task.id)}
                            >
                              Assumir
                            </Button>
                         )}
                      </div>

                      <div className="grid grid-cols-2 gap-1 pt-1 border-t border-zinc-50">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[9px] font-black uppercase"
                          onClick={() => updateTaskColumn(task.id, nextBoardColumn(task.boardColumn, -1))}
                          disabled={savingTaskId === task.id || outreachBoardColumns.indexOf(task.boardColumn) === 0}
                        >
                          <MoveLeft className="mr-1 h-3 w-3" /> Voltar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[9px] font-black uppercase"
                          onClick={() => updateTaskColumn(task.id, nextBoardColumn(task.boardColumn, 1))}
                          disabled={savingTaskId === task.id || outreachBoardColumns.indexOf(task.boardColumn) === outreachBoardColumns.length - 1}
                        >
                          Avançar <MoveRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>

                      <div className="space-y-2 pt-2 bg-zinc-50/80 -mx-3 -mb-3 p-3 rounded-b-xl border-t border-zinc-100">
                        <select
                          className="w-full h-8 rounded-lg border border-zinc-200 bg-white px-2 text-[10px] font-bold"
                          value={responseValues[task.id] ?? "revisar_depois"}
                          onChange={(e) => setResponseValues(prev => ({ ...prev, [task.id]: e.target.value as PersonResponseKind }))}
                        >
                          {PERSON_RESPONSE_OPTIONS.map(opt => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                          ))}
                        </select>
                        <Button 
                          size="sm" 
                          className="w-full h-8 text-[10px] font-black uppercase bg-zinc-800 hover:bg-black"
                          onClick={() => runResponse(task)}
                          disabled={savingTaskId === task.id}
                        >
                          Confirmar Resposta
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {feedback && (
        <div className={cn(
          "fixed bottom-6 right-6 px-6 py-3 rounded-2xl shadow-2xl font-black text-sm z-50 animate-in fade-in slide-in-from-bottom-4",
          feedback.type === "error" ? "bg-rose-600 text-white" : "bg-black text-white"
        )}>
          {feedback.text}
        </div>
      )}
    </div>
  );
}
