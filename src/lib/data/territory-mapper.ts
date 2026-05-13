import { TerritorySummary } from "@/lib/types";

export type TerritoryPhaseId = 
  | "observacao" 
  | "escuta" 
  | "mobilizacao" 
  | "campo" 
  | "continuidade";

export interface TerritoryPhaseInfo {
  id: TerritoryPhaseId;
  label: string;
  description: string;
  reason: string;
  nextStep: string;
  nextActionUrl: string;
  color: string;
}

export function mapTerritoryToPhase(data: TerritorySummary): TerritoryPhaseInfo {
  const hasRecentAction = data.lastActionAt && 
    (new Date().getTime() - new Date(data.lastActionAt).getTime()) < 30 * 24 * 60 * 60 * 1000;
  
  const hasManyPriority = data.priorityPeople > 5;
  const hasOpenTasks = data.openTasks > 0;
  const hasAnyAction = data.fieldActions > 0;

  // 1. Continuidade: Ação realizada recentemente e ainda há pendências ou acompanhamento
  if (hasRecentAction && (hasOpenTasks || data.referrals > 0)) {
    return {
      id: "continuidade",
      label: "Continuidade",
      description: "Ação realizada e vínculos em acompanhamento.",
      reason: "Bairro teve ação recente e possui registros pendentes de retorno.",
      nextStep: "Revisar continuidade dos vínculos",
      nextActionUrl: `/relatorios/territorios?bairro=${data.neighborhood}&tab=vinculos`,
      color: "bg-emerald-500",
    };
  }

  // 2. Campo: Ação de campo em ciclo ativo
  if (hasAnyAction && (hasRecentAction || data.priorityScore > 70)) {
    return {
      id: "campo",
      label: "Campo",
      description: "Ciclo de presença ativa no território.",
      reason: "Território possui histórico de campo e alta relevância atual.",
      nextStep: "Fechar relatório pós-evento ou planejar nova data",
      nextActionUrl: `/relatorios/territorios?bairro=${data.neighborhood}`,
      color: "bg-indigo-600",
    };
  }

  // 3. Mobilização: Alta pauta e pessoas engajadas
  if (hasManyPriority || (data.priorityScore > 50 && hasOpenTasks)) {
    return {
      id: "mobilizacao",
      label: "Mobilização",
      description: "Pessoas prioritárias com pautas claras identificadas.",
      reason: "Alto volume de pessoas engajadas aguardando direcionamento.",
      nextStep: "Criar ação de campo baseada nas pautas",
      nextActionUrl: `/campo/novo?neighborhood=${data.neighborhood}`,
      color: "bg-amber-500",
    };
  }

  // 4. Escuta: Sinais recorrentes mas sem organização clara ainda
  if (data.peopleMonitored > 10 || data.priorityPeople > 0) {
    return {
      id: "escuta",
      label: "Escuta",
      description: "Sinais recorrentes demandando organização.",
      reason: "Volume de escuta digital sugere necessidade de triagem humana.",
      nextStep: "Planejar escuta ativa ou triagem de vínculos",
      nextActionUrl: `/abordagem?bairro=${data.neighborhood}`,
      color: "bg-sky-500",
    };
  }

  // 5. Observação: Triagem inicial de sinais
  return {
    id: "observacao",
    label: "Observação",
    description: "Sinais iniciais em monitoramento passivo.",
    reason: "Baixo volume de engajamento direto até o momento.",
    nextStep: "Acompanhar novos sinais na Escuta Digital",
    nextActionUrl: `/escuta/dashboard?bairro=${data.neighborhood}`,
    color: "bg-zinc-400",
  };
}
