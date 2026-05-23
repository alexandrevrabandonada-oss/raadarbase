"use client";

import { useTransition } from "react";
import { ChevronRight, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PriorityPerson } from "@/lib/types";
import { assumePersonResponsible } from "@/app/actions";
import { JourneyProgress } from "./journey-progress";
import { MissionCard } from "./mission-card";
import {
  getPriorityPersonHoldState,
  getPriorityPersonHoldText,
  getPriorityPersonJourney,
  getPriorityPersonMissionNextStep,
  getPriorityPersonMissionPhaseLabel,
  getPriorityPersonMissionReason,
  getPriorityPersonMissionTypeLabel,
} from "@/lib/missions/priority-person-mission-adapter";

interface PersonPriorityCardProps {
  person: PriorityPerson;
  index?: number;
  layout?: "card" | "cards" | "list";
  onActionComplete?: () => void;
  onOpenDetails?: (person: PriorityPerson) => void;
  className?: string;
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
  const isBlocked = getPriorityPersonHoldState(person) === "blocked";
  const phaseLabel = getPriorityPersonMissionPhaseLabel(person);
  const holdText = getPriorityPersonHoldText(person);
  const holdState = getPriorityPersonHoldState(person);
  const journey = getPriorityPersonJourney(person);
  const missionTypeLabel = getPriorityPersonMissionTypeLabel(person);
  const missionReason = getPriorityPersonMissionReason(person);
  const missionNextStep = getPriorityPersonMissionNextStep(person);

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
          "group bloco-concreto flex flex-col gap-4 rounded-[2px] border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] transition-all hover:bg-burnt-yellow/5 md:flex-row md:items-center md:justify-between",
          isBlocked && "bg-zinc-50 opacity-75 grayscale-[30%]",
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {index !== undefined && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] border-2 border-black bg-charcoal text-[10px] font-black text-white shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">
              {index + 1}
            </div>
          )}

          <div className="min-w-0 flex-1 cursor-pointer space-y-3" onClick={() => onOpenDetails?.(person)}>
            <div className="flex flex-wrap items-center gap-2">
              {missionTypeLabel ? (
                <Badge className="rounded-[2px] border-2 border-black bg-burnt-yellow px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-charcoal hover:bg-burnt-yellow">
                  {missionTypeLabel}
                </Badge>
              ) : null}
              <Badge className="rounded-[2px] border-2 border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-charcoal hover:bg-white">
                Fase: {phaseLabel}
              </Badge>
              {person.responsibleName ? (
                <Badge variant="outline" className="rounded-[2px] border-2 border-black bg-charcoal px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white hover:bg-charcoal">
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
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Motivo</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-zinc-600" title={missionReason}>{missionReason}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Próxima ação</p>
                <p className="mt-1 line-clamp-2 text-xs font-black text-[#11202a]" title={missionNextStep}>{missionNextStep}</p>
              </div>
              <div>
                <p className={cn("text-[10px] font-black uppercase tracking-[0.24em]", holdState === "blocked" ? "text-rose-700" : holdState === "waiting" ? "text-amber-700" : "text-emerald-700")}>
                  {holdState === "free" ? "Caminho livre" : holdState === "waiting" ? "Em espera" : "Bloqueio ativo"}
                </p>
                <p className={cn("mt-1 line-clamp-2 text-xs font-medium", holdState === "blocked" ? "text-rose-700" : holdState === "waiting" ? "text-amber-700" : "text-emerald-700")} title={holdText}>
                  {holdText}
                </p>
              </div>
            </div>

            <JourneyProgress {...journey} compact />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-black pt-4 md:border-0 md:pt-0">
          {!person.responsibleId && !isBlocked && (
            <Button
              variant="outline"
              className="h-10 border-2 border-black bg-white px-5 text-xs font-black uppercase tracking-wider text-charcoal hover:bg-charcoal/5 rounded-[2px] shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
              onClick={handleAssume}
              disabled={isPending}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assumir
            </Button>
          )}
          <Button
              className="h-10 border-2 border-black bg-burnt-yellow px-5 text-xs font-black uppercase tracking-wider text-charcoal hover:bg-burnt-yellow/90 rounded-[2px] shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
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
      className={cn("group h-full rounded-[2px] border-2 border-black transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(11,11,11,1)]", isBlocked && "bg-zinc-50 opacity-75", className)}
      footer={
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {index !== undefined ? (
            <Badge variant="outline" className="rounded-[2px] border-2 border-black bg-white text-[9px] font-black uppercase tracking-widest text-charcoal">
              Missão {index + 1}
            </Badge>
          ) : null}
          {person.responsibleName ? (
            <Badge variant="outline" className="rounded-[2px] border-2 border-black bg-charcoal text-[9px] font-black uppercase tracking-widest text-white">
              {person.responsibleName}
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-[2px] border-2 border-black bg-burnt-yellow/10 text-[9px] font-black uppercase tracking-widest text-charcoal">
              Sem responsável
            </Badge>
          )}
          {!person.responsibleId && !isBlocked ? (
            <Button
              variant="outline"
              className="h-8 border-2 border-black bg-white text-[10px] font-black uppercase tracking-wider text-charcoal hover:bg-charcoal/5 rounded-[2px] px-3 shadow-[1px_1px_0px_0px_rgba(11,11,11,1)]"
              onClick={handleAssume}
              disabled={isPending}
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Assumir
            </Button>
          ) : null}
        </div>
      }
    />
  );
}
