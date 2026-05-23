import { MissionStep } from "./mission-engine";

export interface WeeklyRhythmState {
  weekLabel: string;
  phase: {
    name: string;
    description: string;
    dayType: "preparar" | "conversar" | "fechar" | "campo";
  };
  progress: number;
  steps: MissionStep[];
  criticalPendencies: number;
  nextRitual?: string;
  status: "construcao" | "saudavel" | "atencao" | "fechado";
}

export function calculateWeeklyRhythm(data: {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  tasksDistributed: boolean;
  prioritiesReviewed: boolean;
  responsesRecordedCount: number;
  referralsMadeCount: number;
  stalePendenciesCount: number;
  fieldActionsPlannedCount: number;
  weeklyClosureStarted: boolean;
  dmsConfirmedThisWeekCount: number;
}): WeeklyRhythmState {
  const weekPhases: Record<number, WeeklyRhythmState["phase"]> = {
    1: { name: "Segunda: Preparar a base", description: "Organizar a fila e distribuir tarefas.", dayType: "preparar" },
    2: { name: "Terça: Conversar e encaminhar", description: "Foco total no contato e encaminhamento.", dayType: "conversar" },
    3: { name: "Quarta: Conversar e encaminhar", description: "Foco total no contato e encaminhamento.", dayType: "conversar" },
    4: { name: "Quinta: Conversar e encaminhar", description: "Foco total no contato e encaminhamento.", dayType: "conversar" },
    5: { name: "Sexta: Fechar pendências", description: "Limpar a fila e revisar parados.", dayType: "fechar" },
    6: { name: "Sábado: Campo e Escuta", description: "Ações presenciais e revisão leve.", dayType: "campo" },
    0: { name: "Domingo: Revisão e Descanso", description: "Planejar a próxima jornada.", dayType: "campo" },
  };

  const currentPhase = weekPhases[data.dayOfWeek] || weekPhases[1];

  const steps: MissionStep[] = [
    { id: "registrar_resposta", label: "Mandar 15 DMs na semana", isCompleted: data.dmsConfirmedThisWeekCount >= 15, isCritical: true },
    { id: "encaminhar_interessados", label: "Mandar 50 DMs na semana", isCompleted: data.dmsConfirmedThisWeekCount >= 50, isCritical: true },
    { id: "fechar_relatorio", label: "Mandar 100 DMs na semana (Elite)", isCompleted: data.dmsConfirmedThisWeekCount >= 100, isCritical: false },
    { id: "revisar_pendencias", label: "Pendências da semana sob controle", isCompleted: data.stalePendenciesCount < 3, isCritical: true },
    { id: "distribuir_tarefas", label: "Ações distribuídas na base", isCompleted: data.tasksDistributed, isCritical: true },
    { id: "assumir_tarefas", label: "Escuta ativa nos territórios", isCompleted: data.fieldActionsPlannedCount > 0, isCritical: false },
    { id: "finalizar_fila", label: "Fechamento semanal iniciado", isCompleted: data.weeklyClosureStarted, isCritical: false },
  ];

  const completedSteps = steps.filter(s => s.isCompleted).length;
  const progress = Math.round((completedSteps / steps.length) * 100);

  let status: WeeklyRhythmState["status"] = "construcao";
  if (data.stalePendenciesCount > 10) status = "atencao";
  else if (progress > 80) status = "saudavel";
  if (data.weeklyClosureStarted) status = "fechado";

  return {
    weekLabel: "Semana Atual",
    phase: currentPhase,
    progress,
    steps,
    criticalPendencies: data.stalePendenciesCount,
    nextRitual: data.dayOfWeek === 5 ? "Reunião de Fechamento (Sexta, 17h)" : "Sincronização de Campo (Sábado)",
    status
  };
}
