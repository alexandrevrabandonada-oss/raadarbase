"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  MapPinned, 
  Compass, 
  Activity, 
  Users, 
  Lock,
  Flame,
  Milestone,
  CheckCircle,
  Megaphone,
  BookOpenCheck,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardViewData } from "@/app/dashboard/dashboard-client";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { playSynthConfirm, playSynthSuccess } from "@/lib/audio";

interface AchievementsSectionProps {
  data: DashboardViewData;
}

type TabType = "achievements" | "milestones" | "challenges";

export function AchievementsSection({ data }: AchievementsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>("achievements");

  const totalTerritories = 
    data.quickMap.counts.mobilizacao + 
    data.quickMap.counts.campo + 
    data.quickMap.counts.continuidade;

  // 1. Achievements definitions (100 XP each)
  const achievements = [
    {
      id: "privacy_guardian",
      title: "Guardião da Privacidade",
      description: "Respeito ético às escolhas individuais de contato dos moradores.",
      requirement: "Respeitar pelo menos 1 pedido de Não Contato",
      currentValue: data.care.doNotContactRespected,
      targetValue: 1,
      unlocked: data.care.doNotContactRespected >= 1,
      icon: ShieldCheck,
      color: "text-zinc-600",
      glowBg: "rgba(113, 113, 122, 0.15)",
      accentBorder: "border-zinc-500/40",
      iconBg: "bg-zinc-100",
    },
    {
      id: "territorial_pioneer",
      title: "Pioneiro Territorial",
      description: "Ampla cobertura e mapeamento de bairros na região.",
      requirement: "Mapear e atuar em pelo menos 5 bairros",
      currentValue: totalTerritories,
      targetValue: 5,
      unlocked: totalTerritories >= 5,
      icon: MapPinned,
      color: "text-[#9B3F1F]", // Rust
      glowBg: "rgba(155, 63, 31, 0.15)",
      accentBorder: "border-[#9B3F1F]/40",
      iconBg: "bg-orange-50",
    },
    {
      id: "physical_bridges",
      title: "Pontes Presenciais",
      description: "Vínculos virtuais encaminhados para a mobilização presencial de rua.",
      requirement: "Realizar pelo menos 3 encaminhamentos no ciclo",
      currentValue: data.care.referralsMade,
      targetValue: 3,
      unlocked: data.care.referralsMade >= 3,
      icon: Compass,
      color: "text-indigo-600",
      glowBg: "rgba(99, 102, 241, 0.15)",
      accentBorder: "border-indigo-500/40",
      iconBg: "bg-indigo-50",
    },
    {
      id: "elite_operations",
      title: "Operações de Elite",
      description: "Alta eficiência no processamento da jornada diária do operador.",
      requirement: "Alcançar pelo menos 70% de progresso da jornada",
      currentValue: data.missionState.progress,
      targetValue: 70,
      unlocked: data.missionState.progress >= 70,
      icon: Activity,
      color: "text-emerald-600",
      glowBg: "rgba(16, 185, 129, 0.15)",
      accentBorder: "border-emerald-500/40",
      iconBg: "bg-emerald-50",
    },
    {
      id: "healthy_rhythm",
      title: "Ritmo Saudável",
      description: "Equipe trabalhando em harmonia e sem sobrecarga de tarefas.",
      requirement: "Zero alertas de sobrecarga de fila na coordenação",
      currentValue: data.care.overloadAlerts === 0 ? 1 : 0,
      targetValue: 1,
      unlocked: data.care.overloadAlerts === 0,
      icon: Users,
      color: "text-sky-600",
      glowBg: "rgba(14, 165, 233, 0.15)",
      accentBorder: "border-sky-500/40",
      iconBg: "bg-sky-50",
    },
    {
      id: "popular_listening",
      title: "Escuta Popular",
      description: "Mobilização tática coletando escutas e demandas de bairros.",
      requirement: "Registrar pelo menos 10 escutas de bairros",
      currentValue: data.care.bairroListensSubmitted,
      targetValue: 10,
      unlocked: data.care.bairroListensSubmitted >= 10,
      icon: Megaphone,
      color: "text-[#F2A900]", // Yellow
      glowBg: "rgba(242, 169, 0, 0.15)",
      accentBorder: "border-amber-500/40",
      iconBg: "bg-amber-50",
    },
    {
      id: "active_engagement",
      title: "Engajamento Ativo",
      description: "Respostas ativas capturadas e consolidadas de contatos abordados.",
      requirement: "Registrar pelo menos 20 respostas de moradores",
      currentValue: data.care.responsesRecorded,
      targetValue: 20,
      unlocked: data.care.responsesRecorded >= 20,
      icon: Flame,
      color: "text-orange-600",
      glowBg: "rgba(234, 88, 12, 0.15)",
      accentBorder: "border-orange-500/40",
      iconBg: "bg-red-50",
    },
    {
      id: "operational_diary",
      title: "Diário de Bordo",
      description: "Encontros e relatórios de campo finalizados com documentação de lições.",
      requirement: "Concluir pelo menos 3 ações de campo de escuta",
      currentValue: data.care.fieldActionsCompleted,
      targetValue: 3,
      unlocked: data.care.fieldActionsCompleted >= 3,
      icon: BookOpenCheck,
      color: "text-teal-600",
      glowBg: "rgba(13, 148, 136, 0.15)",
      accentBorder: "border-teal-500/40",
      iconBg: "bg-teal-50",
    }
  ];

  // 2. Campaign Milestones (250 XP each)
  const milestones = [
    {
      id: "m_street_listening",
      title: "Leitura Coletiva das Ruas",
      description: "Campanha oficial de mapeamento de demandas de infraestrutura e serviços.",
      requirement: "Registrar 100 escutas de bairros no formulário oficial.",
      currentValue: data.care.bairroListensSubmitted,
      targetValue: 100,
      completed: data.care.bairroListensSubmitted >= 100,
      xp: 250,
    },
    {
      id: "m_ig_approaches",
      title: "Abordagem Cooperativa",
      description: "Aproximação digital de cidadãos engajados na conta oficial.",
      requirement: "Preparar 150 DMs personalizadas para moradores no Instagram.",
      currentValue: data.care.linksPrepared,
      targetValue: 150,
      completed: data.care.linksPrepared >= 150,
      xp: 250,
    },
    {
      id: "m_dialogues_established",
      title: "Vozes da Democracia",
      description: "Estabelecer conversas ativas com retorno de ideias dos moradores.",
      requirement: "Registrar e catalogar 75 respostas de moradores na base.",
      currentValue: data.care.responsesRecorded,
      targetValue: 75,
      completed: data.care.responsesRecorded >= 75,
      xp: 250,
    },
    {
      id: "m_field_presence",
      title: "Presença Territorial",
      description: "Realização de rodas de conversa e escuta presencial nos bairros.",
      requirement: "Concluir e documentar 20 ações de campo da coordenação.",
      currentValue: data.care.fieldActionsCompleted,
      targetValue: 20,
      completed: data.care.fieldActionsCompleted >= 20,
      xp: 250,
    }
  ];

  // 3. Weekly Active Challenges (150 XP each)
  const challenges = [
    {
      id: "c_organization",
      title: "Fila Limpa (Zero Gargalos)",
      description: "Evitar que tarefas pendentes acumulem ou fiquem estagnadas sem resposta.",
      requirement: "Manter menos de 4 tarefas paradas (stale) na base.",
      currentValue: data.systemAlerts.staleTasks,
      targetValue: 3,
      isPassing: data.systemAlerts.staleTasks <= 3,
      isPositiveMetric: false, // lower is better
      xp: 150,
    },
    {
      id: "c_leadership",
      title: "Mesa Cooperativa (Sem Órfãos)",
      description: "Distribuir todas as novas missões prioritárias entre os operadores.",
      requirement: "Manter menos de 6 missões ativas sem responsável atribuído.",
      currentValue: data.systemAlerts.unassignedTasks,
      targetValue: 5,
      isPassing: data.systemAlerts.unassignedTasks <= 5,
      isPositiveMetric: false, // lower is better
      xp: 150,
    },
    {
      id: "c_territory_push",
      title: "Escuta Intensiva Semanal",
      description: "Coleta ativa de relatos e demandas populares nos bairros mapeados.",
      requirement: "Registrar pelo menos 5 escutas de bairro no ciclo atual.",
      currentValue: data.care.bairroListensSubmitted,
      targetValue: 5,
      isPassing: data.care.bairroListensSubmitted >= 5,
      isPositiveMetric: true, // higher is better
      xp: 150,
    }
  ];

  // XP calculation
  const unlockedAchievementsCount = achievements.filter((a) => a.unlocked).length;
  const completedMilestonesCount = milestones.filter((m) => m.completed).length;
  const passingChallengesCount = challenges.filter((c) => c.isPassing).length;

  const totalXP = 
    (unlockedAchievementsCount * 100) + 
    (completedMilestonesCount * 250) + 
    (passingChallengesCount * 150);

  const maxXP = (achievements.length * 100) + (milestones.length * 250) + (challenges.length * 150);

  // Level classification
  const getClanInfo = (xp: number) => {
    if (xp < 300) return { name: "Recrutas da Base", level: 1, nextLevelXP: 300, minXP: 0 };
    if (xp < 800) return { name: "Clã de Escuta", level: 2, nextLevelXP: 800, minXP: 300 };
    if (xp < 1500) return { name: "Batalhão Territorial", level: 3, nextLevelXP: 1500, minXP: 800 };
    return { name: "Legião da Mobilização Ética", level: 4, nextLevelXP: maxXP, minXP: 1500 };
  };

  const clanInfo = getClanInfo(totalXP);

  // Success Sound Micro-Interaction on Unlocks Increase
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storageKey = "radar_unlocked_achievements_count";
      const savedCountStr = localStorage.getItem(storageKey);
      
      if (savedCountStr !== null) {
        const savedCount = parseInt(savedCountStr, 10);
        if (unlockedAchievementsCount > savedCount) {
          // Play success arpeggio arpeggiated lo-fi sound
          playSynthSuccess();
        }
      }
      localStorage.setItem(storageKey, unlockedAchievementsCount.toString());
    }
  }, [unlockedAchievementsCount]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    playSynthConfirm();
  };

  return (
    <section className="space-y-6">
      {/* 🎯 PORTAL HEADER ZONE */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        
        {/* Descrição Brutalista */}
        <div className="flex-1 space-y-2 border-2 border-charcoal bg-off-white p-6 shadow-[4px_4px_0px_0px_rgba(11,11,11,1)]">
          <div className="flex items-center gap-2 text-zinc-950">
            <Award className="h-6 w-6 text-burnt-yellow fill-amber-500/20" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Portal de Missões e Conquistas</h2>
          </div>
          <p className="text-sm leading-relaxed text-zinc-700 max-w-[55ch]">
            Marcos históricos, desafios de cadência e conquistas desbloqueadas de forma cooperativa. A força do nosso clã é medida pelo engajamento real e o cuidado ético.
          </p>

          {/* XP e Rank Coletivo */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-black uppercase text-[#8b7759]">
              <span>Progresso de Experiência Coletiva (XP)</span>
              <span>{totalXP} / {maxXP} XP</span>
            </div>
            <Progress 
              value={(totalXP / maxXP) * 100} 
              className="h-3 border border-charcoal bg-zinc-200" 
              indicatorClassName="bg-burnt-yellow"
            />
          </div>
        </div>

        {/* Nível do Clã Shield (Ensō-inspired Brutalist) */}
        <div className="flex w-full items-center gap-4 border-2 border-charcoal bg-burnt-yellow p-6 shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] sm:w-auto min-w-[280px]">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center border-2 border-charcoal rounded-[2px] bg-charcoal text-burnt-yellow font-black text-2xl shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">
            {/* ZenEnsō Brush Stroke Effect simulated */}
            <div className="absolute inset-0.5 rounded-full border border-dashed border-burnt-yellow/30 animate-spin-slow pointer-events-none" />
            <span>LVL {clanInfo.level}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#6c4f1c]">Rank do Clã</span>
            <h4 className="text-lg font-black tracking-tight text-charcoal">{clanInfo.name}</h4>
            <p className="text-[11px] font-bold text-[#6c4f1c]">{unlockedAchievementsCount} de 8 conquistas ativas</p>
          </div>
        </div>
      </div>

      {/* 🧭 TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b-2 border-charcoal pb-3">
        <button
          onClick={() => handleTabChange("achievements")}
          className={cn(
            "px-4 py-2 text-xs font-black uppercase tracking-wider transition-all rounded-[2px]",
            activeTab === "achievements"
              ? "bg-charcoal text-off-white border-2 border-charcoal shadow-[2px_2px_0px_0px_rgba(242,169,0,1)] -translate-y-0.5"
              : "bg-[#ede7db]/30 text-charcoal border-2 border-transparent hover:bg-[#ede7db]/60"
          )}
        >
          🧱 Conquistas Coletivas ({unlockedAchievementsCount}/8)
        </button>
        <button
          onClick={() => handleTabChange("milestones")}
          className={cn(
            "px-4 py-2 text-xs font-black uppercase tracking-wider transition-all rounded-[2px]",
            activeTab === "milestones"
              ? "bg-charcoal text-off-white border-2 border-charcoal shadow-[2px_2px_0px_0px_rgba(242,169,0,1)] -translate-y-0.5"
              : "bg-[#ede7db]/30 text-charcoal border-2 border-transparent hover:bg-[#ede7db]/60"
          )}
        >
          📢 Marcos da Campanha ({completedMilestonesCount}/4)
        </button>
        <button
          onClick={() => handleTabChange("challenges")}
          className={cn(
            "px-4 py-2 text-xs font-black uppercase tracking-wider transition-all rounded-[2px]",
            activeTab === "challenges"
              ? "bg-charcoal text-off-white border-2 border-charcoal shadow-[2px_2px_0px_0px_rgba(242,169,0,1)] -translate-y-0.5"
              : "bg-[#ede7db]/30 text-charcoal border-2 border-transparent hover:bg-[#ede7db]/60"
          )}
        >
          🎯 Desafios Ativos ({passingChallengesCount}/3)
        </button>
      </div>

      {/* 🔮 TAB CONTENT PANELS */}

      {/* 🧱 TAB 1: CONQUISTAS COLETIVAS */}
      {activeTab === "achievements" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                      "relative overflow-hidden rounded-[2px] border p-5 transition-all duration-300",
                      "hover:-translate-y-1 hover:-translate-x-1 cursor-help flex flex-col justify-between h-[190px]",
                      achievement.unlocked
                        ? cn(
                            "bg-off-white border-charcoal text-charcoal",
                            "shadow-[4px_4px_0px_0px_rgba(11,11,11,1)]"
                          )
                        : "bg-[#ede7db]/30 border-[#d8c7ac]/40 opacity-70 shadow-sm"
                    )}
                  >
                    {/* Glow effect on hover if unlocked */}
                    {achievement.unlocked && (
                      <div 
                        className="absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl pointer-events-none transition-all duration-300"
                        style={{ backgroundColor: achievement.glowBg }}
                      />
                    )}

                    {/* Top line: Icon and status */}
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-[2px] border-2 border-charcoal",
                          achievement.unlocked ? `${achievement.color} ${achievement.iconBg}` : "text-zinc-400 bg-zinc-50 border-zinc-300"
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      {!achievement.unlocked ? (
                        <div className="flex h-6 w-6 items-center justify-center border border-dashed border-zinc-400 bg-transparent rounded-[2px]">
                          <Lock className="h-3 w-3 text-zinc-400" />
                        </div>
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center border border-charcoal bg-burnt-yellow text-charcoal text-[9px] font-black uppercase rounded-[2px] animate-pulse">
                          XP
                        </div>
                      )}
                    </div>

                    {/* Middle: Title and detail */}
                    <div className="space-y-1 mt-4">
                      <h3 className={cn(
                        "text-sm font-black tracking-tight uppercase",
                        achievement.unlocked ? "text-[#0B0B0B]" : "text-zinc-600"
                      )}>
                        {achievement.title}
                      </h3>
                      <p className="text-[11px] leading-relaxed text-zinc-500 line-clamp-2">
                        {achievement.description}
                      </p>
                    </div>

                    {/* Bottom: Progress bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-black uppercase text-[#8b7759]">
                        <span>{achievement.unlocked ? "Desbloqueado" : "Trancado"}</span>
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
                          "h-1.5 border border-charcoal",
                          achievement.unlocked ? "bg-amber-100" : "bg-zinc-200"
                        )}
                        indicatorClassName={achievement.unlocked ? "bg-amber-500 animate-pulse" : "bg-zinc-400"}
                      />
                    </div>
                  </div>
                } />
                <TooltipContent className="max-w-[240px] p-3 text-xs leading-relaxed rounded-[2px] bg-charcoal text-white border-2 border-charcoal">
                  <p className="font-black uppercase text-burnt-yellow">{achievement.title}</p>
                  <p className="mt-1 text-zinc-300 font-semibold">{achievement.requirement}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-[#d4b678]">Prêmio: +100 XP Coletivo</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      )}

      {/* 📢 TAB 2: MARCOS DA CAMPANHA */}
      {activeTab === "milestones" && (
        <div className="grid gap-4 md:grid-cols-2">
          {milestones.map((milestone) => {
            const progressPercent = Math.min(
              100,
              (milestone.currentValue / milestone.targetValue) * 100
            );

            return (
              <div
                key={milestone.id}
                className={cn(
                  "relative border-2 border-charcoal p-6 flex flex-col justify-between rounded-[4px] bg-off-white transition-all shadow-[4px_4px_0px_0px_rgba(11,11,11,1)]",
                  milestone.completed ? "bg-[linear-gradient(135deg,#fffcf7,#fdf8ee)]" : ""
                )}
              >
                {/* Visual state icon */}
                <div className="absolute right-4 top-4">
                  {milestone.completed ? (
                    <CheckCircle className="h-6 w-6 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Milestone className="h-6 w-6 text-zinc-400" />
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8b7759]">Marco Coletivo</span>
                  <h3 className="text-base font-black tracking-tight text-charcoal uppercase">{milestone.title}</h3>
                  <p className="text-xs text-zinc-600 leading-relaxed max-w-[45ch]">{milestone.description}</p>
                  <p className="text-[11px] font-semibold text-zinc-500 italic">Meta: {milestone.requirement}</p>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black uppercase text-[#8b7759]">
                    <span>Status da Mobilização</span>
                    <span>
                      {Math.round(milestone.currentValue)} / {milestone.targetValue} ({Math.round(progressPercent)}%)
                    </span>
                  </div>
                  <Progress 
                    value={progressPercent} 
                    className="h-2.5 border border-charcoal bg-zinc-200" 
                    indicatorClassName={milestone.completed ? "bg-emerald-500" : "bg-burnt-yellow"}
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-charcoal bg-burnt-yellow px-2 py-0.5 rounded-[2px]">
                      +{milestone.xp} XP Recompensa
                    </span>
                    {milestone.completed && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                        ✓ Recompensa Resgatada
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🎯 TAB 3: DESAFIOS SEMANAIS */}
      {activeTab === "challenges" && (
        <div className="grid gap-4 md:grid-cols-3">
          {challenges.map((challenge) => {
            // Determine progress calculation
            const isCompleted = challenge.isPassing;
            
            return (
              <div
                key={challenge.id}
                className={cn(
                  "border-2 border-charcoal p-5 flex flex-col justify-between rounded-[4px] bg-off-white shadow-[4px_4px_0px_0px_rgba(11,11,11,1)]",
                  isCompleted ? "border-emerald-600 bg-emerald-500/5 shadow-[4px_4px_0px_0px_rgba(5,150,105,1)]" : ""
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#8b7759] border border-charcoal px-2 py-0.5 rounded-[2px] bg-white">
                      Desafio Semanal
                    </span>
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-0.5 rounded-[2px]",
                      isCompleted ? "bg-emerald-600 text-white" : "bg-amber-500 text-charcoal"
                    )}>
                      {isCompleted ? "Concluído" : "Ativo"}
                    </span>
                  </div>
                  <h3 className="text-sm font-black tracking-tight text-charcoal uppercase pt-1">{challenge.title}</h3>
                  <p className="text-[11px] leading-relaxed text-zinc-600">{challenge.description}</p>
                  
                  <div className="rounded-[2px] bg-charcoal/5 p-3 border border-charcoal/10 text-xs">
                    <p className="font-bold text-charcoal">Meta do Ciclo:</p>
                    <p className="text-[11px] text-zinc-700">{challenge.requirement}</p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-dashed border-charcoal/20 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-charcoal">
                    <span>Métrica Atual:</span>
                    <span className={cn(
                      "font-black text-sm",
                      isCompleted ? "text-emerald-700" : "text-amber-700"
                    )}>
                      {challenge.currentValue}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-charcoal bg-burnt-yellow px-1.5 py-0.5 rounded-[1px]">
                      +{challenge.xp} XP
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500">
                      Fase do Ciclo: Ativa
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
