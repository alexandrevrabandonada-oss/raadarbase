"use client";

import { PriorityPerson, MessageTemplate } from "@/lib/types";
import type { RadarMission } from "@/lib/missions/mission-types";
import {
  Instagram,
  Copy,
  MessageSquare,
  ArrowRight,
  Clock,
  AlertCircle,
  ChevronRight,
  ShieldAlert,
  FastForward,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mapPersonToJourney } from "@/lib/data/journey-mapper";
import { JourneyBar } from "@/components/radar/journey-bar";
import { EthicalGuardrailBanner } from "@/components/radar/ethical-guardrail-banner";

interface QueueCardProps {
  person: PriorityPerson;
  mission?: RadarMission | null;
  onCopyDM: () => void;
  onRegisterResponse: () => void;
  onReferral: () => void;
  onSkip: () => void;
  onNext: () => void;
  copyStatus?: "idle" | "waiting" | "confirmed";
  onConfirmSent?: () => void;
  onCancelCopy?: () => void;
  compact?: boolean;
  contactDisabled?: boolean;
  focusMode?: boolean;
  editedMessage?: string;
  setEditedMessage?: (text: string) => void;
  templates?: MessageTemplate[];
  selectedTemplateId?: string;
  onTemplateChange?: (templateId: string) => void;
}

function resolvePhaseRibbon(person: PriorityPerson) {
  const journey = mapPersonToJourney(
    person.status,
    person.hasPendingTask,
    person.hasReferral,
    person.lastInteractionAt,
  );

  const labelMap = {
    preparar: "Preparar",
    conversar: "Conversar",
    registrar: "Registrar",
    encaminhar: "Encaminhar",
    concluir: "Concluir",
  } as const;

  return {
    journey,
    label: journey.isBlocked ? "Em espera" : labelMap[journey.currentPhase],
  };
}

function progressPercentage(person: PriorityPerson) {
  const journey = mapPersonToJourney(
    person.status,
    person.hasPendingTask,
    person.hasReferral,
    person.lastInteractionAt,
  );
  return Math.max(
    10,
    Math.round(((journey.completedPhases.length + (journey.isBlocked ? 0 : 1)) / 5) * 100),
  );
}

export function QueueCard({
  person,
  mission = null,
  onCopyDM,
  onRegisterResponse,
  onReferral,
  onSkip,
  onNext,
  copyStatus = "idle",
  onConfirmSent,
  onCancelCopy,
  compact = false,
  contactDisabled = false,
  focusMode = false,
  editedMessage = "",
  setEditedMessage,
  templates = [],
  selectedTemplateId = "",
  onTemplateChange,
}: QueueCardProps) {
  const isBlocked = Boolean(contactDisabled || mission?.state === "BLOQUEADA" || mission?.guardrail.blocksContact || person.riskFlags.doNotContact);
  const phase = resolvePhaseRibbon(person);
  const progress = progressPercentage(person);
  const holdState = mission?.state === "BLOQUEADA"
    ? "blocked"
    : mission?.state === "EM_ESPERA"
      ? "waiting"
      : isBlocked
        ? "blocked"
        : person.riskFlags.recentOutreach || person.isPendingResponse
          ? "waiting"
          : "free";
  const holdLabel = isBlocked
    ? mission?.guardrail.message || person.doNotContactReason || "Restrição ética ativa."
    : person.riskFlags.recentOutreach
      ? "Contato recente. Aguarde a janela ética antes de insistir."
      : person.isPendingResponse
        ? "Aguardando retorno da conversa já iniciada."
        : "Caminho livre para avançar nesta pessoa.";
  const quickStepTone = (active: boolean, done: boolean) => cn(
    "flex min-w-0 items-start gap-2 border-2 p-3",
    done
      ? "border-moss bg-moss/10 text-moss"
      : active
        ? "border-black bg-burnt-yellow text-charcoal"
        : "border-cement bg-white/75 text-charcoal",
  );

  return (
    <Card className="bloco-concreto overflow-hidden py-0">
      <CardHeader className="p-0">
        <div className={cn("border-b-2 border-black bg-charcoal text-off-white", compact ? "px-4 py-4 sm:px-5" : "px-6 py-6")}>
          <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", compact ? "mb-4" : "mb-5")}>
            <div className="min-w-0 space-y-3">
              <Badge className="rounded-[2px] border-2 border-burnt-yellow/35 bg-[#1C1C1A] text-burnt-yellow px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] hover:bg-burnt-yellow/10">
                Fase atual: {phase.label}
              </Badge>
              <div className={cn("flex items-center", compact ? "gap-3" : "gap-4")}>
                <div className={cn("flex items-center justify-center rounded-[2px] border-2 border-burnt-yellow bg-[#1C1C1A] font-black text-burnt-yellow shadow-[2px_2px_0px_0px_rgba(242,169,0,0.3)]", compact ? "h-12 w-12 text-base" : "h-14 w-14 text-lg")}>
                  {person.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className={cn("truncate font-black tracking-tight text-white", compact ? "text-xl" : "text-2xl")}>
                    {person.displayName || `@${person.username}`}
                  </h2>
                  <p className="truncate text-sm font-semibold text-zinc-400">@{person.username}</p>
                </div>
              </div>
            </div>

            <div className={cn("w-full rounded-[2px] border-2 border-cement bg-[#1C1C1A]/85 sm:w-auto", compact ? "p-3 sm:min-w-[150px]" : "p-4 sm:min-w-[180px]")}>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">
                Progresso da jornada
              </p>
              <p className={cn("mt-1 font-black leading-none text-white", compact ? "text-2xl" : "text-3xl")}>{progress}%</p>
              <div className="mt-2.5 h-3 rounded-none border border-black bg-charcoal overflow-hidden">
                <div
                  className="h-full bg-burnt-yellow transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {!focusMode && (
            <div className={cn("grid gap-3", compact ? "sm:grid-cols-3" : "md:grid-cols-3")}>
              <div className="rounded-[2px] border border-cement/50 bg-[#1C1C1A]/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">
                  Motivo do aviso
                </p>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-zinc-100">
                  {person.priorityReason}
                </p>
              </div>
              <div className="rounded-[2px] border border-cement/50 bg-[#1C1C1A]/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">
                  Próxima ação
                </p>
                <p className="mt-2 text-xs font-black leading-relaxed text-white">{person.nextAction}</p>
              </div>
              <div className="rounded-[2px] border border-cement/50 bg-[#1C1C1A]/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">
                  Status do envio
                </p>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-zinc-100">{holdLabel}</p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-5", compact ? "p-4 md:p-5" : "p-6 md:p-8")}>
        {focusMode ? (
          <div className="space-y-5">
            <div className="space-y-4">
              <div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-cement">
                    Mensagem para envio individual
                  </label>
                  {templates.length > 0 && onTemplateChange && (
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => onTemplateChange(e.target.value)}
                      className="text-xs font-black uppercase tracking-tight bg-white border-2 border-black rounded-[2px] px-2.5 py-1 text-charcoal focus:ring-0 focus:outline-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
                      disabled={isBlocked}
                    >
                      <option value="">-- Personalizado / Nenhum --</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="relative">
                  {setEditedMessage ? (
                    <textarea
                      value={editedMessage}
                      onChange={(e) => setEditedMessage(e.target.value)}
                      className={cn("w-full rounded-[2px] border-2 border-black bg-white p-5 text-sm font-medium leading-relaxed text-charcoal focus:ring-0 focus:outline-none resize-y", compact ? "min-h-[140px]" : "min-h-[168px]")}
                      disabled={isBlocked}
                      placeholder="Nenhum modelo ideal encontrado. Digite aqui..."
                    />
                  ) : (
                    <div className={cn("rounded-[2px] border-2 border-black bg-white p-5 text-sm font-medium leading-relaxed text-charcoal", compact ? "min-h-[140px]" : "min-h-[168px]")}>
                      {person.suggestedMessage || "Nenhum modelo ideal encontrado para este contexto. Revise a ficha e siga com abordagem manual."}
                    </div>
                  )}
                  {person.suggestedMessage && (
                    <Button
                      size="icon"
                      variant="outline"
                      className={cn(
                        "absolute bottom-3 right-3 h-9 w-9 rounded-[2px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] transition-all",
                        copyStatus === "waiting" ? "bg-burnt-yellow text-charcoal" : "bg-white text-charcoal hover:bg-burnt-yellow",
                      )}
                      onClick={onCopyDM}
                      disabled={isBlocked}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {person.suggestedTemplateName && (
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-cement">
                    Gabarito: {person.suggestedTemplateName}
                  </p>
                )}
              </div>

              {copyStatus === "waiting" && (
                <div className="animate-in fade-in slide-in-from-top-2 rounded-[2px] border-2 border-black bg-charcoal p-4 text-white duration-300 shadow-[3px_3px_0px_0px_rgba(11,11,11,1)]">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-burnt-yellow animate-bounce" />
                    <div className="space-y-3">
                      <p className="text-xs font-bold leading-relaxed text-off-white">
                        Texto copiado e direct aberto. Envie a mensagem no Instagram e marque abaixo.
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          size="sm"
                          className="h-8 flex-1 rounded-[2px] bg-burnt-yellow text-charcoal border-2 border-black hover:bg-burnt-yellow/90 font-black uppercase tracking-wider"
                          onClick={onConfirmSent}
                        >
                          <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                          Marcar como Enviado
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 rounded-[2px] border border-transparent text-white hover:bg-white/10"
                          onClick={onCancelCopy}
                        >
                          Ainda não
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {copyStatus === "confirmed" && (
                <div className="animate-in zoom-in rounded-[2px] border-2 border-moss bg-moss/10 p-4 duration-300">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-moss" />
                      <p className="text-sm font-black text-charcoal">
                        Mensagem enviada. A conversa entrou em acompanhamento.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="border-2 border-black rounded-[2px] bg-white text-charcoal hover:bg-burnt-yellow"
                      onClick={onNext}
                    >
                      Próxima pessoa <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {(person.riskFlags.recentOutreach || person.riskFlags.doNotContact) && (
                <div className="space-y-2">
                  {person.riskFlags.recentOutreach && (
                    <EthicalGuardrailBanner
                      tone="zinc"
                      eyebrow="Janela ética"
                      badgeLabel="Aguardar retorno"
                      description="Houve contato recente. A pessoa segue em espera saudável antes de nova abordagem."
                      icon={AlertCircle}
                      className="rounded-[2px] border-2 border-black bg-white p-3"
                    />
                  )}
                  {person.riskFlags.doNotContact && (
                    <EthicalGuardrailBanner
                      tone="rose"
                      eyebrow="Guardrail ético"
                      badgeLabel="Não abordar"
                      description="Esta pessoa está bloqueada por cuidado ético. Não abrir novo contato até revisão manual."
                      icon={ShieldAlert}
                      className="rounded-[2px] border-2 border-rust bg-rust/10 p-3 text-rust"
                    />
                  )}
                </div>
              )}
            </div>

            <details className="group border-2 border-black bg-white rounded-[2px] p-4 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] [&_summary::-webkit-details-marker]:hidden">
              <summary className="font-black text-xs uppercase tracking-wider text-charcoal flex justify-between items-center cursor-pointer select-none">
                <span>Mais Detalhes & Ações Recomendadas</span>
                <span className="text-[10px] text-cement group-open:hidden">Clique para expandir</span>
              </summary>
              <div className="mt-4 space-y-4 pt-4 border-t-2 border-dashed border-cement/30">
                <div className="rounded-[2px] border-2 border-black bg-white p-4">
                  <JourneyBar {...phase.journey} />
                </div>

                {!isBlocked ? (
                  <div className="rounded-[2px] border-2 border-black bg-[#fff8ed] p-4 shadow-[3px_3px_0px_0px_rgba(11,11,11,0.12)]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Rodada de envio individual</p>
                        <h3 className="mt-1 text-lg font-black tracking-tight text-charcoal">Uma pessoa, uma mensagem, um registro.</h3>
                      </div>
                      <p className="max-w-md text-xs font-semibold leading-5 text-[#645845]">
                        Copia a fala, abre o Direct do Instagram em 1 clique e marca como enviado após o envio manual.
                      </p>
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-3">
                      <div className={quickStepTone(copyStatus === "idle", copyStatus !== "idle")}>
                        <span className="flex size-6 shrink-0 items-center justify-center border-2 border-current text-[10px] font-black">1</span>
                        <span className="min-w-0">
                          <span className="block text-xs font-black uppercase tracking-[0.12em]">Copiar e Abrir</span>
                          <span className="mt-1 block text-xs font-semibold leading-4">Copia o texto e abre o direct.</span>
                        </span>
                      </div>
                      <div className={quickStepTone(copyStatus === "waiting", copyStatus === "confirmed")}>
                        <span className="flex size-6 shrink-0 items-center justify-center border-2 border-current text-[10px] font-black">2</span>
                        <span className="min-w-0">
                          <span className="block text-xs font-black uppercase tracking-[0.12em]">Enviar mensagem</span>
                          <span className="mt-1 block text-xs font-semibold leading-4">Revisar e enviar no chat do Instagram.</span>
                        </span>
                      </div>
                      <div className={quickStepTone(copyStatus === "confirmed", copyStatus === "confirmed")}>
                        <span className="flex size-6 shrink-0 items-center justify-center border-2 border-current text-[10px] font-black">3</span>
                        <span className="min-w-0">
                          <span className="block text-xs font-black uppercase tracking-[0.12em]">Marcar Enviado</span>
                          <span className="mt-1 block text-xs font-semibold leading-4">Confirmar e registrar o envio.</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-4">
                  <div className="rounded-[2px] border-2 border-black bg-burnt-yellow/10 p-4">
                    <div className="mb-2 flex items-center gap-2 text-charcoal">
                      <Sparkles className="h-4 w-4 text-burnt-yellow fill-burnt-yellow/20" />
                      <p className="text-[10px] font-black uppercase tracking-[0.24em]">Ação recomendada</p>
                    </div>
                    <p className="font-black leading-tight text-charcoal text-sm">
                      {mission?.primaryAction.label || (isBlocked ? "Respeitar a trava ética e revisar contexto." : "Abrir Instagram, personalizar a abordagem e registrar o avanço.")}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[2px] border-2 border-black bg-white/70 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">
                        Última interação
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-charcoal">
                        <Clock className="h-4 w-4 text-cement" />
                        {person.latestInteractionLabel}
                      </p>
                    </div>
                    <div className={cn("rounded-[2px] border-2 p-4", holdState === "blocked" ? "border-rust bg-rust/10 text-rust" : holdState === "waiting" ? "border-dark-yellow bg-burnt-yellow/15 text-dark-yellow" : "border-moss bg-moss/10 text-moss")}>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] leading-none mb-2">
                        {holdState === "free" ? "Caminho livre" : "Bloqueio ou espera"}
                      </p>
                      <p className="text-xs font-bold leading-normal">
                        {holdLabel}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </div>
        ) : (
          <>
            <div className={cn("rounded-[2px] border-2 border-black bg-white p-4")}>
              <JourneyBar {...phase.journey} />
            </div>

            {!isBlocked ? (
              <div className="rounded-[2px] border-2 border-black bg-[#fff8ed] p-4 shadow-[3px_3px_0px_0px_rgba(11,11,11,0.12)]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Rodada de envio individual</p>
                    <h3 className="mt-1 text-lg font-black tracking-tight text-charcoal">Uma pessoa, uma mensagem, um registro.</h3>
                  </div>
                  <p className="max-w-md text-xs font-semibold leading-5 text-[#645845]">
                    Copie a fala, personalize no Instagram e confirme apenas depois do envio manual.
                  </p>
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  <div className={quickStepTone(copyStatus === "idle", copyStatus !== "idle")}>
                    <span className="flex size-6 shrink-0 items-center justify-center border-2 border-current text-[10px] font-black">1</span>
                    <span className="min-w-0">
                      <span className="block text-xs font-black uppercase tracking-[0.12em]">Copiar texto</span>
                      <span className="mt-1 block text-xs font-semibold leading-4">Copia o modelo da abordagem.</span>
                    </span>
                  </div>
                  <div className={quickStepTone(copyStatus === "waiting", copyStatus === "confirmed")}>
                    <span className="flex size-6 shrink-0 items-center justify-center border-2 border-current text-[10px] font-black">2</span>
                    <span className="min-w-0">
                      <span className="block text-xs font-black uppercase tracking-[0.12em]">Colar e Enviar</span>
                      <span className="mt-1 block text-xs font-semibold leading-4">Cole no chat do Instagram.</span>
                    </span>
                  </div>
                  <div className={quickStepTone(copyStatus === "confirmed", copyStatus === "confirmed")}>
                    <span className="flex size-6 shrink-0 items-center justify-center border-2 border-current text-[10px] font-black">3</span>
                    <span className="min-w-0">
                      <span className="block text-xs font-black uppercase tracking-[0.12em]">Confirmar envio</span>
                      <span className="mt-1 block text-xs font-semibold leading-4">Marque como enviado no CRM.</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className={cn("grid gap-5", compact ? "2xl:grid-cols-[1.05fr_0.95fr]" : "xl:grid-cols-[1.05fr_0.95fr]")}>
              <div className="space-y-4">
                <div className={cn("rounded-[2px] border-2 border-black bg-burnt-yellow/10 p-4")}>
                  <div className="mb-2 flex items-center gap-2 text-charcoal">
                    <Sparkles className="h-4 w-4 text-burnt-yellow fill-burnt-yellow/20" />
                    <p className="text-[10px] font-black uppercase tracking-[0.24em]">Ação recomendada</p>
                  </div>
                  <p className={cn("font-black leading-tight text-charcoal", compact ? "text-sm" : "text-base")}>
                    {mission?.primaryAction.label || (isBlocked ? "Respeitar a trava ética e revisar contexto." : "Abrir Instagram, personalizar a abordagem e registrar o avanço.")}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[2px] border-2 border-black bg-white/70 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">
                      Última interação
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-charcoal">
                      <Clock className="h-4 w-4 text-cement" />
                      {person.latestInteractionLabel}
                    </p>
                  </div>
                  <div className={cn("rounded-[2px] border-2 p-4", holdState === "blocked" ? "border-rust bg-rust/10 text-rust" : holdState === "waiting" ? "border-dark-yellow bg-burnt-yellow/15 text-dark-yellow" : "border-moss bg-moss/10 text-moss")}>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] leading-none mb-2">
                      {holdState === "free" ? "Caminho livre" : "Bloqueio ou espera"}
                    </p>
                    <p className="text-xs font-bold leading-normal">
                      {holdLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-cement">
                      Mensagem para envio individual
                    </label>
                    {templates.length > 0 && onTemplateChange && (
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => onTemplateChange(e.target.value)}
                        className="text-xs font-black uppercase tracking-tight bg-white border-2 border-black rounded-[2px] px-2.5 py-1 text-charcoal focus:ring-0 focus:outline-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
                        disabled={isBlocked}
                      >
                        <option value="">-- Personalizado / Nenhum --</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="relative">
                    {setEditedMessage ? (
                      <textarea
                        value={editedMessage}
                        onChange={(e) => setEditedMessage(e.target.value)}
                        className={cn("w-full rounded-[2px] border-2 border-black bg-white p-5 text-sm font-medium leading-relaxed text-charcoal focus:ring-0 focus:outline-none resize-y", compact ? "min-h-[140px]" : "min-h-[168px]")}
                        disabled={isBlocked}
                        placeholder="Nenhum modelo ideal encontrado. Digite aqui..."
                      />
                    ) : (
                      <div className={cn("rounded-[2px] border-2 border-black bg-white p-5 text-sm font-medium leading-relaxed text-charcoal", compact ? "min-h-[140px]" : "min-h-[168px]")}>
                        {person.suggestedMessage || "Nenhum modelo ideal encontrado para este contexto. Revise a ficha e siga com abordagem manual."}
                      </div>
                    )}
                    {person.suggestedMessage && (
                      <Button
                        size="icon"
                        variant="outline"
                        className={cn(
                          "absolute bottom-3 right-3 h-9 w-9 rounded-[2px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] transition-all",
                          copyStatus === "waiting" ? "bg-burnt-yellow text-charcoal" : "bg-white text-charcoal hover:bg-burnt-yellow",
                        )}
                        onClick={onCopyDM}
                        disabled={isBlocked}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {person.suggestedTemplateName && (
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-cement">
                      Gabarito: {person.suggestedTemplateName}
                    </p>
                  )}
                </div>

                {copyStatus === "waiting" && (
                  <div className="animate-in fade-in slide-in-from-top-2 rounded-[2px] border-2 border-black bg-charcoal p-4 text-white duration-300 shadow-[3px_3px_0px_0px_rgba(11,11,11,1)]">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-burnt-yellow animate-bounce" />
                      <div className="space-y-3">
                        <p className="text-xs font-bold leading-relaxed text-off-white">
                          Texto copiado e direct aberto. Envie a mensagem no Instagram e marque abaixo.
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            size="sm"
                            className="h-8 flex-1 rounded-[2px] bg-burnt-yellow text-charcoal border-2 border-black hover:bg-burnt-yellow/90 font-black uppercase tracking-wider"
                            onClick={onConfirmSent}
                          >
                            <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                            Marcar como Enviado
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-[2px] border border-transparent text-white hover:bg-white/10"
                            onClick={onCancelCopy}
                          >
                            Ainda não
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {copyStatus === "confirmed" && (
                  <div className="animate-in zoom-in rounded-[2px] border-2 border-moss bg-moss/10 p-4 duration-300">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-moss" />
                        <p className="text-sm font-black text-charcoal">
                          Mensagem enviada. A conversa entrou em acompanhamento.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="border-2 border-black rounded-[2px] bg-white text-charcoal hover:bg-burnt-yellow"
                        onClick={onNext}
                      >
                        Próxima pessoa <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {(person.riskFlags.recentOutreach || person.riskFlags.doNotContact) && (
                  <div className="space-y-2">
                    {person.riskFlags.recentOutreach && (
                      <EthicalGuardrailBanner
                        tone="zinc"
                        eyebrow="Janela ética"
                        badgeLabel="Aguardar retorno"
                        description="Houve contato recente. A pessoa segue em espera saudável antes de nova abordagem."
                        icon={AlertCircle}
                        className="rounded-[2px] border-2 border-black bg-white p-3"
                      />
                    )}
                    {person.riskFlags.doNotContact && (
                      <EthicalGuardrailBanner
                        tone="rose"
                        eyebrow="Guardrail ético"
                        badgeLabel="Não abordar"
                        description="Esta pessoa está bloqueada por cuidado ético. Não abrir novo contato até revisão manual."
                        icon={ShieldAlert}
                        className="rounded-[2px] border-2 border-rust bg-rust/10 p-3 text-rust"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className={cn("grid gap-3 border-t-2 border-black bg-charcoal/5", compact ? "px-4 py-4 2xl:grid-cols-[minmax(0,1fr)_auto]" : "px-6 py-5 xl:grid-cols-[minmax(0,1fr)_auto]")}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              size="lg"
              className="h-12 rounded-[2px] bg-burnt-yellow text-charcoal border-2 border-black hover:bg-burnt-yellow/90 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(11,11,11,1)] transition-all font-black uppercase tracking-wider text-xs"
              onClick={copyStatus === "waiting" ? onConfirmSent : copyStatus === "confirmed" ? onNext : onCopyDM}
              disabled={copyStatus === "idle" && (!person.suggestedMessage || isBlocked)}
            >
              {copyStatus === "waiting" ? (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              ) : copyStatus === "confirmed" ? (
                <ChevronRight className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copyStatus === "waiting" ? "Marcar como Enviado" : copyStatus === "confirmed" ? "Próxima pessoa" : "Copiar e Abrir Direct"}
            </Button>

            <Button
              size="lg"
              className="h-12 rounded-[2px] bg-charcoal text-off-white border-2 border-black hover:bg-concrete-dark hover:text-white shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(11,11,11,1)] transition-all font-black uppercase tracking-wider"
              onClick={() => window.open(`https://www.instagram.com/${person.username.replace(/^@+/, "")}/`, "_blank")}
              disabled={isBlocked}
            >
              <Instagram className="mr-2 h-4 w-4" /> Abrir Instagram
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-[2px] border-2 border-black bg-white px-6 text-xs font-black uppercase tracking-wider text-charcoal transition-all shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] hover:bg-burnt-yellow hover:text-charcoal active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(11,11,11,1)]"
              onClick={onRegisterResponse}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Registrar resposta
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="h-12 justify-start px-0 text-xs font-black uppercase tracking-wider text-charcoal hover:text-burnt-yellow hover:bg-cement/10 sm:px-4 rounded-[2px] border-2 border-transparent"
              onClick={onReferral}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Encaminhar
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
          <Button
            size="lg"
            variant="ghost"
            className="h-12 justify-start text-xs font-black uppercase tracking-wider text-zinc-500 hover:text-charcoal hover:bg-cement/10 sm:justify-center rounded-[2px] border-2 border-transparent"
            onClick={onSkip}
          >
            <FastForward className="mr-2 h-4 w-4" />
            Deixar em espera
          </Button>
          <Button
            size="lg"
            className="h-12 rounded-[2px] border-2 border-black bg-white text-charcoal hover:bg-burnt-yellow font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(11,11,11,1)] transition-all"
            onClick={onNext}
          >
            Próxima pessoa <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
