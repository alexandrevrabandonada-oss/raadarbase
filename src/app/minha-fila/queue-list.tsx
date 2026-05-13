"use client";

import { PriorityPerson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronRight, Clock, MapPinned, ShieldAlert } from "lucide-react";
import { mapPersonToJourney } from "@/lib/data/journey-mapper";

interface QueueListProps {
  tasks: PriorityPerson[];
  currentIndex: number;
  onSelect: (index: number) => void;
  className?: string;
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

export function QueueList({ tasks, currentIndex, onSelect, className }: QueueListProps) {
  const nextTasks = tasks.slice(currentIndex + 1, currentIndex + 6);

  if (nextTasks.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1 px-1">
        <h3 className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">
          Próximas 5 missões
        </h3>
        <p className="text-xs font-medium text-zinc-500">
          A trilha abaixo mostra quem entra em campo depois da missão atual.
        </p>
      </div>

      <div className="relative space-y-3 pl-6">
        <div className="absolute bottom-3 left-[17px] top-3 w-px bg-gradient-to-b from-sky-200 via-indigo-200 to-emerald-200" />
        {nextTasks.map((person, idx) => {
          const absoluteIndex = currentIndex + 1 + idx;
          const blocked = person.status === "nao_abordar" || person.riskFlags.doNotContact;

          return (
            <button
              key={person.id}
              onClick={() => onSelect(absoluteIndex)}
              className="group relative w-full rounded-3xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
            >
              <div className="absolute -left-6 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-600 shadow-sm">
                <MapPinned className="h-3 w-3" />
              </div>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-100 text-[10px] font-black text-zinc-500 group-hover:bg-indigo-50 group-hover:text-indigo-700">
                    {absoluteIndex + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-zinc-900 group-hover:text-indigo-700">
                      {person.displayName || `@${person.username}`}
                    </p>
                    <p className="truncate text-[11px] font-semibold text-zinc-500">@{person.username}</p>
                  </div>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-zinc-300 group-hover:text-indigo-500" />
              </div>

              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-indigo-700">
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

                <p className="line-clamp-2 text-xs font-medium leading-relaxed text-zinc-600">
                  {person.nextAction}
                </p>
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
