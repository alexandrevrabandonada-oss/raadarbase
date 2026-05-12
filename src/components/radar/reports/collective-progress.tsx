"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MessageSquare, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Zap,
  CheckCircle2,
  Heart,
  MapPin,
  Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CollectiveProgressMetrics } from "@/lib/data/collective-progress-data";

interface CollectiveProgressProps {
  data: CollectiveProgressMetrics;
  className?: string;
}

export function CollectiveProgress({ data, className }: CollectiveProgressProps) {
  const { progress, funnel, operationHealth, ethics } = data;

  const funnelSteps = [
    { label: "Preparar", value: funnel.prepare, color: "bg-zinc-100 text-zinc-900" },
    { label: "Conversar", value: funnel.talk, color: "bg-indigo-100 text-indigo-700" },
    { label: "Registrar", value: funnel.register, color: "bg-amber-100 text-amber-700" },
    { label: "Encaminhar", value: funnel.refer, color: "bg-emerald-100 text-emerald-700" },
    { label: "Concluir", value: funnel.conclude, color: "bg-zinc-900 text-white" }
  ];

  return (
    <div className={cn("space-y-8", className)}>
      {/* 1. Bloco Progresso Coletivo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Vínculos Preparados", value: progress.linksPrepared, icon: Zap, tone: "info" },
          { label: "Conversas Iniciadas", value: progress.conversationsInitiated, icon: MessageSquare, tone: "info" },
          { label: "Respostas Registradas", value: progress.responsesRecorded, icon: CheckCircle2, tone: "success" },
          { label: "Encaminhamentos", value: progress.referralsMade, icon: ArrowRight, tone: "success" },
          { label: "Territórios em Mobilização", value: progress.territoriesInMobilization, icon: MapPin, tone: "warning" },
          { label: "Ações de Campo", value: progress.fieldActionsCompleted, icon: Landmark, tone: "warning" },
          { label: "Não Abordar Respeitados", value: progress.doNotContactRespected, icon: ShieldCheck, tone: "danger" }
        ].map((metric, i) => (
          <Card key={i} className="border-none bg-zinc-50/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col items-center text-center">
              <metric.icon className={cn("h-5 w-5 mb-2", 
                metric.tone === "info" ? "text-indigo-600" :
                metric.tone === "success" ? "text-emerald-600" :
                metric.tone === "warning" ? "text-amber-600" : "text-rose-600"
              )} />
              <p className="text-2xl font-black text-zinc-900 leading-none mb-1">{metric.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2. Funil da Jornada */}
      <Card className="border-zinc-100 shadow-xl overflow-hidden">
        <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400">Funil da Jornada Operacional</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="relative flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
            {/* Connection Line (Desktop) */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-100 -z-10 hidden md:block" />
            
            {funnelSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center gap-3 flex-1 min-w-[120px]">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-zinc-200/50", step.color)}>
                  {step.value}
                </div>
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-tighter text-zinc-900">{step.label}</p>
                  <p className="text-[10px] font-bold text-zinc-400">Pessoas</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 3. Saúde da Operação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Saúde da Operação
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
             {[
               { label: "Tarefas Paradas (+48h)", value: operationHealth.staleTasksCount, icon: Clock, critical: operationHealth.staleTasksCount > 5 },
               { label: "Aguardando +7 dias", value: operationHealth.waiting7DaysCount, icon: Clock, critical: operationHealth.waiting7DaysCount > 0 },
               { label: "Sem Responsável", value: operationHealth.tasksWithoutResponsible, icon: Users, critical: operationHealth.tasksWithoutResponsible > 0 },
               { label: "DMs Preparadas sem Confirmação", value: operationHealth.dmsPreparedWithoutConfirmation, icon: Zap, critical: operationHealth.dmsPreparedWithoutConfirmation > 10 },
               { label: "Territórios sem Ação Recente", value: operationHealth.territoriesWithoutRecentAction, icon: MapPin, critical: operationHealth.territoriesWithoutRecentAction > 3 }
             ].map((item, i) => (
               <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-zinc-50 bg-zinc-50/30 hover:bg-zinc-50 transition-colors">
                 <div className="flex items-center gap-3">
                   <item.icon className={cn("h-4 w-4", item.critical ? "text-rose-500" : "text-zinc-400")} />
                   <span className="text-sm font-bold text-zinc-700">{item.label}</span>
                 </div>
                 <Badge variant={item.critical ? "destructive" : "secondary"} className="font-black">
                   {item.value}
                 </Badge>
               </div>
             ))}
          </CardContent>
        </Card>

        {/* 4. Destaque Ético: Cuidado da Base */}
        <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 border-none text-white shadow-xl shadow-indigo-200">
          <CardHeader>
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-indigo-200 flex items-center gap-2">
              <Heart className="h-4 w-4 fill-rose-300" />
              Cuidado da Base
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
             <div className="flex flex-col items-center justify-center py-6 bg-white/10 rounded-3xl border border-white/20 backdrop-blur">
                <Heart className="h-10 w-10 text-rose-300 fill-rose-300 mb-2" />
                <p className="text-4xl font-black">{ethics.doNotContactRespected}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Não Abordar Respeitados</p>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-700/50 border border-indigo-500/30 hover:border-indigo-400/50 transition-colors">
                   <p className="text-xl font-black">{ethics.sensitiveNotesReviewed}</p>
                   <p className="text-[10px] font-bold text-indigo-200 uppercase leading-tight">Notas sensíveis evitadas</p>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-700/50 border border-indigo-500/30 hover:border-indigo-400/50 transition-colors">
                   <p className="text-xl font-black">{ethics.dataUnderReview}</p>
                   <p className="text-[10px] font-bold text-indigo-200 uppercase leading-tight">Dados em revisão</p>
                </div>
             </div>

             <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-xs font-medium text-indigo-100 italic leading-relaxed">
                  &quot;O progresso coletivo é medido pelo cuidado com as pessoas, não pela velocidade do disparo.&quot;
                </p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
