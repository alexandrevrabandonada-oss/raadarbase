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
      "w-full rounded-3xl border transition-all duration-500 overflow-hidden shadow-xl",
      config.bg,
      config.border,
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
              state.status === "saudavel" ? "bg-emerald-500 text-white" :
              state.status === "atencao" ? "bg-rose-500 text-white" :
              "bg-indigo-600 text-white"
            )}>
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className={cn(
                "text-lg font-black tracking-tight leading-none mb-1",
                state.status === "atencao" ? "text-rose-900" : "text-zinc-900"
              )}>
                {state.weekLabel}
              </h3>
              <p className={cn(
                "text-[10px] font-black uppercase tracking-widest opacity-70",
                state.status === "saudavel" ? "text-emerald-700" :
                state.status === "atencao" ? "text-rose-700" :
                "text-indigo-700"
              )}>
                {config.label}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={cn(
              "text-3xl font-black tabular-nums tracking-tighter leading-none block",
              state.status === "saudavel" ? "text-emerald-600" :
              state.status === "atencao" ? "text-rose-600" :
              "text-indigo-600"
            )}>
              {state.progress}%
            </span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Coletivo</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
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
              state.status === "saudavel" ? "bg-emerald-500" :
              state.status === "atencao" ? "bg-rose-500" :
              "bg-indigo-600"
            )}
          />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
               {state.criticalPendencies > 0 && (
                 <div className="flex items-center gap-1.5 bg-rose-100/50 px-2.5 py-1 rounded-full border border-rose-200">
                   <AlertCircle className="h-3 w-3 text-rose-600" />
                   <span className="text-[10px] font-black text-rose-700 uppercase">{state.criticalPendencies} Pendências Críticas</span>
                 </div>
               )}
               {state.nextRitual && (
                 <div className="flex items-center gap-1.5 bg-white/50 px-2.5 py-1 rounded-full border border-zinc-200">
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
            <div className="h-px w-full bg-zinc-200/50 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">Checklist da Semana</p>
            {state.steps.map((step) => (
              <div 
                key={step.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl transition-all border",
                  step.isCompleted ? "bg-emerald-50/50 border-emerald-100/50" : "bg-zinc-50/50 border-zinc-100/50"
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
                  <Badge variant="outline" className="text-[9px] font-black bg-rose-50 text-rose-600 border-rose-100 uppercase">Prioridade</Badge>
                )}
              </div>
            ))}
            
            <div className="mt-6 p-4 rounded-2xl bg-indigo-600 text-white flex items-center justify-between group cursor-pointer">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Ação Recomendada</p>
                <p className="text-sm font-bold">Verificar territórios pedindo atenção</p>
              </div>
              <Zap className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
