"use client";

import * as React from "react";
import { CheckCircle2, Lock, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { JourneyPhase, JOURNEY_PHASES_ORDER } from "@/lib/data/journey-mapper";

export interface JourneyBarProps {
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

export function JourneyBar({
  currentPhase,
  completedPhases,
  isBlocked,
  blockedReason,
  nextStepLabel,
  compact = false,
}: JourneyBarProps) {
  if (compact) {
    return (
      <div className="min-w-0 space-y-3">
        <div className="flex items-center gap-2">
          {JOURNEY_PHASES_ORDER.map((phase) => {
            const isCompleted = completedPhases.includes(phase);
            const isCurrent = currentPhase === phase;

            return (
              <div key={phase} className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-black transition-all duration-300",
                    isBlocked && isCurrent ? "border-rose-300 bg-rose-500 text-white" :
                    isCompleted ? "border-emerald-200 bg-emerald-500 text-white" :
                    isCurrent ? "border-zinc-950 bg-zinc-950 text-white shadow-[0_0_0_3px_rgba(24,24,27,0.08)]" :
                    "border-zinc-200 bg-white text-zinc-400"
                  )}
                  title={PHASE_LABELS[phase]}
                >
                  {isBlocked && isCurrent ? <Lock className="h-3 w-3" /> : isCompleted ? <CheckCircle2 className="h-3 w-3" /> : JOURNEY_PHASES_ORDER.indexOf(phase) + 1}
                </div>
                {phase !== JOURNEY_PHASES_ORDER[JOURNEY_PHASES_ORDER.length - 1] ? (
                  <div className={cn("h-1 flex-1 rounded-full", isCompleted ? "bg-emerald-400" : isCurrent ? "bg-zinc-950/35" : "bg-zinc-200")} />
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <span className="truncate text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">
            {isBlocked ? "Em espera" : PHASE_LABELS[currentPhase]}
          </span>
          <span className="shrink-0 text-[11px] font-bold text-zinc-500">
            {completedPhases.length + (isBlocked ? 0 : 1)}/5
          </span>
        </div>
        {isBlocked && blockedReason ? (
          <p className="line-clamp-2 text-xs font-semibold leading-5 text-rose-700">{blockedReason}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        {JOURNEY_PHASES_ORDER.map((phase, idx) => {
          const isCompleted = completedPhases.includes(phase);
          const isCurrent = currentPhase === phase;

          return (
            <div key={phase} className="min-w-0 space-y-2">
              <div
                className={cn(
                  "flex min-h-16 items-center gap-3 rounded-2xl border px-3 py-3 transition-all duration-300 sm:flex-col sm:justify-center sm:text-center",
                  isBlocked && isCurrent ? "border-rose-200 bg-rose-50 text-rose-600" :
                  isCompleted ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                  isCurrent ? "border-zinc-950 bg-zinc-950 text-white shadow-lg shadow-zinc-200" :
                  "border-zinc-200 bg-white text-zinc-400"
                )}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current/20 bg-current/5">
                  {isBlocked && isCurrent ? <Lock className="h-3.5 w-3.5" /> :
                   isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                   <span className="text-[10px] font-black">{idx + 1}</span>}
                </div>
                <span className={cn("block text-[10px] font-black uppercase leading-4 tracking-[0.08em]", isCurrent ? "text-current" : "text-current/85")}>
                  {PHASE_LABELS[phase]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={cn("flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all duration-300", isBlocked ? "border-rose-100 bg-rose-50" : "border-zinc-200 bg-zinc-50")}>
        <div className="flex items-center gap-3">
          <div className={cn("rounded-xl p-2", isBlocked ? "bg-rose-100 text-rose-600" : "bg-white text-zinc-900 shadow-sm")}>
            {isBlocked ? <AlertCircle className="h-5 w-5" /> : <ChevronRight className="h-5 w-5 animate-pulse" />}
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none">
              {isBlocked ? "Ação Bloqueada" : "Próximo Passo"}
            </p>
            <p className={cn("text-sm font-black leading-5 tracking-tight", isBlocked ? "text-rose-700" : "text-zinc-950")}>
              {isBlocked ? blockedReason : nextStepLabel}
            </p>
          </div>
        </div>
        {!isBlocked ? (
          <div className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] font-bold text-zinc-500">
            Você está aqui
          </div>
        ) : null}
      </div>
    </div>
  );
}
