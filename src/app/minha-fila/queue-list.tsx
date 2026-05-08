"use client";

import { PriorityPerson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Flame, History } from "lucide-react";

interface QueueListProps {
  tasks: PriorityPerson[];
  currentIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

export function QueueList({
  tasks,
  currentIndex,
  onSelect,
  className
}: QueueListProps) {
  // Show up to 10 next tasks
  const nextTasks = tasks.slice(currentIndex + 1, currentIndex + 11);

  if (nextTasks.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">
        Próximas na Fila ({nextTasks.length})
      </h3>
      
      <div className="space-y-2">
        {nextTasks.map((person, idx) => {
          const absoluteIndex = currentIndex + 1 + idx;
          const temperatureColors = {
            quente: "bg-orange-50 text-orange-600 border-orange-100",
            morno: "bg-amber-50 text-amber-600 border-amber-100",
            frio: "bg-blue-50 text-blue-600 border-blue-100",
          };

          return (
            <button
              key={person.id}
              onClick={() => onSelect(absoluteIndex)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-500 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                  {absoluteIndex + 1}
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-900 group-hover:text-indigo-600 transition-colors">@{person.username}</p>
                  <p className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                    {person.scoreLabel} · {person.outreachStatusLabel}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase border", temperatureColors[person.temperature])}>
                  {person.temperature}
                </div>
                <div className="text-[10px] font-black text-zinc-300 group-hover:text-zinc-400 transition-colors">
                  SC {person.priorityScore}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {tasks.length > currentIndex + 11 && (
        <p className="text-center text-[10px] font-bold text-zinc-400 py-2">
          + {tasks.length - (currentIndex + 11)} outras pessoas na fila
        </p>
      )}
    </div>
  );
}
