"use client";

import * as React from "react";
import { CheckCircle2, Circle, Lock, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { JourneyPhase, JOURNEY_PHASES_ORDER } from "@/lib/data/journey-mapper";

interface JourneyProgressProps {
  currentPhase: JourneyPhase;
  completedPhases: JourneyPhase[];
  isBlocked?: boolean;
  blockedReason?: string;
  nextStepLabel?: string;
  compact?: boolean;
}

const PHASE_LABELS: Record<JourneyPhase, string> = {
  preparar: "Preparar",
  conversar: "Conversar",
  registrar: "Registrar",
  encaminhar: "Encaminhar",
  concluir: "Concluir",
};

export function JourneyProgress({
  currentPhase,
  completedPhases,
  isBlocked,
  blockedReason,
  nextStepLabel,
  compact = false,
}: JourneyProgressProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex -space-x-1">
          {JOURNEY_PHASES_ORDER.map((phase) => {
            const isCompleted = completedPhases.includes(phase);
            const isCurrent = currentPhase === phase;
            
            return (
              <div 
                key={phase}
                className={cn(
                  "h-1.5 w-4 rounded-full border border-white first:rounded-l-full last:rounded-r-full transition-all duration-300",
                  isBlocked && isCurrent ? "bg-rose-500" :
                  isCompleted ? "bg-emerald-500" :
                  isCurrent ? "bg-indigo-500 scale-x-125 z-10" :
                  "bg-zinc-200"
                )}
              />
            );
          })}
        </div>
        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-tighter">
          {isBlocked ? blockedReason : PHASE_LABELS[currentPhase]}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Visual Bar */}
      <div className="relative flex items-center justify-between px-2">
        {/* Background Line */}
        <div className="absolute left-6 right-6 h-0.5 bg-zinc-100 -z-10" />
        
        {JOURNEY_PHASES_ORDER.map((phase, idx) => {
          const isCompleted = completedPhases.includes(phase);
          const isCurrent = currentPhase === phase;
          const isNext = !isCompleted && !isCurrent && JOURNEY_PHASES_ORDER[idx - 1] === currentPhase;

          return (
            <div key={phase} className="flex flex-col items-center gap-1.5">
              <div 
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                  isBlocked && isCurrent ? "bg-rose-50 border-rose-200 text-rose-500" :
                  isCompleted ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm" :
                  isCurrent ? "bg-indigo-600 border-indigo-600 text-white shadow-lg scale-110" :
                  "bg-white border-zinc-200 text-zinc-300"
                )}
              >
                {isBlocked && isCurrent ? <Lock className="h-4 w-4" /> :
                 isCompleted ? <CheckCircle2 className="h-4 w-4" /> :
                 <span className="text-[10px] font-black">{idx + 1}</span>}
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-colors duration-300",
                isCurrent ? "text-indigo-600" : "text-zinc-400"
              )}>
                {PHASE_LABELS[phase]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className={cn(
        "p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4",
        isBlocked ? "bg-rose-50 border-rose-100" : "bg-indigo-50/50 border-indigo-100"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-xl",
            isBlocked ? "bg-rose-100 text-rose-600" : "bg-white text-indigo-600 shadow-sm"
          )}>
            {isBlocked ? <AlertCircle className="h-5 w-5" /> : <ChevronRight className="h-5 w-5 animate-pulse" />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">
              {isBlocked ? "Ação Bloqueada" : "Próximo Passo"}
            </p>
            <p className={cn(
              "text-sm font-black tracking-tight leading-none",
              isBlocked ? "text-rose-700" : "text-indigo-900"
            )}>
              {isBlocked ? blockedReason : nextStepLabel}
            </p>
          </div>
        </div>
        {!isBlocked && (
          <div className="text-[9px] font-bold text-indigo-400 bg-white px-2 py-1 rounded-full border border-indigo-100">
            Você está aqui
          </div>
        )}
      </div>
    </div>
  );
}
