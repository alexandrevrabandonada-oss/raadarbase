"use client";

import * as React from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Rocket, 
  FileCheck, 
  Users, 
  Settings, 
  Activity, 
  BarChart3,
  LucideIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DayZeroItemProps {
  label: string;
  checked: boolean;
  icon: LucideIcon;
}

function DayZeroItem({ label, checked, icon: Icon }: DayZeroItemProps) {
  return (
    <div className="flex items-center justify-between py-2 group">
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-6 w-6 rounded flex items-center justify-center transition-colors",
          checked ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-400"
        )}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className={cn(
          "text-xs font-bold transition-colors",
          checked ? "text-zinc-900" : "text-zinc-500"
        )}>
          {label}
        </span>
      </div>
      {checked ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      ) : (
        <div className="h-4 w-4 rounded-full border-2 border-zinc-100 group-hover:border-zinc-200" />
      )}
    </div>
  );
}

export function DayZeroChecklist({ stats }: { stats: {
  teamAccess: boolean;
  templatesActive: boolean;
  tasksDistributed: boolean;
  queueWorking: boolean;
  quickSheetWorking: boolean;
  reportsReady: boolean;
}}) {
  const checkedCount = Object.values(stats).filter(Boolean).length;
  const totalCount = Object.values(stats).length;
  
  const status = (() => {
    if (checkedCount === totalCount) return { label: "PRONTO", color: "bg-emerald-500", icon: Rocket, tone: "success" };
    if (checkedCount >= totalCount / 2) return { label: "ATENÇÃO", color: "bg-amber-500", icon: AlertTriangle, tone: "warning" };
    return { label: "BLOQUEADO", color: "bg-rose-500", icon: ShieldAlert, tone: "danger" };
  })();

  return (
    <Card className="border-zinc-200 shadow-md overflow-hidden bg-white">
      <CardHeader className="pb-4 bg-zinc-50 border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-black uppercase tracking-tight text-zinc-900">Dia 0 do Piloto</CardTitle>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Preparação Operacional</p>
          </div>
          <Badge className={cn("text-white border-none font-black text-[10px] px-2 h-5", status.color)}>
            <status.icon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-1">
        <DayZeroItem label="Equipe com acesso" checked={stats.teamAccess} icon={Users} />
        <DayZeroItem label="Templates ativos" checked={stats.templatesActive} icon={Settings} />
        <DayZeroItem label="Tarefas distribuídas" checked={stats.tasksDistributed} icon={Activity} />
        <DayZeroItem label="Minha Fila funcionando" checked={stats.queueWorking} icon={Rocket} />
        <DayZeroItem label="Ficha Rápida funcionando" checked={stats.quickSheetWorking} icon={FileCheck} />
        <DayZeroItem label="Relatórios prontos" checked={stats.reportsReady} icon={BarChart3} />
        
        <div className="pt-4 mt-2 border-t border-zinc-50">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-zinc-400 mb-2">
            <span>Progresso da Prontidão</span>
            <span>{checkedCount}/{totalCount}</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500", status.color)} 
              style={{ width: `${(checkedCount/totalCount)*100}%` }} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
