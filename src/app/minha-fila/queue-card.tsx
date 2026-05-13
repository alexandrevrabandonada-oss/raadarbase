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
import { JourneyProgress } from "@/components/radar/journey-progress";

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
  const holdLabel = isBlocked
    ? person.doNotContactReason || "Restrição ética ativa."
    : person.riskFlags.recentOutreach
      ? "Contato recente. Aguarde a janela ética antes de insistir."
      : person.isPendingResponse
        ? "Aguardando retorno da conversa já iniciada."
        : "Caminho livre para avançar nesta missão.";

  return (
    <Card className="overflow-hidden border-zinc-900/10 bg-white shadow-2xl shadow-zinc-200/50">
      <CardHeader className="p-0">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.28),_transparent_34%),linear-gradient(135deg,#09090b_0%,#18181b_55%,#27272a_100%)] px-6 py-6 text-white">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-3">
              <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white hover:bg-white/10">
                Fase atual: {phase.label}
              </Badge>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-lg font-black shadow-lg">
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

            <div className="min-w-[180px] rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">
                Progresso da jornada
              </p>
              <p className="mt-2 text-3xl font-black leading-none text-white">{progress}%</p>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">
                Motivo da missão
              </p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-100">
                {person.priorityReason}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">
                Próxima ação
              </p>
              <p className="mt-2 text-sm font-black leading-relaxed text-white">{person.nextAction}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">
                Estado da missão
              </p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-100">{holdLabel}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6 md:p-8">
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50/70 p-5">
          <JourneyProgress {...phase.journey} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-5">
              <div className="mb-3 flex items-center gap-2 text-indigo-700">
                <Sparkles className="h-4 w-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.24em]">Ação principal</p>
              </div>
              <p className="text-base font-black leading-tight text-indigo-950">
                {isBlocked ? "Respeitar a trava ética e revisar contexto." : "Abrir Instagram, personalizar a abordagem e registrar o avanço."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">
                  Última interação
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  {person.latestInteractionLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">
                  Espera ou bloqueio
                </p>
                <p className={cn("mt-2 text-sm font-semibold", isBlocked ? "text-rose-700" : "text-zinc-700")}>
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
                <div className="min-h-[168px] rounded-3xl border border-zinc-200 bg-zinc-50 p-5 text-sm font-medium leading-relaxed text-zinc-800">
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
                  <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-3">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <p className="text-xs font-bold text-amber-900">Sinal de espera: houve contato recente.</p>
                  </div>
                )}
                {person.riskFlags.doNotContact && (
                  <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                    <ShieldAlert className="h-4 w-4 text-zinc-300" />
                    <p className="text-xs font-bold uppercase tracking-widest text-white">Não abordar ativo</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center gap-3 border-t border-zinc-100 bg-zinc-50 px-6 py-5">
        <Button
          size="lg"
          className="h-12 bg-pink-600 px-6 text-xs font-black uppercase tracking-wider hover:bg-pink-700"
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
