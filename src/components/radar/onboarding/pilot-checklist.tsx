"use client";

import * as React from "react";
import { 
  CheckCircle2, 
  Target, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  ArrowRightCircle,
  LucideIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChecklistItemProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

function ChecklistItem({ label, value, icon: Icon, color }: ChecklistItemProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-zinc-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", color)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs font-black text-zinc-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-zinc-900">{value}</span>
        {value > 0 ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-50" />
        ) : (
          <div className="h-4 w-4 rounded-full border-2 border-zinc-100" />
        )}
      </div>
    </div>
  );
}

export function PilotChecklist({ stats }: { stats: {
  myTasks: number;
  dmsSent: number;
  responsesRecorded: number;
  pendingReferrals: number;
  blockedRespected: number;
}}) {
  return (
    <Card className="border-none bg-zinc-50 shadow-inner">
      <CardHeader className="pb-4">
        <CardTitle className="text-xs font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
          <Target className="h-4 w-4" />
          Meu Checklist de Hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pb-6">
        <ChecklistItem 
          label="Minhas Tarefas" 
          value={stats.myTasks} 
          icon={Clock} 
          color="bg-indigo-100 text-indigo-700" 
        />
        <ChecklistItem 
          label="DMs enviadas hoje" 
          value={stats.dmsSent} 
          icon={ArrowRightCircle} 
          color="bg-blue-100 text-blue-700" 
        />
        <ChecklistItem 
          label="Respostas registradas" 
          value={stats.responsesRecorded} 
          icon={MessageSquare} 
          color="bg-emerald-100 text-emerald-700" 
        />
        <ChecklistItem 
          label="Encaminhamentos pendentes" 
          value={stats.pendingReferrals} 
          icon={Target} 
          color="bg-amber-100 text-amber-700" 
        />
        <ChecklistItem 
          label="Não Abordar respeitados" 
          value={stats.blockedRespected} 
          icon={ShieldCheck} 
          color="bg-zinc-100 text-zinc-700" 
        />
      </CardContent>
    </Card>
  );
}
