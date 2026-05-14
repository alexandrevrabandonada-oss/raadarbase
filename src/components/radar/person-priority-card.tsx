"use client";

import { useTransition } from "react";
import { ChevronRight, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PriorityPerson } from "@/lib/types";
import { assumePersonResponsible } from "@/app/actions";
import { mapPersonToJourney } from "@/lib/data/journey-mapper";
import { JourneyProgress } from "./journey-progress";
import { MissionCard } from "./mission-card";

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
    return "Contato recente. Aguarde a janela ética antes de insistir.";
  }
  if (person.isPendingResponse) {
    return "Conversa aberta. Registrar retorno quando houver resposta.";
  }
  return "Sem bloqueio ativo agora.";
}

function getHoldState(person: PriorityPerson): "blocked" | "waiting" | "free" {
  if (person.status === "nao_abordar" || person.doNotContactReason || person.riskFlags?.doNotContact) {
    return "blocked";
  }
  if (person.riskFlags?.recentOutreach || person.isPendingResponse) {
    return "waiting";
  }
  return "free";
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
  const holdState = getHoldState(person);
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
          "group radar-outline-card flex flex-col gap-4 rounded-[28px] border border-[#d8c7ac] bg-[linear-gradient(180deg,_rgba(255,252,247,0.98),_rgba(244,236,223,0.92))] p-5 shadow-sm transition-all hover:border-[#d39b2a]/45 hover:shadow-md md:flex-row md:items-center md:justify-between",
          isBlocked && "bg-zinc-50",
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {index !== undefined && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#d8c7ac] bg-[rgba(17,32,42,0.05)] text-[10px] font-black text-[#6f6250]">
              {index + 1}
            </div>
          )}

          <div className="min-w-0 flex-1 cursor-pointer space-y-3" onClick={() => onOpenDetails?.(person)}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-[#d8c7ac] bg-[rgba(17,32,42,0.05)] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[#11202a] hover:bg-[rgba(17,32,42,0.05)]">
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
              <p className="truncate text-xs font-semibold text-zinc-500" title={`@${person.username}`}>@{person.username}</p>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7759]">Motivo</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-zinc-600" title={person.priorityReason}>{person.priorityReason}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7759]">Próxima ação</p>
                <p className="mt-1 line-clamp-2 text-xs font-black text-[#11202a]" title={person.nextAction}>{person.nextAction}</p>
              </div>
              <div>
                <p className={cn("text-[10px] font-black uppercase tracking-[0.24em]", holdState === "blocked" ? "text-rose-700" : holdState === "waiting" ? "text-amber-700" : "text-emerald-700")}>
                  {holdState === "free" ? "Caminho livre" : "Espera ou bloqueio"}
                </p>
                <p className={cn("mt-1 line-clamp-2 text-xs font-medium", holdState === "blocked" ? "text-rose-700" : holdState === "waiting" ? "text-amber-700" : "text-emerald-700")} title={holdText}>
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
              className="h-10 bg-[#0f1b24] px-5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#172733]"
            onClick={() => onOpenDetails?.(person)}
          >
            Iniciar etapa <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <MissionCard
      person={person}
      primaryActionLabel="Iniciar etapa"
      onPrimaryAction={onOpenDetails}
      className={cn("group h-full rounded-[30px] transition-all hover:-translate-y-0.5 hover:border-[#d39b2a]/45 hover:shadow-xl", isBlocked && "bg-zinc-50", className)}
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {index !== undefined ? (
            <Badge variant="outline" className="rounded-full border-zinc-200 text-[9px] font-black uppercase tracking-widest text-zinc-500">
              Missão {index + 1}
            </Badge>
          ) : null}
          {person.responsibleName ? (
            <Badge variant="outline" className="rounded-full border-zinc-300 bg-white text-[9px] font-black uppercase tracking-widest text-zinc-600">
              {person.responsibleName}
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-[9px] font-black uppercase tracking-widest text-amber-700">
              Sem responsável
            </Badge>
          )}
          {!person.responsibleId && !isBlocked ? (
            <Button
              variant="outline"
              className="h-10 border-zinc-200 text-xs font-black uppercase tracking-wider"
              onClick={handleAssume}
              disabled={isPending}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assumir
            </Button>
          ) : null}
        </div>
      }
    />
  );
}
