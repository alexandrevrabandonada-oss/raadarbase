"use client";

import { PriorityPerson } from "@/lib/types";
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
  onCopyDM: () => void;
  onRegisterResponse: () => void;
  onReferral: () => void;
  onSkip: () => void;
  onNext: () => void;
  copyStatus?: "idle" | "waiting" | "confirmed";
  onConfirmSent?: () => void;
  onCancelCopy?: () => void;
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
  onCopyDM,
  onRegisterResponse,
  onReferral,
  onSkip,
  onNext,
  copyStatus = "idle",
  onConfirmSent,
  onCancelCopy,
}: QueueCardProps) {
  const isBlocked = person.riskFlags.doNotContact;
  const phase = resolvePhaseRibbon(person);
  const progress = progressPercentage(person);
  const holdState = isBlocked ? "blocked" : person.riskFlags.recentOutreach || person.isPendingResponse ? "waiting" : "free";
  const holdLabel = isBlocked
    ? person.doNotContactReason || "Restrição ética ativa."
    : person.riskFlags.recentOutreach
      ? "Contato recente. Aguarde a janela ética antes de insistir."
      : person.isPendingResponse
        ? "Aguardando retorno da conversa já iniciada."
        : "Caminho livre para avançar nesta missão.";

  return (
    <Card className="radar-outline-card overflow-hidden border-[#d8c7ac] bg-[linear-gradient(180deg,_rgba(255,252,247,0.98),_rgba(244,236,223,0.94))] shadow-2xl shadow-zinc-200/50">
      <CardHeader className="p-0">
        <div className="border-b border-[#23313b] radar-panel-dark px-6 py-6 text-white">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-3">
              <Badge className="rounded-full border border-[#f0c15b]/25 bg-[#f0c15b]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#f7d88c] hover:bg-[#f0c15b]/10">
                Fase atual: {phase.label}
              </Badge>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f0c15b]/25 bg-black/20 text-lg font-black text-[#f1c15a] shadow-lg">
                  {person.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-black tracking-tight">
                    {person.displayName || `@${person.username}`}
                  </h2>
                  <p className="truncate text-sm font-semibold text-zinc-300">@{person.username}</p>
                </div>
              </div>
            </div>

            <div className="min-w-[180px] rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">
                Progresso da jornada
              </p>
              <p className="mt-2 text-3xl font-black leading-none text-white">{progress}%</p>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#d39b2a] via-[#f0c15b] to-[#e8dfbf] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">
                Motivo da missão
              </p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-100">
                {person.priorityReason}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">
                Próxima ação
              </p>
              <p className="mt-2 text-sm font-black leading-relaxed text-[#f7f1e5]">{person.nextAction}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d4b678]">
                Estado da missão
              </p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-100">{holdLabel}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6 md:p-8">
        <div className="rounded-3xl border border-[#d8c7ac] bg-white/70 p-5">
          <JourneyBar {...phase.journey} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-[#d8c7ac] bg-[rgba(17,32,42,0.05)] p-5">
              <div className="mb-3 flex items-center gap-2 text-[#8b7759]">
                <Sparkles className="h-4 w-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.24em]">Ação principal</p>
              </div>
              <p className="text-base font-black leading-tight text-[#11202a]">
                {isBlocked ? "Respeitar a trava ética e revisar contexto." : "Abrir Instagram, personalizar a abordagem e registrar o avanço."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#d8c7ac] bg-white/75 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7759]">
                  Última interação
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  {person.latestInteractionLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-[#d8c7ac] bg-white/75 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7759]">
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
                <div className="min-h-[168px] rounded-3xl border border-[#d8c7ac] bg-[rgba(255,252,247,0.9)] p-5 text-sm font-medium leading-relaxed text-zinc-800">
                  {person.suggestedMessage || "Nenhum modelo ideal encontrado para este contexto. Revise a ficha e siga com abordagem manual."}
                </div>
                {person.suggestedMessage && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className={cn(
                      "absolute bottom-3 right-3 h-9 w-9 shadow-sm transition-all",
                      copyStatus === "waiting" ? "bg-indigo-600 text-white" : "hover:bg-white",
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
              <div className="animate-in fade-in slide-in-from-top-2 rounded-2xl border border-indigo-500 bg-indigo-600 p-4 text-white duration-300">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="space-y-3">
                    <p className="text-xs font-bold leading-relaxed">
                      Copiar prepara a missão, mas não registra envio. Confirme apenas depois de mandar manualmente no Instagram.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 flex-1 bg-white text-indigo-700 hover:bg-white/90"
                        onClick={onConfirmSent}
                      >
                        <CheckCircle2 className="mr-2 h-3 w-3" />
                        Confirmar envio
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-white hover:bg-white/10"
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
              <div className="animate-in zoom-in rounded-2xl border border-emerald-100 bg-emerald-50 p-4 duration-300">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-black text-emerald-900">
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
                    className="rounded-2xl border-amber-100 bg-amber-50 p-3"
                  />
                )}
                {person.riskFlags.doNotContact && (
                  <EthicalGuardrailBanner
                    tone="rose"
                    eyebrow="Guardrail ético"
                    badgeLabel="Não abordar"
                    description="A missão está bloqueada por cuidado ético. Não abrir novo contato até revisão manual."
                    icon={ShieldAlert}
                    className="rounded-2xl p-3"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center gap-3 border-t border-[#d8c7ac] bg-[rgba(255,250,242,0.75)] px-6 py-5">
        <Button
          size="lg"
          className="h-12 bg-[#0f1b24] px-6 text-xs font-black uppercase tracking-wider text-white hover:bg-[#172733]"
          onClick={() => window.open(person.instagramUrl || `https://instagram.com/${person.username}`, "_blank")}
        >
          <Instagram className="mr-2 h-4 w-4" /> Abrir Instagram
        </Button>

        <Button
          size="lg"
          variant="outline"
          className={cn(
            "h-12 border-zinc-200 px-6 text-xs font-black uppercase tracking-wider",
            copyStatus === "waiting" ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "bg-white",
          )}
          onClick={onCopyDM}
          disabled={!person.suggestedMessage || isBlocked}
        >
          <Copy className="mr-2 h-4 w-4" />
          Preparar mensagem
        </Button>

        <Button
          size="lg"
          className="h-12 bg-indigo-600 px-6 text-xs font-black uppercase tracking-wider hover:bg-indigo-700"
          onClick={onRegisterResponse}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Iniciar etapa
        </Button>

        <Button
          size="lg"
          variant="ghost"
          className="h-12 text-xs font-black uppercase tracking-wider text-zinc-500 hover:text-amber-600"
          onClick={onReferral}
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Encaminhar
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="lg"
            variant="ghost"
            className="h-12 text-xs font-black uppercase tracking-wider text-zinc-400"
            onClick={onSkip}
          >
            <FastForward className="mr-2 h-4 w-4" />
            Deixar em espera
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="h-12 bg-zinc-200 px-6 text-xs font-black uppercase tracking-wider hover:bg-zinc-300"
            onClick={onNext}
          >
            Próxima missão <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
