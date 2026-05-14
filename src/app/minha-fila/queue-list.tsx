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
        <h3 className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">
          Próximas 5 missões
        </h3>
        <p className="text-xs font-medium text-zinc-500">
          A trilha abaixo mostra quem entra em campo depois da missão atual.
        </p>
      </div>

      <div className={cn("relative pl-6", compact ? "space-y-2.5" : "space-y-3")}>
        <div className="absolute bottom-3 left-[17px] top-3 w-px bg-gradient-to-b from-[#d39b2a] via-[#f0c15b] to-[#11202a]/30" />
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
              className={cn("group radar-outline-card relative w-full rounded-3xl border border-[#d8c7ac] bg-[linear-gradient(180deg,_rgba(255,252,247,0.98),_rgba(244,236,223,0.92))] text-left shadow-sm transition-all hover:border-[#d39b2a]/45 hover:shadow-md", compact ? "p-3.5" : "p-4")}
            >
              <div className="absolute -left-6 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-[#d8c7ac] bg-white text-[#b47a0e] shadow-sm">
                <MapPinned className="h-3 w-3" />
              </div>
              <div className={cn("flex items-start justify-between gap-3", compact ? "mb-2" : "mb-3")}>
                <div className="flex items-center gap-3">
                  <div className={cn("flex items-center justify-center rounded-2xl border border-[#d8c7ac] bg-[rgba(17,32,42,0.05)] text-[10px] font-black text-[#6f6250] group-hover:text-[#11202a]", compact ? "h-8 w-8" : "h-9 w-9")}>
                    {absoluteIndex + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-zinc-900 group-hover:text-[#11202a]">
                      {person.displayName || `@${person.username}`}
                    </p>
                    <p className="truncate text-[11px] font-semibold text-zinc-500">@{person.username}</p>
                  </div>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-zinc-300 group-hover:text-[#b47a0e]" />
              </div>

                <div className={cn("grid", compact ? "gap-2.5" : "gap-3")}>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <span className="rounded-full border border-[#d8c7ac] bg-[rgba(17,32,42,0.05)] px-2.5 py-1 text-[#11202a]">
                      {phaseLabel(person)}
                    </span>
                  {blocked ? (
                    <span className="flex items-center gap-1 rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-rose-700">
                      <ShieldAlert className="h-3 w-3" /> Bloqueio
                    </span>
                  ) : person.isPendingResponse ? (
                    <span className="flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-amber-700">
                      <Clock className="h-3 w-3" /> Espera
                    </span>
                  ) : null}
                </div>

                <p className={cn("line-clamp-2 text-xs font-medium leading-relaxed text-zinc-600", compact && "text-[11px]")}>
                  {person.nextAction}
                </p>
                <div className={cn("rounded-2xl border border-[#d8c7ac] bg-white/75", compact ? "p-2.5" : "p-3")}>
                  <JourneyBar {...journey} compact />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {tasks.length > currentIndex + 6 && (
        <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          + {tasks.length - (currentIndex + 6)} missões aguardando depois desta trilha
        </p>
      )}
    </div>
  );
}
