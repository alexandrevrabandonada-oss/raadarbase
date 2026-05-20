"use client";

import { PriorityPerson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronRight, Clock, MapPinned, ShieldAlert } from "lucide-react";
import { mapPersonToJourney } from "@/lib/data/journey-mapper";
import { JourneyBar } from "@/components/radar/journey-bar";

interface QueueListProps {
  tasks: PriorityPerson[];
  currentIndex: number;
  onSelect: (index: number) => void;
  className?: string;
  compact?: boolean;
}

function phaseLabel(person: PriorityPerson) {
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

export function QueueList({ tasks, currentIndex, onSelect, className, compact = false }: QueueListProps) {
  const nextTasks = tasks.slice(currentIndex + 1, currentIndex + 6);

  if (nextTasks.length === 0) return null;

  return (
    <div className={cn(compact ? "space-y-3" : "space-y-4", className)}>
      <div className="space-y-1 px-1">
        <h3 className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">
          Próximas 5 missões
        </h3>
        <p className="text-xs font-semibold text-cement">
          A trilha abaixo mostra quem entra em campo depois da missão atual.
        </p>
      </div>

      <div className={cn("relative pl-6", compact ? "space-y-3.5" : "space-y-4")}>
        <div className="absolute bottom-3 left-[17px] top-3 w-0.5 bg-black border-l-2 border-black" />
        {nextTasks.map((person, idx) => {
          const absoluteIndex = currentIndex + 1 + idx;
          const blocked = person.status === "nao_abordar" || person.riskFlags.doNotContact;
          const journey = mapPersonToJourney(
            person.status,
            person.hasPendingTask,
            person.hasReferral,
            person.lastInteractionAt,
          );

          return (
            <button
              key={person.id}
              onClick={() => onSelect(absoluteIndex)}
              className={cn("group relative w-full rounded-[2px] border-2 border-black bg-white text-left p-4 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] transition-all hover:bg-burnt-yellow/10", compact ? "p-3.5" : "p-4")}
            >
              <div className="absolute -left-6 top-6 flex h-6 w-6 items-center justify-center rounded-[2px] border-2 border-black bg-white text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">
                <MapPinned className="h-3.5 w-3.5" />
              </div>
              <div className={cn("flex items-start justify-between gap-3", compact ? "mb-2" : "mb-3")}>
                <div className="flex items-center gap-3">
                  <div className={cn("flex items-center justify-center rounded-[2px] border-2 border-black bg-charcoal/5 text-[10px] font-black text-charcoal group-hover:bg-burnt-yellow transition-colors", compact ? "h-8 w-8" : "h-9 w-9")}>
                    {absoluteIndex + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-charcoal">
                      {person.displayName || `@${person.username}`}
                    </p>
                    <p className="truncate text-[11px] font-semibold text-cement">@{person.username}</p>
                  </div>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-cement group-hover:text-charcoal transition-colors" />
              </div>

              <div className={cn("grid", compact ? "gap-2.5" : "gap-3")}>
                <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                  <span className="rounded-[2px] border-2 border-black bg-white px-2 py-0.5 text-charcoal">
                    {phaseLabel(person)}
                  </span>
                  {blocked ? (
                    <span className="flex items-center gap-1 rounded-[2px] border-2 border-rust bg-rust/10 px-2 py-0.5 text-rust">
                      <ShieldAlert className="h-3 w-3" /> Bloqueio
                    </span>
                  ) : person.isPendingResponse ? (
                    <span className="flex items-center gap-1 rounded-[2px] border-2 border-burnt-yellow bg-burnt-yellow/10 px-2 py-0.5 text-dark-yellow">
                      <Clock className="h-3 w-3" /> Espera
                    </span>
                  ) : null}
                </div>

                <p className={cn("line-clamp-2 text-xs font-semibold leading-relaxed text-cement", compact && "text-[11px]")}>
                  {person.nextAction}
                </p>
                <div className={cn("rounded-[2px] border-2 border-black bg-white p-2.5", compact ? "p-2" : "p-3")}>
                  <JourneyBar {...journey} compact />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {tasks.length > currentIndex + 6 && (
        <p className="px-1 text-[10px] font-black uppercase tracking-widest text-cement">
          + {tasks.length - (currentIndex + 6)} missões aguardando depois desta trilha
        </p>
      )}
    </div>
  );
}
