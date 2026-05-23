export type MissionStepId =
  | "assumir_tarefas"
  | "trabalhar_proxima"
  | "confirmar_dm"
  | "registrar_resposta"
  | "encaminhar_interessados"
  | "revisar_pendencias"
  | "finalizar_fila"
  | "distribuir_tarefas"
  | "limpar_orfas"
  | "revisar_paradas"
  | "fechar_relatorio";

export interface MissionStep {
  id: MissionStepId;
  label: string;
  isCompleted: boolean;
  isCritical: boolean;
  hint?: string;
}

export interface MissionState {
  title: string;
  objective: string;
  progress: number; // 0-100
  steps: MissionStep[];
  isCompleted: boolean;
  status: "nao_iniciado" | "em_andamento" | "atencao" | "concluido";
}

export function calculateOperatorMission(data: {
  tasksAssumed: number;
  tasksCompleted: number;
  repliesRecorded: number;
  referralsMade: number;
  stalePending: number;
}): MissionState {
  const steps: MissionStep[] = [
    {
      id: "assumir_tarefas",
      label: "Mandar 5 DMs hoje (Meta inicial)",
      isCompleted: data.tasksCompleted >= 5,
      isCritical: true,
      hint: "Preparar e enviar pelo menos 5 mensagens",
    },
    {
      id: "confirmar_dm",
      label: "Mandar 15 DMs hoje (Ritmo de base)",
      isCompleted: data.tasksCompleted >= 15,
      isCritical: true,
      hint: "Mantenha o contato diário consistente",
    },
    {
      id: "registrar_resposta",
      label: "Mandar 30 DMs hoje (Meta de elite)",
      isCompleted: data.tasksCompleted >= 30,
      isCritical: false,
      hint: "Alta performance de abordagens",
    },
    {
      id: "revisar_pendencias",
      label: "Limpar pendências críticas",
      isCompleted: data.stalePending === 0,
      isCritical: true,
      hint: "Não deixe ninguém parado por mais de 48h",
    },
    {
      id: "finalizar_fila",
      label: "Meta diária concluída",
      isCompleted: data.tasksCompleted >= 15 && data.stalePending === 0,
      isCritical: false,
    },
  ];

  const completedSteps = steps.filter((s) => s.isCompleted).length;
  const progress = Math.round((completedSteps / steps.length) * 100);
  const isCompleted = progress === 100 || (steps.filter(s => s.isCritical && s.isCompleted).length === steps.filter(s => s.isCritical).length);

  return {
    title: "Sua missão de hoje",
    objective: "Organizar vínculos prioritários sem perder retornos.",
    progress,
    steps,
    isCompleted,
    status: progress === 0 ? "nao_iniciado" : isCompleted ? "concluido" : data.stalePending > 3 ? "atencao" : "em_andamento",
  };
}

export function calculateCoordinationMission(data: {
  unassignedTasks: number;
  staleTasks3d: number;
  referralsToReview: number;
  reportGenerated: boolean;
}): MissionState {
  const steps: MissionStep[] = [
    {
      id: "distribuir_tarefas",
      label: "Distribuir novas tarefas",
      isCompleted: data.unassignedTasks < 5,
      isCritical: true,
    },
    {
      id: "limpar_orfas",
      label: "Zerar vínculos órfãos",
      isCompleted: data.unassignedTasks === 0,
      isCritical: true,
    },
    {
      id: "revisar_paradas",
      label: "Revisar paradas há 3+ dias",
      isCompleted: data.staleTasks3d === 0,
      isCritical: true,
    },
    {
      id: "fechar_relatorio",
      label: "Gerar relatório de fechamento",
      isCompleted: data.reportGenerated,
      isCritical: false,
    },
  ];

  const completedSteps = steps.filter((s) => s.isCompleted).length;
  const progress = Math.round((completedSteps / steps.length) * 100);
  const isCompleted = progress === 100;

  return {
    title: "Missão da Coordenação",
    objective: "Garantir que ninguém fique sem resposta ou sem responsável.",
    progress,
    steps,
    isCompleted,
    status: progress === 0 ? "nao_iniciado" : isCompleted ? "concluido" : data.staleTasks3d > 5 ? "atencao" : "em_andamento",
  };
}
