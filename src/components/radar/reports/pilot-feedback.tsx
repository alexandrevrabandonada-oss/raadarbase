"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Zap, 
  ShieldAlert, 
  Clock, 
  Layout, 
  Send,
  Download,
  Filter,
  Wrench,
  Archive,
  ArrowRightCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { convertPilotFeedbackToTechnicalTask, exportPilotFeedbackToRetrospective, submitPilotFeedback, updatePilotFeedbackStatus } from "@/app/actions";
import type { AuditLogEntry } from "@/lib/types";
import type { PilotFeedbackLoopItem, PilotFeedbackLoopResult, PilotFeedbackLoopStatus } from "@/lib/data/pilot-feedback-loop";

const FEEDBACK_TYPES = [
  { value: "ux_confuso", label: "Não entendi a tela", icon: HelpCircle },
  { value: "botao_falha", label: "Botão não funcionou", icon: Zap },
  { value: "copy_confuso", label: "Mensagem confusa", icon: MessageSquare },
  { value: "instagram_dif", label: "Dificuldade no Instagram", icon: ShieldAlert },
  { value: "duvida_etica", label: "Dúvida ética", icon: ShieldAlert },
  { value: "fluxo_lento", label: "Fluxo lento", icon: Clock },
  { value: "bug_tecnico", label: "Bug técnico", icon: AlertCircle },
  { value: "sugestao", label: "Sugestão", icon: Layout },
];

const FEEDBACK_STATUS_OPTIONS: Array<{ value: PilotFeedbackLoopStatus; label: string }> = [
  { value: "novo", label: "Novo" },
  { value: "em_analise", label: "Em análise" },
  { value: "resolvido", label: "Resolvido" },
  { value: "adiado", label: "Adiado" },
  { value: "nao_sera_feito", label: "Não será feito" },
];

const FEEDBACK_GROUP_ORDER = ["bug", "duvida_tela", "duvida_etica", "fluxo_lento", "sugestao"] as const;

function getUrgencyLabel(urgency: FeedbackMetadata["urgency"]) {
  if (urgency === "high") return "Crítica";
  if (urgency === "low") return "Baixa";
  return "Média";
}

function getUrgencyClassName(urgency: FeedbackMetadata["urgency"]) {
  if (urgency === "high") return "border-rose-200 bg-rose-50 text-rose-700";
  if (urgency === "low") return "border-zinc-200 bg-zinc-50 text-zinc-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getStatusClassName(status: PilotFeedbackLoopStatus) {
  switch (status) {
    case "resolvido":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "em_analise":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "adiado":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "nao_sera_feito":
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
    case "novo":
    default:
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }
}

function buildRetrospectiveMarkdown(item: PilotFeedbackLoopItem) {
  return [
    "# Feedback exportado para retrospectiva",
    "",
    `## ${item.typeLabel}`,
    "",
    `- Categoria: ${item.categoryLabel}`,
    `- Status atual: ${item.statusLabel}`,
    `- Urgência: ${getUrgencyLabel(item.urgency)}`,
    `- Rota: ${item.route}`,
    `- Registrado em: ${new Date(item.createdAt).toLocaleString("pt-BR")}`,
    item.convertedToTaskAt ? `- Virou tarefa técnica em: ${new Date(item.convertedToTaskAt).toLocaleString("pt-BR")}` : null,
    "",
    "## Descrição",
    "",
    item.description,
  ].filter(Boolean).join("\n");
}

export function PilotFeedbackForm({ currentRoute }: { currentRoute: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [type, setType] = useState<string>("ux_confuso");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await submitPilotFeedback({
        type,
        route: currentRoute,
        description,
        urgency
      });
      if (result.ok) {
        setDone(true);
        setDescription("");
        toast({ title: "Feedback enviado", description: "Ele entrou na fila clara de melhoria da equipe." });
        router.refresh();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Card className="border-emerald-100 bg-emerald-50/50">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-emerald-900 uppercase text-xs tracking-widest">Feedback Enviado!</h3>
            <p className="text-sm text-emerald-700">Obrigado por ajudar a melhorar o Radar.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            onClick={() => setDone(false)}
          >
            Enviar outro
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-zinc-50 border-b border-zinc-100 pb-4">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Reportar Atrito no Piloto
        </CardTitle>
        <CardDescription className="text-[10px] font-bold text-zinc-400 uppercase">Anotamos tudo para a retrospectiva final.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-tight text-zinc-400">Tipo de Problema</label>
              <Select value={type} onValueChange={(v) => setType(v || "ux_confuso")}>
                <SelectTrigger className="h-10 text-xs font-bold border-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-xs font-bold">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-tight text-zinc-400">Urgência</label>
              <Select value={urgency} onValueChange={(v) => setUrgency((v as "low" | "medium" | "high") || "medium")}>
                <SelectTrigger className="h-10 text-xs font-bold border-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-xs font-bold">Baixa</SelectItem>
                  <SelectItem value="medium" className="text-xs font-bold">Média</SelectItem>
                  <SelectItem value="high" className="text-xs font-bold text-rose-600">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-tight text-zinc-400">O que aconteceu?</label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva brevemente o atrito..."
              className="min-h-[100px] text-xs font-medium border-zinc-200 resize-none"
              required
            />
          </div>

          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
            <p className="text-[10px] text-amber-800 leading-tight font-medium">
              <strong>Lembrete Ético:</strong> Não registre conteúdos de mensagens privadas ou dados sensíveis de cidadãos aqui. Foque no funcionamento do sistema.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={loading || !description.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] h-11"
          >
            {loading ? "Enviando..." : "Enviar Feedback"} <Send className="ml-2 h-3 w-3" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface FeedbackMetadata {
  type: string;
  route: string;
  description: string;
  urgency: "low" | "medium" | "high";
  timestamp: string;
}

export function PilotFeedbackList({ feedbacks, feedbackLoop }: { feedbacks: AuditLogEntry[]; feedbackLoop: PilotFeedbackLoopResult }) {
  const router = useRouter();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const filtered = feedbacks.filter(f => {
    if (filter === "all") return true;
    const meta = f.metadata as unknown as FeedbackMetadata;
    return meta?.type === filter;
  });

  const exportMarkdown = () => {
    const header = "# Retrospectiva do Piloto - Feedbacks de Atrito\n\n";
    const body = feedbacks.map(f => {
      const meta = f.metadata as unknown as FeedbackMetadata;
      const typeLabel = FEEDBACK_TYPES.find(t => t.value === meta.type)?.label || meta.type;
      return `### [${meta.urgency?.toUpperCase()}] ${typeLabel}\n- **Rota:** ${meta.route}\n- **Operador:** ${f.actorEmail}\n- **Data:** ${new Date(f.createdAt).toLocaleString()}\n- **Descrição:** ${meta.description}\n`;
    }).join("\n---\n\n");
    
    const blob = new Blob([header + body], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `radar-base-pilot-feedback-${new Date().toISOString().slice(0,10)}.md`;
    a.click();
  };

  const runFeedbackAction = async (key: string, callback: () => Promise<{ ok: boolean; message?: string; error?: string }>) => {
    setBusyKey(key);
    try {
      const result = await callback();
      if (result.ok) {
        toast({ title: "Ciclo atualizado", description: result.message || "Feedback movido no ciclo de melhoria." });
        router.refresh();
      } else {
        toast({ title: "Erro", description: result.error || "Falha ao atualizar feedback.", variant: "destructive" });
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleStatusChange = async (feedbackId: string, status: PilotFeedbackLoopStatus) => {
    await runFeedbackAction(`status-${feedbackId}`, () => updatePilotFeedbackStatus(feedbackId, status));
  };

  const handleConvertToTask = async (item: PilotFeedbackLoopItem) => {
    await runFeedbackAction(`task-${item.id}`, () => convertPilotFeedbackToTechnicalTask(item.id));
  };

  const handleExportToRetrospective = async (item: PilotFeedbackLoopItem) => {
    const markdown = buildRetrospectiveMarkdown(item);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-retrospectiva-${item.id}.md`;
    a.click();
    URL.revokeObjectURL(url);

    await runFeedbackAction(`export-${item.id}`, () => exportPilotFeedbackToRetrospective(item.id));
  };

  return (
    <div className="space-y-6">
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-zinc-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Feedbacks para resolver</CardTitle>
              <CardDescription className="mt-2 text-sm text-zinc-600">
                Cada relato entra em um ciclo visível: chega, ganha leitura, vira correção ou decisão clara e pode alimentar a retrospectiva.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_STATUS_OPTIONS.map((statusOption) => (
                <Badge key={statusOption.value} variant="outline" className={cn("h-7 px-3 text-[10px] font-black uppercase tracking-widest", getStatusClassName(statusOption.value))}>
                  {statusOption.label}: {feedbackLoop.countsByStatus[statusOption.value]}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {feedbackLoop.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
              <Archive className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Nenhum feedback aguardando triagem.</p>
            </div>
          ) : (
            FEEDBACK_GROUP_ORDER.map((category) => {
              const items = feedbackLoop.grouped[category];
              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">{items[0]?.categoryLabel ?? "Grupo"}</h3>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{feedbackLoop.countsByCategory[category]} feedbacks neste grupo</p>
                    </div>
                    <Badge variant="outline" className="h-7 px-3 text-[10px] font-black uppercase tracking-widest border-zinc-200 text-zinc-700">
                      {feedbackLoop.countsByCategory[category]} itens
                    </Badge>
                  </div>

                  {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Sem pendências neste grupo.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {items.map((item) => {
                        const busy = busyKey !== null && busyKey.endsWith(item.id);
                        return (
                          <Card key={item.id} className="border-zinc-100 shadow-sm">
                            <CardContent className="p-4 space-y-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-black uppercase tracking-widest text-zinc-900">{item.typeLabel}</span>
                                    <Badge variant="outline" className={cn("h-6 px-2 text-[9px] font-black uppercase tracking-widest", getUrgencyClassName(item.urgency))}>
                                      {getUrgencyLabel(item.urgency)}
                                    </Badge>
                                    <Badge variant="outline" className={cn("h-6 px-2 text-[9px] font-black uppercase tracking-widest", getStatusClassName(item.status))}>
                                      {item.statusLabel}
                                    </Badge>
                                    <Badge variant="outline" className="h-6 px-2 text-[9px] font-black uppercase tracking-widest border-zinc-200 text-zinc-600">
                                      {item.route}
                                    </Badge>
                                  </div>
                                  <p className="text-sm font-medium leading-relaxed text-zinc-700">{item.description}</p>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                  {new Date(item.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>

                              <div className="grid gap-3 xl:grid-cols-[220px_1fr] xl:items-center">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Status do ciclo</label>
                                  <Select value={item.status} onValueChange={(value) => void handleStatusChange(item.id, value as PilotFeedbackLoopStatus)}>
                                    <SelectTrigger className="h-10 border-zinc-200 text-xs font-bold" disabled={busy}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {FEEDBACK_STATUS_OPTIONS.map((statusOption) => (
                                        <SelectItem key={statusOption.value} value={statusOption.value} className="text-xs font-bold">
                                          {statusOption.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex flex-wrap gap-2 xl:justify-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 border-emerald-200 text-[10px] font-black uppercase tracking-widest text-emerald-700"
                                    disabled={busy || item.status === "resolvido"}
                                    onClick={() => void handleStatusChange(item.id, "resolvido")}
                                  >
                                    Marcar resolvido <CheckCircle2 className="ml-2 h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 border-sky-200 text-[10px] font-black uppercase tracking-widest text-sky-700"
                                    disabled={busy || Boolean(item.actionPlanItemId)}
                                    onClick={() => void handleConvertToTask(item)}
                                  >
                                    {item.actionPlanItemId ? "Tarefa criada" : "Transformar em tarefa técnica"} <Wrench className="ml-2 h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-700"
                                    disabled={busy}
                                    onClick={() => void handleExportToRetrospective(item)}
                                  >
                                    Exportar para retrospectiva <Download className="ml-2 h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                <span>Reportado por: {item.actorEmail || "Equipe"}</span>
                                {item.convertedToTaskAt ? <span className="flex items-center gap-1 text-sky-600"><ArrowRightCircle className="h-3 w-3" /> tarefa técnica criada</span> : null}
                                {item.exportedToRetrospectiveAt ? <span className="text-zinc-500">já exportado para retrospectiva</span> : null}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Voz da Equipe</h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Histórico bruto dos relatos enviados pela equipe.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Select value={filter} onValueChange={(v) => setFilter(v || "all")}>
             <SelectTrigger className="w-[200px] h-9 text-xs font-bold border-zinc-200">
               <Filter className="h-3 w-3 mr-2" />
               <SelectValue placeholder="Filtrar por tipo" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all" className="text-xs font-bold">Todos os Tipos</SelectItem>
               {FEEDBACK_TYPES.map(t => (
                 <SelectItem key={t.value} value={t.value} className="text-xs font-bold">{t.label}</SelectItem>
               ))}
             </SelectContent>
           </Select>
           <Button variant="outline" size="sm" className="h-9 font-black text-[10px] uppercase tracking-widest" onClick={exportMarkdown}>
             Exportar MD <Download className="ml-2 h-3 w-3" />
           </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card className="border-dashed border-zinc-200 bg-zinc-50">
            <CardContent className="py-12 text-center text-zinc-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Nenhum feedback registrado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((f) => {
            const meta = f.metadata as unknown as FeedbackMetadata;
            const typeConfig = FEEDBACK_TYPES.find(t => t.value === meta.type) || { label: meta.type, icon: AlertCircle };
            const Icon = typeConfig.icon;

            return (
              <Card key={f.id} className="border-zinc-100 shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                      meta.urgency === "high" ? "bg-rose-100 text-rose-600" : 
                      meta.urgency === "medium" ? "bg-amber-100 text-amber-600" : "bg-zinc-100 text-zinc-600"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-widest text-zinc-900">{typeConfig.label}</span>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tight h-5 px-2 border-zinc-200">
                            {meta.route}
                          </Badge>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400">
                          {new Date(f.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 font-medium leading-relaxed">
                        {meta.description}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <div className="h-5 w-5 rounded-full bg-zinc-100 flex items-center justify-center">
                           <Clock className="h-3 w-3 text-zinc-400" />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Reportado por: {f.actorEmail || "Sistema"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
