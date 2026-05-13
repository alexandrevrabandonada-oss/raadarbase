"use client";

import { useTransition } from "react";
import { AlertCircle, ChevronRight, Clock, ShieldAlert, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PriorityPerson } from "@/lib/types";
import { assumePersonResponsible } from "@/app/actions";
import { mapPersonToJourney } from "@/lib/data/journey-mapper";
import { JourneyProgress } from "./journey-progress";

interface PersonPriorityCardProps {
  person: PriorityPerson;
  index?: number;
  layout?: "card" | "cards" | "list";
  onActionComplete?: () => void;
  onOpenDetails?: (person: PriorityPerson) => void;
  className?: string;
}

function getPhaseLabel(person: PriorityPerson) {
  const journey = mapPersonToJourney(
    person.status,
    person.hasPendingTask,
    person.hasReferral,
    person.lastInteractionAt,
  );
  const labels = {
    preparar: "Preparar",
    conversar: "Conversar",
    registrar: "Registrar",
    encaminhar: "Encaminhar",
    concluir: "Concluir",
  } as const;

  return journey.isBlocked ? "Em espera" : labels[journey.currentPhase];
}

function getHoldText(person: PriorityPerson) {
  if (person.status === "nao_abordar" || person.doNotContactReason || person.riskFlags?.doNotContact) {
    return person.doNotContactReason || "Missão bloqueada por cuidado ético.";
  }
  if (person.riskFlags?.recentOutreach) {
    return "Contato recente. Melhor aguardar a janela antes de insistir.";
  }
  if (person.isPendingResponse) {
    return "Conversa aberta. Registrar retorno quando houver resposta.";
  }
  return "Sem bloqueio ativo no momento.";
}

export function PersonPriorityCard({
  person,
  index,
  layout = "card",
  onActionComplete,
  onOpenDetails,
  className,
}: PersonPriorityCardProps) {
  const [isPending, startTransition] = useTransition();
  const isBlocked = Boolean(
    person.status === "nao_abordar" || person.doNotContactReason || person.riskFlags?.doNotContact,
  );
  const phaseLabel = getPhaseLabel(person);
  const holdText = getHoldText(person);
  const journey = mapPersonToJourney(
    person.status,
    person.hasPendingTask,
    person.hasReferral,
    person.lastInteractionAt,
  );

  function handleAssume() {
    startTransition(async () => {
      await assumePersonResponsible(person.id);
      onActionComplete?.();
    });
  }

  if (layout === "list") {
    return (
      <div
        className={cn(
          "group flex flex-col gap-4 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md md:flex-row md:items-center md:justify-between",
          isBlocked && "bg-zinc-50",
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {index !== undefined && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-[10px] font-black text-zinc-500">
              {index + 1}
            </div>
          )}

          <div className="min-w-0 flex-1 cursor-pointer space-y-3" onClick={() => onOpenDetails?.(person)}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-700 hover:bg-indigo-50">
                Fase: {phaseLabel}
              </Badge>
              {person.responsibleName ? (
                <Badge variant="outline" className="rounded-full border-zinc-200 text-[9px] font-black uppercase tracking-widest text-zinc-600">
                  {person.responsibleName}
                </Badge>
              ) : null}
            </div>

            <div>
              <p className="truncate text-base font-black text-zinc-950">
                {person.displayName || `@${person.username}`}
              </p>
              <p className="truncate text-xs font-semibold text-zinc-500">@{person.username}</p>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Motivo</p>
                <p className="mt-1 text-xs font-medium leading-relaxed text-zinc-600">{person.priorityReason}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Próxima ação</p>
                <p className="mt-1 text-xs font-black text-indigo-700">{person.nextAction}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Espera ou bloqueio</p>
                <p className={cn("mt-1 text-xs font-medium", isBlocked ? "text-rose-700" : "text-zinc-600")}>
                  {holdText}
                </p>
              </div>
            </div>

            <JourneyProgress {...journey} compact />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4 md:border-0 md:pt-0">
          {!person.responsibleId && !isBlocked && (
            <Button
              variant="outline"
              className="h-10 border-zinc-200 text-xs font-black uppercase tracking-wider"
              onClick={handleAssume}
              disabled={isPending}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assumir
            </Button>
          )}
          <Button
            className="h-10 bg-indigo-600 px-5 text-xs font-black uppercase tracking-wider hover:bg-indigo-700"
            onClick={() => onOpenDetails?.(person)}
          >
            Iniciar etapa <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "group overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-xl",
        isBlocked && "bg-zinc-50",
        className,
      )}
    >
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {index !== undefined ? (
                <Badge variant="outline" className="rounded-full border-zinc-200 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  Missão {index + 1}
                </Badge>
              ) : null}
              <Badge className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-700 hover:bg-indigo-50">
                {phaseLabel}
              </Badge>
            </div>

            <div className="min-w-0 cursor-pointer" onClick={() => onOpenDetails?.(person)}>
              <p className="truncate text-lg font-black text-zinc-950">
                {person.displayName || `@${person.username}`}
              </p>
              <p className="truncate text-xs font-semibold text-zinc-500">@{person.username}</p>
            </div>
          </div>

          {isBlocked ? (
            <div className="rounded-2xl bg-rose-50 p-2 text-rose-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          ) : person.isPendingResponse ? (
            <div className="rounded-2xl bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-50 p-2 text-emerald-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Motivo</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">{person.priorityReason}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Ação principal</p>
              <p className="mt-2 text-sm font-black text-indigo-700">{person.nextAction}</p>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Bloqueio ou espera</p>
              <p className={cn("mt-2 text-sm font-medium", isBlocked ? "text-rose-700" : "text-zinc-600")}>
                {holdText}
              </p>
            </div>
          </div>

          <JourneyProgress {...journey} compact />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
          {!person.responsibleId && !isBlocked && (
            <Button
              variant="outline"
              className="h-10 border-zinc-200 text-xs font-black uppercase tracking-wider"
              onClick={handleAssume}
              disabled={isPending}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assumir
            </Button>
          )}
          <Button
            className="h-10 flex-1 bg-indigo-600 text-xs font-black uppercase tracking-wider hover:bg-indigo-700"
            onClick={() => onOpenDetails?.(person)}
          >
            Iniciar etapa <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
