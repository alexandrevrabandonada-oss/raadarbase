"use client";

import * as React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Users, 
  MessageSquare, 
  Clock, 
  Ghost,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AlarmProps {
  condition: boolean;
  label: string;
  href: string;
  icon: LucideIcon;
  tone: "danger" | "warning" | "info";
}

function Alarm({ condition, label, href, icon: Icon, tone }: AlarmProps) {
  if (!condition) return null;

  const toneClasses = {
    danger: "bg-rose-50 border-rose-100 text-rose-700",
    warning: "bg-amber-50 border-amber-100 text-amber-700",
    info: "bg-indigo-50 border-indigo-100 text-indigo-700"
  };

  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center justify-between p-4 rounded-2xl border transition-all hover:shadow-md group",
        toneClasses[tone]
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center bg-white shadow-sm")}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-black text-sm">{label}</span>
      </div>
      <ArrowRight className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

export function OperationalAlarms({ stats }: { stats: {
  unassignedTasks: number;
  myPendingReferrals: number;
  staleTasks: number;
  notAssumedAnything: boolean;
}}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Alarm 
        condition={stats.unassignedTasks > 0}
        label={`Há ${stats.unassignedTasks} tarefas órfãs precisando de dono.`}
        href="/abordagem?filter=sem_responsavel"
        icon={Ghost}
        tone="danger"
      />
      <Alarm 
        condition={stats.myPendingReferrals > 0}
        label={`Você tem ${stats.myPendingReferrals} respostas sem encaminhamento.`}
        href="/abordagem?filter=encaminhar"
        icon={MessageSquare}
        tone="warning"
      />
      <Alarm 
        condition={stats.staleTasks > 0}
        label={`Há ${stats.staleTasks} tarefas paradas há muito tempo.`}
        href="/abordagem?filter=stale"
        icon={Clock}
        tone="info"
      />
      <Alarm 
        condition={stats.notAssumedAnything}
        label="Você ainda não assumiu tarefas para hoje."
        href="/pessoas?filter=sem_responsavel"
        icon={Users}
        tone="info"
      />
    </div>
  );
}
