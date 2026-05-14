"use client";

import * as React from "react";
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  ChevronRight, 
  Clock, 
  Zap,
  TrendingUp,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WeeklyRhythmState } from "@/lib/data/weekly-rhythm";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface WeeklyRhythmCardProps {
  state: WeeklyRhythmState;
  className?: string;
}

export function WeeklyRhythmCard({ state, className }: WeeklyRhythmCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const statusConfig = {
    construcao: {
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      icon: TrendingUp,
      label: "Semana em Construção"
    },
    saudavel: {
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      icon: CheckCircle2,
      label: "Ritmo Saudável"
    },
    atencao: {
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
      icon: AlertCircle,
      label: "Pendências sob Atenção"
    },
    fechado: {
      color: "text-zinc-600",
      bg: "bg-zinc-50",
      border: "border-zinc-100",
      icon: Clock,
      label: "Ciclo Fechado"
    }
  };

  const config = statusConfig[state.status];

  return (
    <div className={cn(
      "radar-outline-card w-full rounded-3xl border transition-all duration-500 overflow-hidden shadow-xl",
      state.status === "saudavel"
        ? "border-[#d8c7ac] bg-[linear-gradient(180deg,_rgba(255,252,247,0.98),_rgba(243,239,228,0.95))]"
        : state.status === "atencao"
          ? "border-[#d39b2a]/45 bg-[linear-gradient(180deg,_rgba(255,250,242,0.98),_rgba(255,241,223,0.95))]"
          : "border-[#d8c7ac] bg-[linear-gradient(180deg,_rgba(255,252,247,0.98),_rgba(244,236,223,0.95))]",
      className
    )}>
      <div 
        className="p-6 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
              state.status === "saudavel" ? "bg-[#0f1b24] text-[#f0c15b]" :
              state.status === "atencao" ? "bg-[#0f1b24] text-[#f0c15b]" :
              "bg-[#0f1b24] text-[#f0c15b]"
            )}>
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className={cn(
                "text-lg font-black tracking-tight leading-none mb-1",
                "text-zinc-900"
              )}>
                {state.weekLabel}
              </h3>
              <p className={cn(
                "text-[10px] font-black uppercase tracking-widest opacity-70",
                state.status === "saudavel" ? "text-[#6f6250]" :
                state.status === "atencao" ? "text-[#b47a0e]" :
                "text-[#6f6250]"
              )}>
                {config.label}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={cn(
              "text-3xl font-black tabular-nums tracking-tighter leading-none block",
              state.status === "atencao" ? "text-[#b47a0e]" : "text-[#11202a]"
            )}>
              {state.progress}%
            </span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Coletivo</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#d39b2a] animate-pulse" />
                <p className="text-sm font-black text-zinc-900 leading-tight">
                  {state.phase.name}
                </p>
             </div>
             <p className="text-xs font-medium text-zinc-500 ml-4 italic">
                {state.phase.description}
             </p>
          </div>
          
          <Progress 
            value={state.progress} 
            className="h-3 bg-white/50 border border-zinc-100"
            indicatorClassName={cn(
                state.status === "atencao" ? "bg-[#d39b2a]" : "bg-[#11202a]"
              )}
          />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
               {state.criticalPendencies > 0 && (
                 <div className="flex items-center gap-1.5 rounded-full border border-[#d39b2a]/35 bg-[#d39b2a]/10 px-2.5 py-1">
                   <AlertCircle className="h-3 w-3 text-[#b47a0e]" />
                   <span className="text-[10px] font-black uppercase text-[#b47a0e]">{state.criticalPendencies} Pendências Críticas</span>
                 </div>
               )}
               {state.nextRitual && (
                 <div className="flex items-center gap-1.5 rounded-full border border-[#d8c7ac] bg-white/60 px-2.5 py-1">
                   <Clock className="h-3 w-3 text-zinc-400" />
                   <span className="text-[10px] font-bold text-zinc-500">{state.nextRitual}</span>
                 </div>
               )}
            </div>
            <ChevronRight className={cn(
              "h-5 w-5 text-zinc-300 transition-transform duration-300",
              isExpanded && "rotate-90 text-zinc-500"
            )} />
          </div>
        </div>
      </div>

      <div className={cn(
        "grid transition-all duration-500 ease-in-out bg-white/40",
        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="p-6 pt-0 space-y-3">
            <div className="mb-4 h-px w-full bg-[#d8c7ac]" />
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7759]">Checklist da Semana</p>
            {state.steps.map((step) => (
              <div 
                key={step.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl transition-all border",
                  step.isCompleted ? "bg-emerald-50/50 border-emerald-100/50" : "bg-white/60 border-[#d8c7ac]"
                )}
              >
                {step.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-zinc-300 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-bold leading-none",
                    step.isCompleted ? "text-emerald-900" : "text-zinc-600"
                  )}>
                    {step.label}
                  </p>
                  {step.hint && <p className="text-[10px] text-zinc-400 mt-1 font-medium">{step.hint}</p>}
                </div>
                {step.isCritical && !step.isCompleted && (
                    <Badge variant="outline" className="border-[#d39b2a]/35 bg-[#d39b2a]/10 text-[9px] font-black uppercase text-[#b47a0e]">Prioridade</Badge>
                )}
              </div>
            ))}
            
            <div className="mt-6 flex cursor-pointer items-center justify-between rounded-2xl bg-[#0f1b24] p-4 text-white group">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#d4b678]">Ação Recomendada</p>
                <p className="text-sm font-bold">Verificar territórios pedindo atenção</p>
              </div>
              <Zap className="h-5 w-5 text-[#f0c15b] opacity-50 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
