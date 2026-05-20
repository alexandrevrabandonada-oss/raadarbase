"use client";

import * as React from "react";
import { 
  ShieldCheck, 
  MapPinned, 
  Compass, 
  Activity, 
  Users, 
  Lock, 
  Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardViewData } from "@/app/dashboard/dashboard-client";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AchievementsSectionProps {
  data: DashboardViewData;
}

export function AchievementsSection({ data }: AchievementsSectionProps) {
  // Calculando status de cada conquista
  const totalTerritories = 
    data.quickMap.counts.mobilizacao + 
    data.quickMap.counts.campo + 
    data.quickMap.counts.continuidade;

  const achievements = [
    {
      id: "privacy_guardian",
      title: "Guardião da Privacidade",
      description: "Nossa base respeita escolhas individuais de contato.",
      requirement: "Respeitar pelo menos 1 pedido de Não Contato",
      currentValue: data.care.doNotContactRespected,
      targetValue: 1,
      unlocked: data.care.doNotContactRespected >= 1,
      icon: ShieldCheck,
      color: "text-zinc-500",
      glowBg: "rgba(113, 113, 122, 0.15)",
      accentBorder: "border-zinc-500/30",
    },
    {
      id: "territorial_pioneer",
      title: "Pioneiro Territorial",
      description: "Mobilização em andamento em diversos bairros.",
      requirement: "Mapear e atuar em pelo menos 5 bairros",
      currentValue: totalTerritories,
      targetValue: 5,
      unlocked: totalTerritories >= 5,
      icon: MapPinned,
      color: "text-amber-500",
      glowBg: "rgba(245, 158, 11, 0.15)",
      accentBorder: "border-amber-500/30",
    },
    {
      id: "physical_bridges",
      title: "Pontes Presenciais",
      description: "Encaminhamentos realizados para engajamento presencial.",
      requirement: "Realizar pelo menos 3 encaminhamentos no ciclo",
      currentValue: data.care.referralsMade,
      targetValue: 3,
      unlocked: data.care.referralsMade >= 3,
      icon: Compass,
      color: "text-indigo-500",
      glowBg: "rgba(99, 102, 241, 0.15)",
      accentBorder: "border-indigo-500/30",
    },
    {
      id: "elite_operations",
      title: "Operações de Elite",
      description: "Avanço e progresso na Fila guiada do operador.",
      requirement: "Alcançar pelo menos 70% de progresso da jornada",
      currentValue: data.missionState.progress,
      targetValue: 70,
      unlocked: data.missionState.progress >= 70,
      icon: Activity,
      color: "text-emerald-500",
      glowBg: "rgba(16, 185, 129, 0.15)",
      accentBorder: "border-emerald-500/30",
    },
    {
      id: "healthy_rhythm",
      title: "Ritmo Saudável",
      description: "Equipe operando sem sobrecarga ou exaustão.",
      requirement: "Zero alertas de sobrecarga de fila na coordenação",
      currentValue: data.care.overloadAlerts === 0 ? 1 : 0,
      targetValue: 1,
      unlocked: data.care.overloadAlerts === 0,
      icon: Users,
      color: "text-sky-500",
      glowBg: "rgba(14, 165, 233, 0.15)",
      accentBorder: "border-sky-500/30",
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // Sistema de Nível Coletivo do Clã
  const getClanLevel = (unlocked: number) => {
    if (unlocked === 0) return { name: "Recrutas da Base", level: 1 };
    if (unlocked <= 2) return { name: "Clã de Escuta", level: 2 };
    if (unlocked <= 4) return { name: "Batalhão Territorial", level: 3 };
    return { name: "Legião da Mobilização Ética", level: 4 };
  };

  const clanInfo = getClanLevel(unlockedCount);

  return (
    <section className="space-y-4">
      {/* Cabeçalho da Seção de Conquistas */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-950">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-2xl font-black tracking-tight">Conquistas Coletivas</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-[#6f6250]">
            Vitórias e marcos desbloqueados cooperativamente por toda a equipe de mobilizadores.
          </p>
        </div>

        {/* Nível do Clã */}
        <div className="flex items-center gap-3 rounded-2xl border border-[#d8c7ac] bg-[#fdfaf5] p-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f1b24] text-amber-400 font-black text-lg">
            {clanInfo.level}
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-[#8b7759]">Nível do Clã</p>
            <p className="text-sm font-black text-zinc-900">{clanInfo.name}</p>
          </div>
        </div>
      </div>

      {/* Grid de Achievements */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {achievements.map((achievement) => {
          const Icon = achievement.icon;
          const progressPercent = Math.min(
            100,
            (achievement.currentValue / achievement.targetValue) * 100
          );

          return (
            <Tooltip key={achievement.id}>
              <TooltipTrigger render={
                <div
                  className={cn(
                    "relative overflow-hidden rounded-3xl border p-5 transition-all duration-300",
                    "hover:scale-[1.02] cursor-help flex flex-col justify-between h-[180px] shadow-sm",
                    achievement.unlocked
                      ? cn(
                          "bg-[linear-gradient(135deg,#fffcf7,#fdf8ee)] border-[#d8c7ac]",
                          achievement.accentBorder,
                          "shadow-[0_12px_24px_-8px_rgba(211,155,42,0.12)]"
                        )
                      : "bg-[#f5efe5]/60 border-[#d8c7ac]/40 opacity-75"
                  )}
                >
                  {/* Glowing background when unlocked */}
                  {achievement.unlocked && (
                    <div 
                      className="absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl pointer-events-none"
                      style={{ backgroundColor: achievement.glowBg }}
                    />
                  )}

                  {/* Header of card: Icon and state */}
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950/5 text-zinc-900",
                        achievement.unlocked ? achievement.color : "text-zinc-400"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    {!achievement.unlocked && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200">
                        <Lock className="h-3 w-3 text-zinc-400" />
                      </div>
                    )}
                  </div>

                  {/* Body: Title and Mini-progress */}
                  <div className="space-y-2 mt-4">
                    <h3 className={cn(
                      "text-sm font-black tracking-tight",
                      achievement.unlocked ? "text-zinc-950" : "text-zinc-600"
                    )}>
                      {achievement.title}
                    </h3>
                    <p className="text-[11px] leading-relaxed text-zinc-500 line-clamp-2">
                      {achievement.description}
                    </p>
                  </div>

                  {/* Footer: Progress bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase text-[#8b7759]">
                      <span>{achievement.unlocked ? "Concluído" : "Em Progresso"}</span>
                      <span>
                        {achievement.unlocked 
                          ? `${achievement.targetValue}/${achievement.targetValue}` 
                          : `${Math.round(achievement.currentValue)}/${achievement.targetValue}`
                        }
                      </span>
                    </div>
                    <Progress 
                      value={progressPercent} 
                      className={cn(
                        "h-1.5",
                        achievement.unlocked ? "bg-amber-100" : "bg-zinc-200"
                      )}
                      indicatorClassName={achievement.unlocked ? "bg-amber-500" : "bg-zinc-400"}
                    />
                  </div>
                </div>
              } />
              <TooltipContent className="max-w-[220px] p-3 text-xs leading-relaxed rounded-xl bg-zinc-950 text-white border-zinc-800">
                <p className="font-bold">{achievement.title}</p>
                <p className="mt-1 text-zinc-400">{achievement.requirement}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </section>
  );
}
