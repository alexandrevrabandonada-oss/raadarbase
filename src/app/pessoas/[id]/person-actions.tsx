"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { 
  Copy, 
  Flag, 
  MessageCircle, 
  ShieldCheck, 
  Flame, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Info, 
  ClipboardCheck,
  Instagram,
  UserPlus,
  MessageSquare,
  History,
  Send,
  Milestone,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types & Actions
import type { ActionResult } from "@/app/actions";
import {
  updatePersonNotes,
  assumePersonResponsible,
  recordPersonResponse,
  registerManualDm,
  markContactConfirmed,
  markDoNotContact,
  recordPersonReferral,
  updatePersonReferralStatus,
  recordDMPreparedAction,
  confirmDMSentAction,
} from "@/app/actions";
import { containsForbiddenMemoryTerm } from "@/lib/strategic-memory/safety";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/mock-data";
import { PERSON_RESPONSE_OPTIONS, type PersonOperationalProfile } from "@/lib/data/person-profile";
import type { FieldAgendaEvent } from "@/lib/data/field-agenda";
import type { PersonStatus, PersonReferral, PersonReferralType, PersonReferralStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// Radar Design System
import { RadarPageHeader } from "@/components/radar/radar-page-header";
import { PersonScoreBadge } from "@/components/radar/person-score-badge";
import { OperationalAlert } from "@/components/radar/operational-alert";
import { TemperatureBadge } from "@/components/radar/temperature-badge";

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
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState<"mensagem" | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<PersonReferralType | "">("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [referralNotes, setReferralNotes] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "waiting" | "confirmed">("idle");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editedMessage, setEditedMessage] = useState(profile.priority.suggestedMessage || "");

  useEffect(() => {
    setEditedMessage(profile.priority.suggestedMessage || "");
  }, [profile.priority.suggestedMessage]);

  const canApproach = status !== "nao_abordar" && !person.doNotContactReason;
  const contactGuardrailCopy =
    person.doNotContactReason ?? "Pedido de não contato respeitado.";
  const nextActionLabel =
    status === "nao_abordar" || person.doNotContactReason
      ? `Não abordar: ${person.doNotContactReason ?? "pessoa pediu para não receber contato."}`
      : profile.priority.nextAction;

  async function copyMessage() {
    const messageToCopy = editedMessage || profile.priority.suggestedMessage || "";
    if (!messageToCopy) return;
    await navigator.clipboard.writeText(messageToCopy);
    setCopied("mensagem");
    
    // Telemetria
    await recordDMPreparedAction(person.id, "perfil_pessoa", profile.priority.suggestedTemplateId);

    // Abrir Direct do Instagram
    const igUsername = person.username.replace(/^@+/, "");
    const igUrl = profile.priority.instagramUrl?.includes("/direct/t/")
      ? profile.priority.instagramUrl
      : `https://www.instagram.com/direct/t/${igUsername}/`;
    window.open(igUrl, "_blank");

    const expressMode = typeof window !== "undefined" && localStorage.getItem("radar_envio_expresso") === "true";

    if (expressMode) {
      toast({ title: "Envio Expresso Ativo", description: "Mensagem copiada, direct aberto e contato marcado como enviado!" });
      startTransition(async () => {
        const result = await confirmDMSentAction(person.id, "perfil_pessoa", profile.priority.suggestedTemplateId);
        if (result.ok) {
          setCopyStatus("confirmed");
          setStatus("abordado");
        } else {
          toast({ title: "Erro", description: result.error, variant: "destructive" });
        }
      });
    } else {
      setCopyStatus("waiting");
      setShowConfirmDialog(true);
    }
  }

  function handleConfirmSent() {
    runAction(() => confirmDMSentAction(person.id, "perfil_pessoa", profile.priority.suggestedTemplateId), {
      successText: "Status atualizado para 'Aguardando Retorno'.",
      nextStatus: "abordado"
    });
    setCopyStatus("confirmed");
    setShowConfirmDialog(false);
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
      <RadarPageHeader 
        eyebrow={`@${person.username}`}
        title={person.displayName || person.username}
        description={`Ficha operacional completa. Status atual: ${status.replace(/_/g, ' ').toUpperCase()}`}
        compact
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link 
              href="/pessoas" 
              className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto border-2 border-black bg-white text-charcoal font-black rounded-[2px] hover:bg-charcoal/5 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] h-9 px-4 text-xs")}
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar
            </Link>
            {!profile.priority.responsibleName && (
              <Button size="sm" className="w-full sm:w-auto border-2 border-black bg-burnt-yellow text-charcoal font-black rounded-[2px] hover:bg-burnt-yellow/90 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] h-9 px-4 text-xs" onClick={() => runAction(() => assumePersonResponsible(person.id))}>
                Assumir Vínculo
              </Button>
            )}
          </div>
        }
      />

      {/* 1. Cabeçalho da Ficha (Info complementar) */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[2px] border-2 border-black bloco-concreto shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] -mt-4">
        <div className="flex items-center gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <PersonScoreBadge 
                score={profile.priority.priorityScore} 
                temperature={profile.priority.temperature} 
                tooltipText={profile.priority.scoreTooltip}
                riskFlags={profile.priority.riskFlags}
              />
              {profile.priority.responsibleName && (
                <Badge variant="outline" className="bg-charcoal text-white border-2 border-black font-black text-[10px] uppercase rounded-[2px]">
                  Responsável: {profile.priority.responsibleName}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {person.username && (
            <Button
              variant="outline"
              className="font-black border-2 border-black bg-white rounded-[2px] text-charcoal hover:bg-charcoal/5 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
              onClick={() => {
                const igUsername = person.username.replace(/^@+/, "");
                const igUrl = profile.priority.instagramUrl?.includes("/direct/t/")
                  ? profile.priority.instagramUrl
                  : `https://www.instagram.com/direct/t/${igUsername}/`;
                window.open(igUrl, "_blank");
              }}
              disabled={!canApproach}
            >
              <Instagram className="mr-2 h-4 w-4" /> Instagram
            </Button>
          )}
          {editedMessage && (
            <Button 
              variant="outline" 
              className={cn(
                "font-black border-2 border-black bg-white rounded-[2px] text-charcoal hover:bg-charcoal/5 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] transition-colors",
                copyStatus === "waiting" ? "bg-burnt-yellow border-black text-charcoal" : 
                copyStatus === "confirmed" ? "bg-moss/20 border-black text-moss" : ""
              )}
              onClick={copyMessage}
              disabled={!canApproach}
            >
              <Copy className="mr-2 h-4 w-4" /> 
              {copyStatus === "waiting" ? "Preparado..." : copyStatus === "confirmed" ? "Enviado!" : "Copiar e Abrir Direct"}
            </Button>
          )}
        </div>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-md border-2 border-black bg-white rounded-[2px] shadow-[6px_6px_0px_0px_rgba(11,11,11,1)] p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-black text-lg uppercase tracking-tight text-charcoal">
                <Copy className="h-5 w-5 text-charcoal" />
                Confirmar Envio Manual
              </DialogTitle>
              <DialogDescription className="pt-2 font-semibold text-xs text-charcoal/80">
                A mensagem sugerida foi copiada e o Direct foi aberto para @{person.username}. 
                <span className="block mt-2 font-bold text-charcoal bg-burnt-yellow/15 p-3 rounded-[2px] border-2 border-burnt-yellow">
                  Aviso: Confirme abaixo somente após enviar a mensagem manualmente no Instagram.
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <p className="text-xs font-black uppercase tracking-tight text-cement">Já enviou no Instagram?</p>
            </div>
            <DialogFooter className="flex sm:justify-between gap-2 border-t border-black/10 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)}
                className="font-black text-xs uppercase border-2 border-black bg-white hover:bg-charcoal/5 rounded-[2px]"
              >
                Ainda não / Pular
              </Button>
              <Button 
                className="bg-burnt-yellow text-charcoal hover:bg-burnt-yellow/90 border-2 border-black font-black uppercase text-xs tracking-wider px-6 rounded-[2px] shadow-[1px_1px_0px_0px_rgba(11,11,11,1)]"
                onClick={handleConfirmSent}
                disabled={isPending}
              >
                {isPending ? "Processando..." : "Sim, eu já enviei"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 2. Próxima Melhor Ação - Card Destaque */}
          <Card className="border-2 border-black bg-white rounded-[2px] shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] overflow-hidden bloco-concreto">
            <div className="bg-charcoal px-4 py-2 flex items-center justify-between border-b-2 border-black">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Próxima Melhor Ação</span>
              <div className="flex items-center gap-2">
                {profile.priority.temperature === "quente" && <Flame className="h-4 w-4 text-burnt-yellow fill-burnt-yellow" />}
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{profile.priority.scoreLabel}</span>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="text-2xl font-black text-charcoal leading-tight mb-4">
                {nextActionLabel}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t-2 border-black">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-cement uppercase tracking-widest block">Motivo</span>
                  <p className="text-xs font-bold text-charcoal">{profile.priority.priorityReason}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-cement uppercase tracking-widest block">Urgência</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-12 bg-charcoal/10 rounded-full overflow-hidden">
                      <div className="h-full bg-burnt-yellow" style={{ width: `${profile.priority.scoreIntensity}%` }} />
                    </div>
                    <span className="text-xs font-black text-charcoal">{Math.round(profile.priority.scoreIntensity)}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-cement uppercase tracking-widest block">Alertas</span>
                  <div className="flex flex-col gap-2">
                    {profile.priority.riskFlags.recentOutreach && (
                      <OperationalAlert type="contato_recente" />
                    )}
                    {profile.priority.riskFlags.doNotContact && (
                      <OperationalAlert type="nao_abordar" />
                    )}
                    {profile.priority.riskFlags.noReferralAfterResponse && (
                      <OperationalAlert type="precisa_encaminhar" />
                    )}
                    {!profile.priority.riskFlags.recentOutreach && !profile.priority.riskFlags.doNotContact && !profile.priority.riskFlags.noReferralAfterResponse && (
                      <Badge className="rounded-[2px] border border-black bg-moss/20 text-moss text-[9px] font-black w-fit hover:bg-moss/20">CAMINHO LIVRE</Badge>
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
                <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-[2px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">
                  <div className="mt-1 h-2 w-2 rounded-[2px] bg-burnt-yellow border border-black shrink-0" />
                  <p className="text-xs font-semibold text-charcoal leading-relaxed">{reason}</p>
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
            <Card className="border-2 border-black bg-white rounded-[2px] shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] bloco-concreto">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="font-black bg-white border-2 border-black text-charcoal rounded-[2px]">
                    CATEGORIA: {profile.compatibleTemplate?.name || "PERSONALIZADA"}
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="h-4 w-4 text-burnt-yellow cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Revise antes de enviar. Nunca automatize.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <textarea
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  className="w-full min-h-[140px] bg-white p-4 rounded-[2px] border-2 border-black shadow-inner text-sm font-semibold leading-relaxed mb-4 text-charcoal focus:ring-0 focus:outline-none resize-y"
                  disabled={!canApproach}
                  placeholder="Nenhum modelo ideal encontrado. Digite aqui..."
                />
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-bold text-burnt-yellow uppercase tracking-widest flex items-center gap-1">
                     <AlertTriangle className="h-3 w-3 text-burnt-yellow" /> {canApproach ? "Revise antes de enviar" : "Contato bloqueado"}
                   </p>
                   <Button onClick={copyMessage} disabled={!editedMessage || !canApproach} className="border-2 border-black bg-burnt-yellow text-charcoal font-black hover:bg-burnt-yellow/90 h-9 px-6 rounded-[2px] shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">
                     <Copy className="mr-2 h-4 w-4" /> {copied ? "Copiado e Aberto" : "Copiar e Abrir Direct"}
                   </Button>
                </div>
                {!canApproach && (
                  <p className="mt-3 text-[11px] font-bold text-rust">
                    {contactGuardrailCopy}
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 5. Histórico do Vínculo */}
          <section className="space-y-4">
            <h2 className="text-lg font-black flex items-center gap-2">
              <History className="h-5 w-5 text-zinc-400" />
              Histórico do vínculo
            </h2>
            <div className="relative space-y-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-black">
              {profile.timeline.map((item) => (
                <div key={item.id} className="relative pl-12">
                  <div className="absolute left-0 top-1 h-10 w-10 rounded-[2px] bg-white border-2 border-black flex items-center justify-center z-10 text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">
                    {timelineIcon(item.type, item.title)}
                  </div>
                  <div className="bg-white p-4 rounded-[2px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] group hover:bg-burnt-yellow/5 transition-colors">
                    <div className="flex items-center justify-between mb-1 border-b border-black/10 pb-1">
                      <p className="text-sm font-black text-charcoal">{item.title}</p>
                      <time className="text-[10px] font-bold text-cement uppercase">{formatDateTime(item.occurredAt)}</time>
                    </div>
                    <p className="text-xs text-charcoal font-semibold leading-relaxed mt-2">{item.description}</p>
                    {item.badge && (
                      <Badge variant="outline" className="mt-2 text-[9px] font-black tracking-widest uppercase border-2 border-black rounded-[2px] bg-charcoal text-white hover:bg-charcoal">
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
          <Card className="border-2 border-black bg-white rounded-[2px] shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] bloco-concreto">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-black uppercase tracking-tight text-charcoal">Resultado da conversa</CardTitle>
              <CardDescription className="text-xs font-semibold text-cement">Registre o que a pessoa disse.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {PERSON_RESPONSE_OPTIONS.map((option) => (
                <Button
                  key={option.key}
                  variant="outline"
                  className="h-auto flex flex-col items-start p-3 text-left border-2 border-black bg-white rounded-[2px] hover:bg-burnt-yellow/10 hover:shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] transition-all group sm:min-h-[84px] text-charcoal"
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
                  <span className="font-black text-sm">{option.label}</span>
                  <span className="text-[10px] text-cement font-medium leading-tight mt-0.5">{option.hint}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card className="border-2 border-black bg-charcoal text-white rounded-[2px] shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] bloco-concreto">
             <CardHeader>
               <CardTitle className="text-sm font-black uppercase tracking-widest text-white/60">Ações Rápidas</CardTitle>
             </CardHeader>
             <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <Button
                  className="w-full border-2 border-black bg-burnt-yellow text-charcoal hover:bg-burnt-yellow/90 font-black h-12 rounded-[2px] shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
                  disabled={!canApproach}
                >
                  <a
                    className="flex items-center"
                    href={canApproach ? `https://instagram.com/${person.username}` : undefined}
                    target={canApproach ? "_blank" : undefined}
                    rel={canApproach ? "noreferrer" : undefined}
                    onClick={(event) => {
                      if (!canApproach) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <Instagram className="mr-3 h-5 w-5" /> Abrir no App
                  </a>
                </Button>
                
                <Button 
                  className="w-full border-2 border-white/20 bg-white/10 hover:bg-white/20 text-white font-black h-12 rounded-[2px] shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]"
                  onClick={() => runAction(() => registerManualDm(person.id), { nextStatus: "abordado" })}
                  disabled={isPending || !canApproach}
                >
                  <Send className="mr-3 h-5 w-5" /> Registrar DM enviada
                </Button>

                <Button 
                  variant="outline"
                  className="w-full border-2 border-black bg-white text-charcoal hover:bg-charcoal/5 font-black h-12 rounded-[2px] shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
                  onClick={() => runAction(() => markContactConfirmed(person.id, "Instagram"), { nextStatus: "contato_confirmado" })}
                  disabled={isPending || !canApproach}
                >
                  <ShieldCheck className="mr-3 h-5 w-5" /> Confirmar Contato
                </Button>

                <Button 
                   variant="ghost"
                   className="w-full text-white/50 hover:text-white hover:bg-rust/20 border-2 border-transparent hover:border-rust/45 font-bold text-xs h-10 rounded-[2px]"
                   onClick={() => runAction(() => markDoNotContact(person.id), { nextStatus: "nao_abordar" })}
                   disabled={isPending}
                >
                  Marcar como não abordar
                </Button>
                {!canApproach && (
                  <p className="text-[11px] font-bold text-burnt-yellow">
                    {contactGuardrailCopy}
                  </p>
                )}
             </CardContent>
          </Card>

          {/* 7. Encaminhamentos Ativos */}
           <section className="space-y-4">
              <h2 className="text-base font-black flex items-center gap-2 text-charcoal uppercase tracking-tight">
                <Milestone className="h-5 w-5 text-charcoal" />
                Encaminhamentos
              </h2>
              <div className="space-y-4">
                 <div className="grid gap-2">
                    <select 
                       className="w-full rounded-[2px] border-2 border-black bg-white px-3 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-0 text-charcoal"
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
                         className="w-full rounded-[2px] border-2 border-black bg-white px-3 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-0 text-charcoal"
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
                           className={cn(
                             "text-xs min-h-[80px] rounded-[2px] border-2 border-black bg-white text-charcoal",
                             containsForbiddenMemoryTerm(referralNotes).length > 0 && "border-burnt-yellow bg-burnt-yellow/5"
                           )}
                           value={referralNotes}
                           onChange={(e) => setReferralNotes(e.target.value)}
                         />
                         {containsForbiddenMemoryTerm(referralNotes).length > 0 && (
                           <div className="flex items-center gap-2 text-burnt-yellow animate-in fade-in slide-in-from-top-1">
                             <AlertCircle className="h-3 w-3 text-burnt-yellow" />
                             <p className="text-[9px] font-bold uppercase tracking-tight">
                               Evite termos de perfilamento: {containsForbiddenMemoryTerm(referralNotes).join(", ")}
                             </p>
                           </div>
                         )}
                         <Button 
                           className="w-full border-2 border-black bg-burnt-yellow text-charcoal font-black rounded-[2px] shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] h-10 hover:bg-burnt-yellow/90"
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
                   <Card key={ref.id} className="border-2 border-black bg-white rounded-[2px] shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] overflow-hidden bloco-concreto">
                     <div className="p-4">
                       <div className="flex justify-between items-start mb-2 border-b border-black/10 pb-1">
                         <span className="text-[10px] font-black uppercase text-charcoal tracking-widest">
                           {ref.targetType.replace("_", " ")}
                         </span>
                         <Badge className="bg-charcoal text-white rounded-[2px] text-[9px] font-black h-5 border border-black hover:bg-charcoal">
                           {ref.status.toUpperCase()}
                         </Badge>
                       </div>
                       
                       {ref.targetId && (
                         <p className="text-xs font-bold text-charcoal mb-1">
                           {availableEvents.find(e => e.id === ref.targetId)?.title || "Carregando..."}
                         </p>
                       )}
                       
                       {ref.notes && <p className="text-[11px] text-cement font-medium italic leading-relaxed mb-3">&quot;{ref.notes}&quot;</p>}
                       
                       <div className="flex flex-wrap gap-1 mt-2 border-t border-black/10 pt-3">
                         {(ref.targetType === "missao_eluta" 
                           ? ["recebeu_link", "acessou", "fez_primeira_missao", "colaborador"]
                           : ["convidado", "confirmou", "compareceu", "recusou"]
                         ).map(s => (
                           <Button 
                             key={s}
                             variant="ghost" 
                             className={cn(
                               "h-7 px-2 text-[9px] font-black uppercase tracking-tighter rounded-[2px] border",
                               ref.status === s ? "bg-charcoal text-white hover:bg-charcoal border-black" : "border-black/10 text-charcoal hover:bg-charcoal/5"
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
          <Card className="border-2 border-black bg-white rounded-[2px] shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] bloco-concreto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-tight text-charcoal">
                <ClipboardCheck className="h-4 w-4 text-charcoal" />
                Cuidado da base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[10px] font-bold text-cement leading-tight">
                Anote apenas o necessário para o vínculo. Proibido registrar dados sensíveis ou inferências pessoais.
              </p>
              <Textarea
                className={cn(
                  "min-h-[120px] bg-white text-xs font-semibold border-2 border-black rounded-[2px] focus:ring-0",
                  containsForbiddenMemoryTerm(notes).length > 0 && "border-burnt-yellow bg-burnt-yellow/5"
                )}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ex: Teve interesse na plenária de amanhã..."
              />
              {containsForbiddenMemoryTerm(notes).length > 0 && (
                <div className="flex items-center gap-2 text-burnt-yellow animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-3 w-3 text-burnt-yellow" />
                  <p className="text-[10px] font-bold uppercase tracking-tight">
                    Evite termos de perfilamento: {containsForbiddenMemoryTerm(notes).join(", ")}
                  </p>
                </div>
              )}
              <Button onClick={saveNotes} disabled={isPending} variant="outline" className="w-full border-2 border-black bg-white text-charcoal font-black rounded-[2px] hover:bg-charcoal/5 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] h-10">
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
