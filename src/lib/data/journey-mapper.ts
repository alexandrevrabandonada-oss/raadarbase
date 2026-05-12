import type { PersonStatus } from "@/lib/types";

export type JourneyPhase = "preparar" | "conversar" | "registrar" | "encaminhar" | "concluir";

export interface JourneyStatus {
  currentPhase: JourneyPhase;
  completedPhases: JourneyPhase[];
  isBlocked: boolean;
  blockedReason?: string;
  nextStepLabel?: string;
}

export const JOURNEY_PHASES_ORDER: JourneyPhase[] = [
  "preparar",
  "conversar",
  "registrar",
  "encaminhar",
  "concluir",
];

export function mapPersonToJourney(
  status: PersonStatus,
  hasActiveTask: boolean,
  hasActiveReferral: boolean,
  lastInteractionAt?: string | null
): JourneyStatus {
  const completedPhases: JourneyPhase[] = [];
  let currentPhase: JourneyPhase = "preparar";
  let isBlocked = false;
  let blockedReason = "";
  let nextStepLabel = "";

  // 1. Verificação de Bloqueios (Trava Suprema)
  if (status === "nao_abordar") {
    return {
      currentPhase: "preparar",
      completedPhases: [],
      isBlocked: true,
      blockedReason: "Bloqueado por pedido de não contato",
      nextStepLabel: "Respeitar restrição ética",
    };
  }

  // Verificação de Janela de Contato Recente (7 dias)
  if (lastInteractionAt) {
    const lastDate = new Date(lastInteractionAt);
    const diff = Date.now() - lastDate.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days < 3) {
      isBlocked = true;
      blockedReason = "Aguardando janela (Contato recente)";
      nextStepLabel = "Aguardar régua ética";
    }
  }

  // 2. Mapeamento de Fases
  if (hasActiveReferral || status === "contato_confirmado") {
    currentPhase = "concluir";
    completedPhases.push("preparar", "conversar", "registrar", "encaminhar");
    nextStepLabel = "Vínculo concluído com segurança";
  } else if (status === "respondeu") {
    currentPhase = "encaminhar";
    completedPhases.push("preparar", "conversar", "registrar");
    nextStepLabel = "Registrar encaminhamento";
  } else if (status === "abordado" || !hasActiveTask) {
    currentPhase = "registrar";
    completedPhases.push("preparar", "conversar");
    nextStepLabel = "Aguardar resposta ou registrar nota";
  } else if (status === "novo" || hasActiveTask) {
    currentPhase = "conversar";
    completedPhases.push("preparar");
    nextStepLabel = "Copiar DM e enviar manual";
  }

  // Ajuste para fase inicial absoluta
  if (status === "novo" && !hasActiveTask) {
    currentPhase = "preparar";
    completedPhases.length = 0;
    nextStepLabel = "Preparar abordagem";
  }

  return {
    currentPhase,
    completedPhases,
    isBlocked,
    blockedReason,
    nextStepLabel,
  };
}
