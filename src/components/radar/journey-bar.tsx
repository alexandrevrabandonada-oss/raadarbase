"use client";

import * as React from "react";
import {
  CheckCircle2,
  Lock,
  AlertCircle,
  ChevronRight,
  Compass,
  MessageSquare,
  Scroll,
  MapPinned,
  Trophy
} from "lucide-react";
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

const PHASE_ICONS: Record<JourneyPhase, React.ElementType> = {
  preparar: Compass,
  conversar: MessageSquare,
  registrar: Scroll,
  encaminhar: MapPinned,
  concluir: Trophy,
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
            const Icon = PHASE_ICONS[phase];

            return (
              <div key={phase} className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-black transition-all duration-300",
                    isBlocked && isCurrent ? "border-rose-300 bg-rose-500 text-white" :
                    isCompleted ? "border-emerald-200 bg-emerald-500 text-white shadow-sm" :
                    isCurrent ? "border-amber-500 bg-[#0f1b24] text-[#f0c15b] shadow-md animate-pulse" :
                    "border-zinc-200 bg-white text-zinc-400"
                  )}
                  title={PHASE_LABELS[phase]}
                >
                  {isBlocked && isCurrent ? (
                    <Lock className="h-4 w-4" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                {phase !== JOURNEY_PHASES_ORDER[JOURNEY_PHASES_ORDER.length - 1] ? (
                  <div className={cn("h-1 flex-1 rounded-full", isCompleted ? "bg-emerald-400" : isCurrent ? "bg-amber-400" : "bg-zinc-200")} />
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <span className="truncate text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">
            {isBlocked ? "Quest Bloqueada" : PHASE_LABELS[currentPhase]}
          </span>
          <span className="shrink-0 text-[11px] font-bold text-zinc-500">
            {completedPhases.length + (isBlocked ? 0 : 1)}/5 Quests
          </span>
        </div>
        {isBlocked && blockedReason ? (
          <p className="line-clamp-2 text-xs font-semibold leading-5 text-rose-700">{blockedReason}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Visual Trail Container */}
      <div className="relative px-6 py-2">
        {/* The Connection Line Path behind the nodes */}
        <div className="absolute top-[40px] left-[12%] right-[12%] hidden h-[2px] border-t-2 border-dashed border-zinc-300 sm:block" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5 relative z-10">
          {JOURNEY_PHASES_ORDER.map((phase) => {
            const isCompleted = completedPhases.includes(phase);
            const isCurrent = currentPhase === phase;
            const Icon = PHASE_ICONS[phase];

            return (
              <div key={phase} className="flex flex-col items-center justify-center">
                <div
                  className={cn(
                    "flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-md",
                    isBlocked && isCurrent ? "border-rose-400 bg-rose-50 text-rose-600 animate-pulse" :
                    isCompleted ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 shadow-emerald-100" :
                    isCurrent ? "border-amber-500 bg-[#0f1b24] text-[#f0c15b] shadow-lg shadow-amber-500/20 scale-105 animate-pulse" :
                    "border-zinc-200 bg-white text-zinc-400"
                  )}
                  title={PHASE_LABELS[phase]}
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    {isBlocked && isCurrent ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                    <span className="text-[9px] font-black uppercase tracking-tighter mt-1">
                      {PHASE_LABELS[phase]}
                    </span>
                  </div>
                </div>
                <div className="mt-2.5 text-center">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider",
                    isCurrent ? "text-amber-600 font-bold" : isCompleted ? "text-emerald-600" : "text-zinc-400"
                  )}>
                    {isCompleted ? "Concluído" : isCurrent ? (isBlocked ? "Bloqueado" : "Quest Ativa") : "Bloqueado"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={cn("flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all duration-300", isBlocked ? "border-rose-100 bg-rose-50" : "border-zinc-200 bg-zinc-50")}>
        <div className="flex items-center gap-3">
          <div className={cn("rounded-xl p-2", isBlocked ? "bg-rose-100 text-rose-600" : "bg-white text-zinc-900 shadow-sm")}>
            {isBlocked ? <AlertCircle className="h-5 w-5" /> : <ChevronRight className="h-5 w-5 animate-pulse" />}
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none">
              {isBlocked ? "Ação Bloqueada" : "Próxima Ação Requerida"}
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
