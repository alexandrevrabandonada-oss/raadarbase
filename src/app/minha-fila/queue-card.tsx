"use client";

import { PriorityPerson } from "@/lib/types";
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
        : "Caminho livre para avançar nesta missão.";

  return (
    <Card className="radar-outline-card overflow-hidden rounded-[4px] border-2 border-charcoal bg-off-white shadow-[4px_4px_0px_0px_rgba(28,28,26,1)]">
      <CardHeader className="p-0">
        <div className={cn("border-b-2 border-charcoal bg-charcoal text-white", compact ? "px-4 py-4 sm:px-5" : "px-6 py-6")}>
          <div className={cn("flex flex-wrap items-start justify-between gap-4", compact ? "mb-4" : "mb-5")}>
            <div className="min-w-0 space-y-3">
              <Badge className="rounded-[2px] border-2 border-burnt-yellow/30 bg-charcoal text-burnt-yellow px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] hover:bg-burnt-yellow/10">
                Fase atual: {phase.label}
              </Badge>
              <div className={cn("flex items-center", compact ? "gap-3" : "gap-4")}>
                <div className={cn("flex items-center justify-center rounded-[2px] border-2 border-burnt-yellow bg-charcoal font-black text-burnt-yellow shadow-[2px_2px_0px_0px_rgba(242,169,0,0.3)]", compact ? "h-12 w-12 text-base" : "h-14 w-14 text-lg")}>
                  {person.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className={cn("truncate font-black tracking-tight", compact ? "text-xl" : "text-2xl")}>
                    {person.displayName || `@${person.username}`}
                  </h2>
                  <p className="truncate text-sm font-semibold text-zinc-300">@{person.username}</p>
                </div>
              </div>
            </div>

            <div className={cn("w-full rounded-[2px] border-2 border-cement bg-charcoal/60 sm:w-auto", compact ? "p-3 sm:min-w-[150px]" : "p-4 sm:min-w-[180px]")}>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">
                Progresso da jornada
              </p>
              <p className={cn("mt-2 font-black leading-none text-white", compact ? "text-2xl" : "text-3xl")}>{progress}%</p>
              <div className="mt-3 h-3 rounded-none border border-charcoal bg-cement/30 overflow-hidden">
                <div
                  className="h-full bg-burnt-yellow transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className={cn("grid gap-4", compact ? "2xl:grid-cols-3" : "xl:grid-cols-3")}>
            <div className="rounded-[2px] border-2 border-cement/50 bg-charcoal/40 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">
                Motivo da missão
              </p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-100">
                {person.priorityReason}
              </p>
            </div>
            <div className="rounded-[2px] border-2 border-cement/50 bg-charcoal/40 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">
                Próxima ação
              </p>
              <p className="mt-2 text-sm font-black leading-relaxed text-white">{person.nextAction}</p>
            </div>
            <div className="rounded-[2px] border-2 border-cement/50 bg-charcoal/40 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">
                Estado da missão
              </p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-100">{holdLabel}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-6", compact ? "p-4 md:p-5" : "p-6 md:p-8")}>
        <div className={cn("rounded-[2px] border-2 border-charcoal bg-charcoal/5", compact ? "p-4" : "p-5")}>
          <JourneyBar {...phase.journey} />
        </div>

        <div className={cn("grid gap-6", compact ? "2xl:grid-cols-[1.05fr_0.95fr]" : "xl:grid-cols-[1.05fr_0.95fr]")}>
          <div className="space-y-4">
            <div className={cn("rounded-[2px] border-2 border-charcoal bg-burnt-yellow/10", compact ? "p-4" : "p-5")}>
              <div className="mb-3 flex items-center gap-2 text-burnt-yellow">
                <Sparkles className="h-4 w-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.24em]">Ação principal</p>
              </div>
              <p className={cn("font-black leading-tight text-charcoal", compact ? "text-sm" : "text-base")}>
                {mission?.primaryAction.label || (isBlocked ? "Respeitar a trava ética e revisar contexto." : "Abrir Instagram, personalizar a abordagem e registrar o avanço.")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2px] border-2 border-cement bg-charcoal/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-charcoal/60">
                  Última interação
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  {person.latestInteractionLabel}
                </p>
              </div>
              <div className="rounded-[2px] border-2 border-cement bg-charcoal/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-charcoal/60">
                  {holdState === "free" ? "Caminho livre" : "Bloqueio ou espera"}
                </p>
                <p className={cn("mt-2 text-sm font-semibold", holdState === "blocked" ? "text-rose-700" : holdState === "waiting" ? "text-amber-700" : "text-emerald-700")}>
                  {holdLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">
                Mensagem de missão
              </label>
              <div className="relative">
                <div className={cn("rounded-[2px] border-2 border-charcoal bg-off-white p-5 text-sm font-medium leading-relaxed text-zinc-900", compact ? "min-h-[140px]" : "min-h-[168px]")}>
                  {person.suggestedMessage || "Nenhum modelo ideal encontrado para este contexto. Revise a ficha e siga com abordagem manual."}
                </div>
                {person.suggestedMessage && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className={cn(
                      "absolute bottom-3 right-3 h-9 w-9 rounded-[2px] border-2 border-charcoal shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all",
                      copyStatus === "waiting" ? "bg-burnt-yellow text-charcoal" : "hover:bg-cement/10 bg-off-white text-charcoal",
                    )}
                    onClick={onCopyDM}
                    disabled={isBlocked}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {person.suggestedTemplateName && (
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Referência: {person.suggestedTemplateName}
                </p>
              )}
            </div>

            {copyStatus === "waiting" && (
              <div className="animate-in fade-in slide-in-from-top-2 rounded-[2px] border-2 border-charcoal bg-charcoal p-4 text-white duration-300 shadow-[3px_3px_0px_0px_rgba(11,11,11,0.5)]">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-burnt-yellow" />
                  <div className="space-y-3">
                    <p className="text-xs font-bold leading-relaxed">
                      Copiar prepara a missão, mas não registra envio. Confirme apenas depois de mandar manualmente no Instagram.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        size="sm"
                        className="h-8 flex-1 rounded-[2px] bg-burnt-yellow text-charcoal hover:bg-burnt-yellow/90 font-black uppercase tracking-wider"
                        onClick={onConfirmSent}
                      >
                        <CheckCircle2 className="mr-2 h-3 w-3" />
                        Confirmar envio
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
              <div className="animate-in zoom-in rounded-[2px] border-2 border-emerald-600 bg-emerald-50/50 p-4 duration-300">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-black text-emerald-950">
                      Etapa concluída. A conversa entrou em acompanhamento.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-emerald-700 hover:bg-emerald-100"
                    onClick={onNext}
                  >
                    Próxima missão <ChevronRight className="ml-1 h-3 w-3" />
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
                    description="Houve contato recente. A missão segue em espera saudável antes de nova abordagem."
                    icon={AlertCircle}
                    className="rounded-[2px] border-2 border-cement bg-charcoal/10 p-3"
                  />
                )}
                {person.riskFlags.doNotContact && (
                  <EthicalGuardrailBanner
                    tone="rose"
                    eyebrow="Guardrail ético"
                    badgeLabel="Não abordar"
                    description="A missão está bloqueada por cuidado ético. Não abrir novo contato até revisão manual."
                    icon={ShieldAlert}
                    className="rounded-[2px] border-2 border-rose-500 bg-rose-500/10 p-3"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className={cn("grid gap-3 border-t-2 border-charcoal bg-charcoal/5", compact ? "px-4 py-4 2xl:grid-cols-[minmax(0,1fr)_auto]" : "px-6 py-5 xl:grid-cols-[minmax(0,1fr)_auto]")}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              size="lg"
              className="h-12 rounded-[2px] bg-burnt-yellow text-charcoal border-charcoal hover:bg-burnt-yellow/90 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all font-black uppercase tracking-wider"
              onClick={onRegisterResponse}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Iniciar etapa
            </Button>

            <Button
              size="lg"
              className="h-12 rounded-[2px] bg-charcoal text-off-white border-charcoal hover:bg-cement/15 active:translate-x-[1px] active:translate-y-[1px] transition-all font-black uppercase tracking-wider"
              onClick={() => window.open(person.instagramUrl || `https://instagram.com/${person.username}`, "_blank")}
              disabled={isBlocked}
            >
              <Instagram className="mr-2 h-4 w-4" /> Abrir Instagram
            </Button>

            <Button
              size="lg"
              variant="outline"
              className={cn(
                "h-12 rounded-[2px] border-2 border-cement px-6 text-xs font-black uppercase tracking-wider transition-all",
                copyStatus === "waiting" ? "bg-burnt-yellow text-charcoal border-charcoal" : "bg-charcoal text-off-white",
              )}
              onClick={onCopyDM}
              disabled={!person.suggestedMessage || isBlocked}
            >
              <Copy className="mr-2 h-4 w-4" />
              Preparar mensagem
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="h-12 justify-start px-0 text-xs font-black uppercase tracking-wider text-charcoal/70 hover:text-burnt-yellow sm:px-4"
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
            className="h-12 justify-start text-xs font-black uppercase tracking-wider text-zinc-500 hover:text-charcoal sm:justify-center"
            onClick={onSkip}
          >
            <FastForward className="mr-2 h-4 w-4" />
            Deixar em espera
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="h-12 rounded-[2px] border-2 border-cement bg-zinc-200 px-6 text-xs font-black uppercase tracking-wider hover:bg-zinc-300 text-charcoal"
            onClick={onNext}
          >
            Próxima missão <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
