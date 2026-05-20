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
      color: "text-charcoal",
      bg: "bg-burnt-yellow/5",
      border: "border-burnt-yellow",
      label: "Semana em Construção"
    },
    saudavel: {
      color: "text-moss",
      bg: "bg-moss/5",
      border: "border-moss",
      label: "Ritmo Saudável"
    },
    atencao: {
      color: "text-rust",
      bg: "bg-rust/5",
      border: "border-rust",
      label: "Pendências sob Atenção"
    },
    fechado: {
      color: "text-cement",
      bg: "bg-charcoal/5",
      border: "border-charcoal/30",
      label: "Ciclo Fechado"
    }
  };

  const config = statusConfig[state.status] || statusConfig.construcao;

  return (
    <div className={cn(
      "bloco-concreto w-full overflow-hidden bg-white shadow-sm transition-all duration-300",
      className
    )}>
      <div 
        className="p-6 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-[2px] border-2 border-black bg-charcoal text-burnt-yellow flex items-center justify-center">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-charcoal tracking-tight leading-none mb-1">
                {state.weekLabel}
              </h3>
              <p className={cn(
                "text-[10px] font-black uppercase tracking-widest opacity-80",
                config.color
              )}>
                {config.label}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-3xl font-black text-charcoal tabular-nums tracking-tighter leading-none block">
              {state.progress}%
            </span>
            <span className="text-[10px] font-bold text-cement uppercase tracking-widest">Coletivo</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-burnt-yellow animate-pulse" />
                <p className="text-sm font-black text-charcoal leading-tight">
                  {state.phase.name}
                </p>
             </div>
             <p className="text-xs font-semibold text-cement ml-4 italic">
                {state.phase.description}
             </p>
          </div>
          
          <Progress 
            value={state.progress} 
            className="h-3 bg-charcoal/5 border-2 border-black rounded-[2px]"
            indicatorClassName="bg-charcoal"
          />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
               {state.criticalPendencies > 0 && (
                 <div className="flex items-center gap-1.5 rounded-[2px] border-2 border-black bg-rust/10 px-2 py-0.5">
                   <AlertCircle className="h-3 w-3 text-rust" />
                   <span className="text-[9px] font-black uppercase text-rust">{state.criticalPendencies} Críticas</span>
                 </div>
               )}
               {state.nextRitual && (
                 <div className="flex items-center gap-1.5 rounded-[2px] border border-black/20 bg-charcoal/5 px-2 py-0.5">
                   <Clock className="h-3 w-3 text-cement" />
                   <span className="text-[9px] font-bold text-cement uppercase tracking-wider">{state.nextRitual}</span>
                 </div>
               )}
            </div>
            <ChevronRight className={cn(
              "h-5 w-5 text-cement transition-transform duration-300",
              isExpanded && "rotate-90 text-charcoal"
            )} />
          </div>
        </div>
      </div>

      <div className={cn(
        "grid transition-all duration-300 ease-in-out bg-charcoal/5",
        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="p-6 pt-0 space-y-3">
            <div className="mb-4 h-0.5 w-full bg-black/10" />
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-cement">Checklist da Semana</p>
            {state.steps.map((step) => (
              <div 
                key={step.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-[2px] border-2 transition-all",
                  step.isCompleted 
                    ? "bg-moss/5 border-moss text-moss" 
                    : "bg-white border-black"
                )}
              >
                {step.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-moss shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-cement shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-black leading-none",
                    step.isCompleted ? "text-moss" : "text-charcoal"
                  )}>
                    {step.label}
                  </p>
                  {step.hint && <p className="text-[10px] text-cement mt-1 font-semibold">{step.hint}</p>}
                </div>
                {step.isCritical && !step.isCompleted && (
                    <Badge className="border-2 border-black bg-burnt-yellow text-charcoal text-[9px] font-black uppercase tracking-widest rounded-[2px]">Prioridade</Badge>
                )}
              </div>
            ))}
            
            <div className="mt-4 flex cursor-pointer items-center justify-between rounded-[2px] border-2 border-black bg-charcoal p-4 text-white group">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-burnt-yellow">Ação Recomendada</p>
                <p className="text-sm font-black">Verificar territórios pedindo atenção</p>
              </div>
              <Zap className="h-5 w-5 text-burnt-yellow opacity-75 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
