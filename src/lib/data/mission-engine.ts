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
      label: "Assumir tarefas prioritárias",
      isCompleted: data.tasksAssumed > 0,
      isCritical: true,
      hint: "Pegue novos vínculos na lista operacional",
    },
    {
      id: "confirmar_dm",
      label: "Confirmar envios de DM",
      isCompleted: data.tasksCompleted > 0,
      isCritical: true,
    },
    {
      id: "registrar_resposta",
      label: "Registrar respostas recebidas",
      isCompleted: data.repliesRecorded > 0,
      isCritical: true,
    },
    {
      id: "encaminhar_interessados",
      label: "Fazer encaminhamentos",
      isCompleted: data.referralsMade > 0,
      isCritical: false,
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
      label: "Finalizar fila do dia",
      isCompleted: data.tasksAssumed > 0 && data.stalePending === 0 && data.tasksCompleted > 0,
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
