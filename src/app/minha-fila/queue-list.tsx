"use client";

import { PriorityPerson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Clock, MapPinned, ShieldAlert, Flame } from "lucide-react";
import { mapPersonToJourney } from "@/lib/data/journey-mapper";
import { JourneyBar } from "@/components/radar/journey-bar";
import { isPriorityPersonAlreadySent } from "@/lib/outreach-status";

interface QueueListProps {
  tasks: PriorityPerson[];
  currentPersonId: string;
  onSelect: (id: string) => void;
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

export function QueueList({ tasks, currentPersonId, onSelect, className, compact = false }: QueueListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center p-6 border-2 border-dashed border-cement/20 rounded-[2px] bg-white/40">
        <p className="text-xs font-semibold text-cement">Nenhum contato encontrado.</p>
      </div>
    );
  }

  return (
    <div className={cn(compact ? "space-y-3" : "space-y-4", className)}>
      <div className="space-y-1 px-1">
        <h3 className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">
          Fila de Prioridades ({tasks.length})
        </h3>
        <p className="text-xs font-semibold text-cement">
          Selecione qualquer pessoa abaixo para carregar sua ficha de contato.
        </p>
      </div>

      <div className={cn("relative pl-6 max-h-[520px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-charcoal/20")}>
        <div className="absolute bottom-3 left-[17px] top-3 w-0.5 bg-black border-l-2 border-black" />
        {tasks.map((person, idx) => {
          const isCurrent = person.id === currentPersonId;
          const blocked = person.status === "nao_abordar" || person.riskFlags.doNotContact;
          const alreadySent = isPriorityPersonAlreadySent(person);
          const journey = mapPersonToJourney(
            person.status,
            person.hasPendingTask,
            person.hasReferral,
            person.lastInteractionAt,
          );

          return (
            <button
              key={person.id}
              onClick={() => onSelect(person.id)}
              className={cn(
                "group relative w-full rounded-[2px] border-2 text-left p-3.5 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] transition-all hover:bg-burnt-yellow/10",
                isCurrent 
                  ? "border-burnt-yellow bg-burnt-yellow/5 shadow-[3px_3px_0px_0px_rgba(242,169,0,1)] text-charcoal ring-1 ring-burnt-yellow" 
                  : "border-black bg-white text-charcoal"
              )}
            >
              <div className="absolute -left-6 top-6 flex h-6 w-6 items-center justify-center rounded-[2px] border-2 border-black bg-white text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">
                {isCurrent ? <Flame className="h-3.5 w-3.5 text-burnt-yellow fill-burnt-yellow" /> : <MapPinned className="h-3.5 w-3.5" />}
              </div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-[2px] border-2 border-black text-[10px] font-black transition-colors",
                    isCurrent ? "bg-burnt-yellow text-charcoal border-burnt-yellow" : "bg-charcoal/5 text-charcoal group-hover:bg-burnt-yellow"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-charcoal">
                      {person.displayName || `@${person.username}`}
                    </p>
                    <p className="truncate text-[11px] font-semibold text-cement">@{person.username}</p>
                  </div>
                </div>
                {isCurrent && (
                  <span className="rounded-[2px] bg-burnt-yellow text-charcoal text-[9px] font-black uppercase px-1.5 py-0.5 border border-black shadow-[1px_1px_0px_0px_rgba(11,11,11,1)]">
                    Foco
                  </span>
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                  <span className="rounded-[2px] border-2 border-black bg-white px-2 py-0.5 text-charcoal">
                    {phaseLabel(person)}
                  </span>
                  {blocked ? (
                    <span className="flex items-center gap-1 rounded-[2px] border-2 border-rust bg-rust/10 px-2 py-0.5 text-rust">
                      <ShieldAlert className="h-3 w-3" /> Bloqueio
                    </span>
                  ) : alreadySent ? (
                    <span className="flex items-center gap-1 rounded-[2px] border-2 border-burnt-yellow bg-burnt-yellow/10 px-2 py-0.5 text-dark-yellow">
                      <Clock className="h-3 w-3" /> Espera
                    </span>
                  ) : null}
                </div>

                <p className="line-clamp-2 text-[11px] font-semibold leading-relaxed text-cement">
                  {person.nextAction}
                </p>
                <div className="rounded-[2px] border border-black bg-white/70 p-2">
                  <JourneyBar {...journey} compact />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
