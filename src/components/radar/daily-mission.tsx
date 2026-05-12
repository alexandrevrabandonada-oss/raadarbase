"use client";

import * as React from "react";
import { CheckCircle2, Circle, AlertCircle, Target, ChevronRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { MissionState, MissionStep } from "@/lib/data/mission-engine";
import { Progress } from "@/components/ui/progress";

interface DailyMissionProps {
  state: MissionState;
  className?: string;
}

export function DailyMission({ state, className }: DailyMissionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className={cn(
      "w-full rounded-3xl border transition-all duration-500 overflow-hidden",
      state.status === "concluido" ? "bg-emerald-50 border-emerald-100 shadow-emerald-100/50 shadow-xl" :
      state.status === "atencao" ? "bg-rose-50 border-rose-100 shadow-rose-100/50 shadow-xl" :
      "bg-white border-zinc-100 shadow-xl shadow-zinc-200/50",
      className
    )}>
      {/* Header Section */}
      <div 
        className="p-6 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
              state.status === "concluido" ? "bg-emerald-500 text-white" :
              state.status === "atencao" ? "bg-rose-500 text-white" :
              "bg-indigo-600 text-white"
            )}>
              {state.status === "concluido" ? <CheckCircle2 className="h-6 w-6" /> : <Target className="h-6 w-6" />}
            </div>
            <div>
              <h3 className={cn(
                "text-lg font-black tracking-tight leading-none mb-1",
                state.status === "concluido" ? "text-emerald-900" :
                state.status === "atencao" ? "text-rose-900" :
                "text-zinc-900"
              )}>
                {state.title}
              </h3>
              <p className={cn(
                "text-xs font-bold uppercase tracking-widest opacity-60",
                state.status === "concluido" ? "text-emerald-700" :
                state.status === "atencao" ? "text-rose-700" :
                "text-zinc-500"
              )}>
                {state.isCompleted ? "Missão Cumprida" : "Em Andamento"}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={cn(
              "text-3xl font-black tabular-nums tracking-tighter leading-none block",
              state.status === "concluido" ? "text-emerald-600" :
              state.status === "atencao" ? "text-rose-600" :
              "text-indigo-600"
            )}>
              {state.progress}%
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
             <p className="text-sm font-medium text-zinc-600 flex-1 italic leading-tight">
               &quot;{state.objective}&quot;
             </p>
             <ChevronRight className={cn(
               "h-5 w-5 text-zinc-300 transition-transform duration-300",
               isExpanded && "rotate-90 text-zinc-500"
             )} />
          </div>
          
          <Progress 
            value={state.progress} 
            className="h-2.5 bg-zinc-100"
            indicatorClassName={cn(
              state.status === "concluido" ? "bg-emerald-500" :
              state.status === "atencao" ? "bg-rose-500" :
              "bg-indigo-600"
            )}
          />
        </div>
      </div>

      {/* Expanded Content: Steps */}
      <div className={cn(
        "grid transition-all duration-500 ease-in-out",
        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="p-6 pt-0 space-y-3">
            <div className="h-px bg-zinc-100 w-full my-2" />
            
            {state.steps.map((step) => (
              <div 
                key={step.id} 
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border transition-all duration-300",
                  step.isCompleted ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" :
                  step.isCritical ? "bg-white border-zinc-200" : "bg-zinc-50/50 border-transparent text-zinc-500"
                )}
              >
                <div className="mt-0.5">
                  {step.isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className={cn(
                      "h-4 w-4",
                      step.isCritical ? "text-rose-400" : "text-zinc-200"
                    )} />
                  )}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-xs font-black uppercase tracking-tight",
                    step.isCompleted ? "line-through opacity-50" : ""
                  )}>
                    {step.label}
                  </p>
                  {step.hint && !step.isCompleted && (
                    <p className="text-[10px] font-medium opacity-60 mt-0.5">{step.hint}</p>
                  )}
                </div>
              </div>
            ))}

            {state.isCompleted && (
              <div className="mt-6 p-4 rounded-2xl bg-indigo-600 text-white flex items-center justify-between gap-4 animate-in zoom-in duration-500">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 fill-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black leading-none mb-1">Pendências Fechadas</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Organização para amanhã.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
