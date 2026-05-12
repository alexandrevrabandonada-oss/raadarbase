"use client";

import * as React from "react";
import { 
  Eye, 
  Ear, 
  Users, 
  Map as MapIcon, 
  RefreshCcw,
  ChevronRight,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TerritoryPhaseInfo } from "@/lib/data/territory-mapper";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TerritoryStageBadgeProps {
  phase: TerritoryPhaseInfo;
  compact?: boolean;
  showDetails?: boolean;
}

const PHASE_ICONS = {
  observacao: Eye,
  escuta: Ear,
  mobilizacao: Users,
  campo: MapIcon,
  continuidade: RefreshCcw,
};

export function TerritoryStageBadge({ phase, compact = false, showDetails = false }: TerritoryStageBadgeProps) {
  const Icon = PHASE_ICONS[phase.id];

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm",
        phase.color
      )}>
        <Icon className="h-3 w-3" />
        {phase.label}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={cn(
        "inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl text-xs font-black uppercase tracking-tighter text-white shadow-lg",
        phase.color
      )}>
        <Icon className="h-4 w-4" />
        Fase de {phase.label}
      </div>

      {showDetails && (
        <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 space-y-4">
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-zinc-400">
               <Info className="h-3 w-3" />
               <span className="text-[10px] font-black uppercase tracking-widest">Por que está aqui?</span>
             </div>
             <p className="text-sm font-bold text-zinc-700 leading-tight">
               {phase.reason}
             </p>
          </div>

          <div className="space-y-2">
             <div className="flex items-center gap-2 text-indigo-400">
               <ChevronRight className="h-3 w-3" />
               <span className="text-[10px] font-black uppercase tracking-widest">Próximo Passo Recomendado</span>
             </div>
             <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-black text-zinc-900 leading-tight">
                  {phase.nextStep}
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-8 text-[10px] font-black uppercase tracking-widest border-zinc-200"
                  render={<Link href={phase.nextActionUrl} />}
                >
                  Ação <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
             </div>
          </div>

          <div className="h-px bg-zinc-200/50 w-full" />
          
          <p className="text-[9px] font-bold text-zinc-400 italic">
            &quot;Fases territoriais são agregadas. Não representam vigilância individual.&quot;
          </p>
        </div>
      )}
    </div>
  );
}
