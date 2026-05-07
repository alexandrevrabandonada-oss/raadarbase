"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Copy, ExternalLink, MoveLeft, MoveRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/mock-data";
import { assumeTaskResponsible, createOutreachTask, recordPersonResponse, updateOutreachTaskStatus, type ActionResult } from "@/app/actions";
import { PERSON_RESPONSE_OPTIONS } from "@/lib/data/person-profile";
import { normalizeOutreachColumn, nextBoardColumn, outreachBoardColumns, outreachColumnLabels, type BoardColumnId } from "@/lib/outreach-workflow";
import type { OutreachTask, PersonResponseKind, PriorityPerson } from "@/lib/types";
import { balanceTasks, bulkAssignTasks } from "./team-actions";

type Operator = { id: string; email: string; full_name: string | null; role: string };

type BoardTask = OutreachTask & {
  boardColumn: BoardColumnId;
  priority: PriorityPerson | null;
};

function mapTasks(initialTasks: OutreachTask[], priorityPeople: PriorityPerson[]): BoardTask[] {
  const priorityByPersonId = new Map(priorityPeople.map((person) => [person.id, person]));
  return initialTasks.map((task) => ({
    ...task,
    boardColumn: normalizeOutreachColumn(task.column),
    priority: priorityByPersonId.get(task.personId) ?? null,
  }));
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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [responseValues, setResponseValues] = useState<Record<string, PersonResponseKind>>({});
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [responsibleFilter, setResponsibleFilter] = useState<string>("todos");
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [isDistributing, setIsDistributing] = useState(false);

  const groupedColumns = useMemo(
    () =>
      outreachBoardColumns.map((column) => {
        let filteredTasks = tasks.filter((task) => task.boardColumn === column);
        if (responsibleFilter === "sem_responsavel") {
          filteredTasks = filteredTasks.filter(task => !task.responsibleId);
        } else if (responsibleFilter === "meus") {
          // This would need session info, but for now lets assume filter by specific ID or placeholder
          filteredTasks = filteredTasks.filter(task => !!task.responsibleId);
        } else if (responsibleFilter !== "todos") {
          filteredTasks = filteredTasks.filter(task => task.responsibleId === responsibleFilter);
        }
        return {
          column,
          label: outreachColumnLabels[column],
          tasks: filteredTasks,
        };
      }),
    [tasks, responsibleFilter],
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
      setFeedback(result.error);
    } else {
      setFeedback(result.message);
    }
    setSavingTaskId(null);
  }

  async function runResponse(task: BoardTask) {
    const responseType = responseValues[task.id] ?? "revisar_depois";
    setSavingTaskId(task.id);
    setFeedback(null);
    const result = await recordPersonResponse(task.personId, responseType);
    if (!result.ok) {
      setFeedback(result.error);
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
      current.map((item) => (item.id === task.id ? { ...item, boardColumn, column: boardColumn } : item)),
    );
    setFeedback(result.message);
    setSavingTaskId(null);
  }

  async function copyMessage(task: BoardTask) {
    if (!task.priority?.suggestedMessage) return;
    await navigator.clipboard.writeText(task.priority.suggestedMessage);
    setCopiedTaskId(task.id);
    setFeedback("Mensagem sugerida copiada.");
    window.setTimeout(() => setCopiedTaskId((current) => (current === task.id ? null : current)), 2000);
  }

  async function ensureTask(task: BoardTask) {
    if (task.id) return;
    const result: ActionResult = await createOutreachTask(task.personId);
    setFeedback(result.ok ? result.message : result.error);
  }

  async function runAssumeTask(taskId: string) {
    setSavingTaskId(taskId);
    setFeedback(null);
    const result = await assumeTaskResponsible(taskId);
    if (!result.ok) {
      setFeedback(result.error);
    } else {
      setFeedback(result.message);
      setTasks(current => current.map(t => t.id === taskId ? { ...t, responsibleId: "me", priority: { ...t.priority!, responsibleName: "Você" } } : t));
    }
    setSavingTaskId(null);
  }

  async function runBalance() {
    if (selectedOperators.length === 0) {
      setFeedback("Selecione operadores para balancear.");
      return;
    }
    setIsDistributing(true);
    const result = await balanceTasks(selectedOperators);
    if (result.ok) {
      setFeedback(result.message);
      window.location.reload(); // Simplest way to refresh all data with updated responsible names
    } else {
      setFeedback(result.error);
    }
    setIsDistributing(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-500/20 bg-emerald-50/10">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm text-emerald-900">Prontas para Agir</CardTitle>
          </CardHeader>
          <CardContent className="py-0 px-4 pb-3">
            <p className="text-2xl font-bold text-emerald-700">{tasks.filter(t => t.boardColumn === "respondeu" || t.boardColumn === "precisa_encaminhar").length}</p>
            <p className="text-[10px] text-emerald-600 uppercase">Pessoas que responderam bem</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-50/10">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm text-amber-900">Aguardando Resposta</CardTitle>
          </CardHeader>
          <CardContent className="py-0 px-4 pb-3">
            <p className="text-2xl font-bold text-amber-700">{tasks.filter(t => t.boardColumn === "esperando_resposta").length}</p>
            <p className="text-[10px] text-amber-600 uppercase">DMs enviadas recentemente</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-50/10">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm text-red-900">Não Abordar</CardTitle>
          </CardHeader>
          <CardContent className="py-0 px-4 pb-3">
            <p className="text-2xl font-bold text-red-700">{tasks.filter(t => t.boardColumn === "nao_abordar").length}</p>
            <p className="text-[10px] text-red-600 uppercase">Respeitar pedido de privacidade</p>
          </CardContent>
        </Card>
        <Card className="border-sky-700/20 bg-sky-50 shadow-sm col-span-1 md:col-span-2">
          <CardContent className="p-3">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div className="flex-1 min-w-[200px]">
                <h2 className="text-sm font-bold text-sky-950 mb-1">Rotina Simplificada</h2>
                <p className="text-xs text-sky-900 leading-relaxed">
                  1. Encontre a pessoa no quadro. 2. Copie a mensagem sugerida. 3. Abra o Instagram e cole. 4. Mova o card.
                </p>
              </div>
              <div className="w-48">
                <label className="text-[10px] font-bold uppercase text-sky-800 block mb-1">Filtrar por Responsável</label>
                <select
                  className="w-full rounded-md border-sky-200 bg-white px-2 py-1 text-xs text-sky-900"
                  value={responsibleFilter}
                  onChange={(e) => setResponsibleFilter(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="sem_responsavel">Sem responsável</option>
                  <option value="meus">Meus (Todos atribuídos)</option>
                  <optgroup label="Operadores">
                    {operators.map(op => (
                      <option key={op.id} value={op.id}>{op.full_name || op.email}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-indigo-950/10 bg-indigo-50/30">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Gestão de Equipe (Piloto)</span>
            <Badge variant="outline" className="text-[10px] uppercase">{tasks.filter(t => !t.responsibleId).length} tarefas órfãs</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-0 px-4 pb-3">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[300px]">
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-2">Selecionar Operadores para Balanceamento</label>
              <div className="flex flex-wrap gap-2">
                {operators.map(op => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setSelectedOperators(prev => 
                      prev.includes(op.id) ? prev.filter(id => id !== op.id) : [...prev, op.id]
                    )}
                    className={`px-2 py-1 rounded-md border text-xs transition-colors ${
                      selectedOperators.includes(op.id) 
                        ? "bg-indigo-600 text-white border-indigo-700" 
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    {op.full_name || op.email.split("@")[0]}
                  </button>
                ))}
              </div>
            </div>
            <Button 
              size="sm" 
              className="bg-indigo-900 text-white"
              onClick={runBalance}
              disabled={isDistributing || selectedOperators.length === 0}
            >
              {isDistributing ? "Distribuindo..." : "Balancear Tarefas Órfãs"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border border-red-500/30 bg-red-50/30 p-3 text-xs text-red-900 flex flex-col gap-1">
        <strong>Atenção: Regras de Ouro do Piloto</strong>
        <ul className="list-disc pl-5">
          <li>A pessoa precisa sentir que foi escutada, não capturada.</li>
          <li>Contato manual, humano e contextual.</li>
          <li>Sem pedido de voto na pré-campanha.</li>
          <li>Respeite não contato. Toda recusa deve virar &quot;Não Abordar&quot;.</li>
        </ul>
      </div>

      {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}

      {tasks.length === 0 && (
        <Alert className="border-amber-200 bg-amber-50/60 mb-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Nenhuma tarefa aberta</AlertTitle>
          <AlertDescription className="text-amber-700">
            O quadro de abordagem está vazio. Para começar, acesse a aba &quot;Pessoas&quot; e adicione tarefas de abordagem para os perfis prioritários.
          </AlertDescription>
        </Alert>
      )}

      <div className="overflow-x-auto pb-3">
        <div className="grid min-w-[1800px] grid-cols-10 gap-4">
          {groupedColumns.map(({ column, label, tasks: columnTasks }) => (
            <Card key={column} className={column === "nao_abordar" ? "min-h-64 border-red-800/20 bg-red-50/60" : "min-h-64"}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {label} <span className="text-sm text-muted-foreground">({columnTasks.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {columnTasks.map((task) => {
                  const person = task.person;
                  const priority = task.priority;
                  return (
                    <div key={task.id} className={`rounded-md border bg-background p-3 ${task.boardColumn === "nao_abordar" ? "border-red-800/30" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold">@{person?.username ?? "sem-usuario"}</p>
                          <p className="mt-1 text-sm">{task.title}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {priority?.themes.includes("quer_evento_campo") && <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">QUER EVENTO</Badge>}
                            {priority?.themes.includes("quer_voluntariado") && <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">QUER VOLUNTARIADO</Badge>}
                            {priority?.themes.includes("quer_missao_eluta") && <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700 border-purple-200">QUER ÉLUTA</Badge>}
                          </div>
                        </div>
                        {priority?.temperature ? (
                          <span className="rounded-md border px-2 py-1 text-[11px] font-medium">
                            {priority.temperature === "quente" ? "Quente" : priority.temperature === "morno" ? "Morno" : "Frio"}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                        <p><strong className="text-foreground">Motivo:</strong> {priority?.priorityReason ?? "Sem motivo calculado ainda."}</p>
                        <p><strong className="text-foreground">Próxima ação:</strong> {(priority?.nextAction ?? task.notes) || "Sem próxima ação definida."}</p>
                        <p className="flex items-center gap-1">
                          <strong className="text-foreground">Responsável:</strong> {priority?.responsibleName ?? "Nenhum"}
                          {!priority?.responsibleName && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-5 px-1.5 text-[9px]"
                              onClick={() => runAssumeTask(task.id)}
                              disabled={savingTaskId === task.id}
                            >
                              Assumir
                            </Button>
                          )}
                        </p>
                        <p><strong className="text-foreground">Última interação:</strong> {priority?.latestInteractionLabel ?? "Sem registro recente"}</p>
                        <p><strong className="text-foreground">Prazo:</strong> {task.dueAt ? formatDateTime(task.dueAt) : "Sem prazo"}</p>
                      </div>

                      <div className="mt-3 grid gap-2">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => updateTaskColumn(task.id, nextBoardColumn(task.boardColumn, -1))}
                            disabled={savingTaskId === task.id || outreachBoardColumns.indexOf(task.boardColumn) === 0}
                          >
                            <MoveLeft data-icon="inline-start" />
                            Voltar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => updateTaskColumn(task.id, nextBoardColumn(task.boardColumn, 1))}
                            disabled={savingTaskId === task.id || outreachBoardColumns.indexOf(task.boardColumn) === outreachBoardColumns.length - 1}
                          >
                            <MoveRight data-icon="inline-start" />
                            Avançar
                          </Button>
                        </div>

                        <select
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                          value={task.boardColumn}
                          onChange={(event) => updateTaskColumn(task.id, event.target.value as BoardColumnId)}
                          disabled={savingTaskId === task.id}
                        >
                          {outreachBoardColumns.map((option) => (
                            <option key={option} value={option}>
                              {outreachColumnLabels[option]}
                            </option>
                          ))}
                        </select>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {person ? (
                            <Button nativeButton={false} size="sm" variant="outline" render={<Link href={`/pessoas/${person.id}`} />}>
                              Ver pessoa
                            </Button>
                          ) : null}
                          {priority?.instagramUrl ? (
                            <Button
                              nativeButton={false}
                              size="sm"
                              variant="outline"
                              render={<Link href={priority.instagramUrl} target="_blank" rel="noreferrer" />}
                            >
                              <ExternalLink data-icon="inline-start" />
                              Abrir Instagram
                            </Button>
                          ) : null}
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => copyMessage(task)}
                          disabled={savingTaskId === task.id || !priority?.suggestedMessage}
                        >
                          <Copy data-icon="inline-start" />
                          {copiedTaskId === task.id ? "Mensagem copiada" : "Copiar mensagem"}
                        </Button>

                        <div className="grid gap-2">
                          <select
                            className="h-9 rounded-md border bg-background px-2 text-sm"
                            value={responseValues[task.id] ?? "revisar_depois"}
                            onChange={(event) =>
                              setResponseValues((current) => ({
                                ...current,
                                [task.id]: event.target.value as PersonResponseKind,
                              }))
                            }
                            disabled={savingTaskId === task.id}
                          >
                            {PERSON_RESPONSE_OPTIONS.map((option) => (
                              <option key={option.key} value={option.key}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <Button type="button" size="sm" className="w-full" onClick={() => runResponse(task)} disabled={savingTaskId === task.id}>
                            Confirmar Resultado
                          </Button>
                        </div>

                        {!task.id ? (
                          <Button type="button" size="sm" variant="outline" onClick={() => ensureTask(task)}>
                            Criar tarefa persistida
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
