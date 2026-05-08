"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { 
  Copy, 
  ExternalLink, 
  Flag, 
  MessageCircle, 
  ShieldCheck, 
  User, 
  Flame, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Info, 
  ArrowRight,
  ClipboardCheck,
  Instagram,
  UserPlus,
  MessageSquare,
  History,
  Send,
  Milestone
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ActionResult } from "@/app/actions";
import {
  markContactConfirmed,
  markDoNotContact,
  recordPersonReferral,
  recordPersonResponse,
  registerManualDm,
  updatePersonNotes,
  updatePersonReferralStatus,
  assumePersonResponsible,
} from "@/app/actions";
import { formatDateTime } from "@/lib/mock-data";
import { PERSON_RESPONSE_OPTIONS, type PersonOperationalProfile } from "@/lib/data/person-profile";
import type { FieldAgendaEvent } from "@/lib/data/field-agenda";
import type { PersonStatus, PersonReferral, PersonReferralType, PersonReferralStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

function timelineIcon(type: PersonOperationalProfile["timeline"][number]["type"], title: string) {
  const t = title.toLowerCase();
  if (t.includes("coment")) return <MessageSquare className="h-4 w-4" />;
  if (t.includes("story")) return <History className="h-4 w-4" />;
  if (t.includes("dm") || t.includes("mensagem")) return <Send className="h-4 w-4" />;
  if (t.includes("encaminha") || t.includes("referral")) return <Milestone className="h-4 w-4" />;
  if (t.includes("tarefa")) return <ClipboardCheck className="h-4 w-4" />;
  if (t.includes("éLuta")) return <Flame className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

export function PersonActions({
  person,
  profile,
  availableEvents = [],
  referrals = [],
}: {
  person: PersonOperationalProfile["person"];
  profile: PersonOperationalProfile;
  availableEvents?: FieldAgendaEvent[];
  referrals?: PersonReferral[];
}) {
  const [status, setStatus] = useState<PersonStatus>(person.status);
  const [notes, setNotes] = useState(person.notes);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState<"mensagem" | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<PersonReferralType | "">("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [referralNotes, setReferralNotes] = useState("");

  const canApproach = status !== "nao_abordar" && !person.doNotContactReason;
  const nextActionLabel =
    status === "nao_abordar" || person.doNotContactReason
      ? `Não abordar: ${person.doNotContactReason ?? "pessoa pediu para não receber contato."}`
      : profile.priority.nextAction;

  async function copyMessage() {
    if (!profile.priority.suggestedMessage) return;
    await navigator.clipboard.writeText(profile.priority.suggestedMessage);
    setCopied("mensagem");
    setFeedback({ type: "success", text: "Mensagem sugerida copiada." });
    window.setTimeout(() => setCopied(null), 2000);
  }

  function applyResult(result: ActionResult, successText?: string, nextStatus?: PersonStatus) {
    if (result.ok) {
      if (nextStatus) setStatus(nextStatus);
      setFeedback({ type: "success", text: successText ?? result.message });
      return;
    }
    setFeedback({ type: "error", text: result.error });
  }

  function runAction(action: () => Promise<ActionResult>, options?: { successText?: string; nextStatus?: PersonStatus }) {
    startTransition(async () => {
      const result = await action();
      applyResult(result, options?.successText, options?.nextStatus);
    });
  }

  function saveNotes() {
    runAction(() => updatePersonNotes(person.id, notes), { successText: "Notas salvas." });
  }

  return (
    <div className="space-y-8 pb-20">
      {/* 1. Cabeçalho da Ficha */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-black flex items-center justify-center text-white shrink-0 shadow-lg">
            <User className="h-8 w-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight truncate">
              {person.displayName || person.username}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-bold">@{person.username}</Badge>
              <StatusBadge status={status} />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="cursor-help border-orange-200 bg-orange-50 text-orange-700 font-black">
                      Score {profile.priority.priorityScore}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {profile.priority.scoreTooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {profile.priority.responsibleName ? (
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                  Responsável: {profile.priority.responsibleName}
                </Badge>
              ) : (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 px-2 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  onClick={() => runAction(() => assumePersonResponsible(person.id), { successText: "Você assumiu este vínculo." })}
                  disabled={isPending}
                >
                  <UserPlus className="mr-1 h-3 w-3" /> Assumir Vínculo
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {person.username && (
            <Button  variant="outline" className="font-black border-zinc-200">
              <a href={`https://instagram.com/${person.username}`} target="_blank" rel="noreferrer">
                <Instagram className="mr-2 h-4 w-4" /> Instagram
              </a>
            </Button>
          )}
          <Button variant="outline" className="font-black border-zinc-200" onClick={copyMessage} disabled={!profile.priority.suggestedMessage}>
            <Copy className="mr-2 h-4 w-4" /> Copiar DM
          </Button>
          {!profile.priority.responsibleName && (
             <Button className="font-black bg-indigo-600 hover:bg-indigo-700 shadow-md" onClick={() => runAction(() => assumePersonResponsible(person.id))}>
               Assumir
             </Button>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 2. Próxima Melhor Ação - Card Destaque */}
          <Card className="border-2 border-indigo-600 shadow-xl overflow-hidden">
            <div className="bg-indigo-600 px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Próxima Melhor Ação</span>
              <div className="flex items-center gap-2">
                {profile.priority.temperature === "quente" && <Flame className="h-4 w-4 text-orange-400 fill-orange-400" />}
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{profile.priority.scoreLabel}</span>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="text-2xl font-black text-indigo-950 leading-tight mb-4">
                {nextActionLabel}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Motivo</span>
                  <p className="text-xs font-bold text-zinc-700">{profile.priority.priorityReason}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Urgência</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-12 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: `${profile.priority.scoreIntensity}%` }} />
                    </div>
                    <span className="text-xs font-black text-orange-600">{Math.round(profile.priority.scoreIntensity)}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Alertas</span>
                  <div className="flex flex-wrap gap-1">
                    {profile.priority.riskFlags.recentOutreach && (
                      <Badge className="bg-blue-100 text-blue-700 border-none text-[9px] font-black">CONTATO RECENTE</Badge>
                    )}
                    {profile.priority.riskFlags.doNotContact && (
                      <Badge className="bg-rose-100 text-rose-700 border-none text-[9px] font-black">NÃO ABORDAR</Badge>
                    )}
                    {profile.priority.riskFlags.noReferralAfterResponse && (
                      <Badge className="bg-amber-100 text-amber-700 border-none text-[9px] font-black">FALTA ENCAMINHAR</Badge>
                    )}
                    {!profile.priority.riskFlags.recentOutreach && !profile.priority.riskFlags.doNotContact && !profile.priority.riskFlags.noReferralAfterResponse && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-black">CAMINHO LIVRE</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Por que está no radar? */}
          <section className="space-y-4">
            <h2 className="text-lg font-black flex items-center gap-2">
              <Info className="h-5 w-5 text-zinc-400" />
              Por que está no radar?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <p className="text-xs font-bold text-zinc-700 leading-relaxed">{reason}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Mensagem Sugerida */}
          <section className="space-y-4">
            <h2 className="text-lg font-black flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              Mensagem sugerida
            </h2>
            <Card className="bg-indigo-50/50 border-indigo-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="font-black bg-white border-indigo-200 text-indigo-700">
                    CATEGORIA: {profile.compatibleTemplate?.name || "PERSONALIZADA"}
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="h-4 w-4 text-amber-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Revise antes de enviar. Nunca automatize.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm text-sm font-medium leading-relaxed mb-4">
                  {profile.priority.suggestedMessage || "Sem mensagem sugerida para este contexto."}
                </div>
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1">
                     <AlertTriangle className="h-3 w-3" /> Revise antes de enviar
                   </p>
                   <Button onClick={copyMessage} disabled={!profile.priority.suggestedMessage} className="bg-black text-white font-black h-9 px-6">
                     <Copy className="mr-2 h-4 w-4" /> {copied ? "Copiado" : "Copiar Texto"}
                   </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 5. Histórico do Vínculo */}
          <section className="space-y-4">
            <h2 className="text-lg font-black flex items-center gap-2">
              <History className="h-5 w-5 text-zinc-400" />
              Histórico do vínculo
            </h2>
            <div className="relative space-y-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100">
              {profile.timeline.map((item) => (
                <div key={item.id} className="relative pl-12">
                  <div className="absolute left-0 top-1 h-10 w-10 rounded-full bg-white border-2 border-zinc-100 flex items-center justify-center z-10 text-zinc-500">
                    {timelineIcon(item.type, item.title)}
                  </div>
                  <div className="bg-white p-4 rounded-xl border shadow-sm group hover:border-indigo-200 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-black text-zinc-950">{item.title}</p>
                      <time className="text-[10px] font-bold text-zinc-400 uppercase">{formatDateTime(item.occurredAt)}</time>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed">{item.description}</p>
                    {item.badge && (
                      <Badge variant="outline" className="mt-2 text-[9px] font-black tracking-widest uppercase border-zinc-200">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <aside className="lg:col-span-4 space-y-8">
          {/* 6. Ações de Conversa */}
          <Card className="shadow-lg border-zinc-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-black">Resultado da conversa</CardTitle>
              <CardDescription className="text-xs">Registre o que a pessoa disse.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {PERSON_RESPONSE_OPTIONS.map((option) => (
                <Button
                  key={option.key}
                  variant="outline"
                  className="h-auto flex flex-col items-start p-3 text-left border-zinc-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                  disabled={isPending}
                  onClick={() =>
                    runAction(() => recordPersonResponse(person.id, option.key), {
                      successText: `${option.label} registrado.`,
                      nextStatus:
                        option.key === "nao_quer_contato"
                          ? "nao_abordar"
                          : option.key === "nao_respondeu" || option.key === "revisar_depois"
                            ? "abordado"
                            : "respondeu",
                    })
                  }
                >
                  <span className="font-black text-sm group-hover:text-indigo-700">{option.label}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">{option.hint}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card className="border-none bg-black text-white shadow-xl">
             <CardHeader>
               <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400">Ações Rápidas</CardTitle>
             </CardHeader>
             <CardContent className="grid gap-2">
                <Button
                  
                  className="w-full bg-indigo-600 hover:bg-indigo-700 font-black h-12"
                >
                  <a href={`https://instagram.com/${person.username}`} target="_blank" rel="noreferrer">
                    <Instagram className="mr-3 h-5 w-5" /> Abrir no App
                  </a>
                </Button>
                
                <Button 
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black h-12 border-none"
                  onClick={() => runAction(() => registerManualDm(person.id), { nextStatus: "abordado" })}
                  disabled={isPending || !canApproach}
                >
                  <Send className="mr-3 h-5 w-5" /> Registrar DM enviada
                </Button>

                <Button 
                  variant="outline"
                  className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black h-12"
                  onClick={() => runAction(() => markContactConfirmed(person.id, "Instagram"), { nextStatus: "contato_confirmado" })}
                  disabled={isPending || !canApproach}
                >
                  <ShieldCheck className="mr-3 h-5 w-5" /> Confirmar Contato
                </Button>

                <Button 
                   variant="ghost"
                   className="w-full text-zinc-500 hover:text-white hover:bg-rose-600/20 font-bold text-xs h-10"
                   onClick={() => runAction(() => markDoNotContact(person.id), { nextStatus: "nao_abordar" })}
                   disabled={isPending}
                >
                  Marcar como não abordar
                </Button>
             </CardContent>
          </Card>

          {/* 7. Encaminhamentos Ativos */}
          <section className="space-y-4">
             <h2 className="text-base font-black flex items-center gap-2">
               <Milestone className="h-5 w-5 text-indigo-600" />
               Encaminhamentos
             </h2>
             <div className="space-y-4">
                <div className="grid gap-2">
                   <select 
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm font-bold shadow-sm"
                      value={selectedTarget}
                      onChange={(e) => setSelectedTarget(e.target.value as PersonReferralType)}
                    >
                      <option value="">Novo encaminhamento...</option>
                      <option value="evento_campo">Evento / Ação de Campo</option>
                      <option value="voluntariado">Voluntariado</option>
                      <option value="grupo_lista">Grupo / Lista</option>
                      <option value="missao_eluta">Missão ÉLuta</option>
                    </select>

                    {selectedTarget === "evento_campo" && (
                      <select 
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm font-bold shadow-sm"
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                      >
                        <option value="">Selecione o evento...</option>
                        {availableEvents.map(e => (
                          <option key={e.id} value={e.id}>{e.title}</option>
                        ))}
                      </select>
                    )}

                    {selectedTarget && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                        <Textarea 
                          placeholder="Por que está encaminhando?" 
                          className="text-xs min-h-[80px] rounded-xl border-zinc-200"
                          value={referralNotes}
                          onChange={(e) => setReferralNotes(e.target.value)}
                        />
                        <Button 
                          className="w-full font-black bg-black h-10"
                          onClick={() => {
                            runAction(() => recordPersonReferral(person.id, selectedTarget as PersonReferralType, { 
                              targetId: selectedEventId, 
                              notes: referralNotes 
                            }), { successText: "Encaminhamento registrado." });
                            setSelectedTarget("");
                            setSelectedEventId("");
                            setReferralNotes("");
                          }}
                          disabled={isPending || (selectedTarget === "evento_campo" && !selectedEventId)}
                        >
                          Confirmar
                        </Button>
                      </div>
                    )}
                </div>

                {referrals.map(ref => (
                  <Card key={ref.id} className="border-indigo-100 bg-indigo-50/20 overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase text-indigo-700 tracking-widest">
                          {ref.targetType.replace("_", " ")}
                        </span>
                        <Badge className="bg-indigo-600 text-[9px] font-black h-4">
                          {ref.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {ref.targetId && (
                        <p className="text-xs font-bold text-zinc-900 mb-1">
                          {availableEvents.find(e => e.id === ref.targetId)?.title || "Carregando..."}
                        </p>
                      )}
                      
                      {ref.notes && <p className="text-[11px] text-zinc-500 italic leading-relaxed mb-3">&quot;{ref.notes}&quot;</p>}
                      
                      <div className="flex flex-wrap gap-1 mt-2 border-t border-indigo-100 pt-3">
                        {(ref.targetType === "missao_eluta" 
                          ? ["recebeu_link", "acessou", "fez_primeira_missao", "colaborador"]
                          : ["convidado", "confirmou", "compareceu", "recusou"]
                        ).map(s => (
                          <Button 
                            key={s}
                            variant="ghost" 
                            className={cn(
                              "h-7 px-2 text-[9px] font-black uppercase tracking-tighter",
                              ref.status === s ? "bg-indigo-600 text-white hover:bg-indigo-700" : "text-indigo-600 hover:bg-indigo-100"
                            )}
                            onClick={() => runAction(() => updatePersonReferralStatus(ref.id, person.id, s as PersonReferralStatus))}
                            disabled={isPending}
                          >
                            {s.replace("_", " ")}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
             </div>
          </section>

          {/* 8. Notas e Cuidado */}
          <Card className="border-dashed border-zinc-300 bg-zinc-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-zinc-400" />
                Cuidado da base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[10px] font-bold text-zinc-500 leading-tight">
                Anote apenas o necessário para o vínculo. Proibido registrar dados sensíveis ou inferências pessoais.
              </p>
              <Textarea
                className="min-h-[120px] bg-white text-xs font-medium border-zinc-200 focus:ring-black"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ex: Teve interesse na plenária de amanhã..."
              />
              <Button onClick={saveNotes} disabled={isPending} variant="secondary" className="w-full font-black h-10 border shadow-sm">
                Salvar Histórico
              </Button>
            </CardContent>
          </Card>
        </aside>
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
