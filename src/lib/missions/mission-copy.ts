import type { MissionAction, MissionCreatedFrom, MissionGuardrail, MissionSignal, MissionType } from "./mission-types";
import { OPERATIONAL_CYCLE_COPY, guardrailCopy } from "@/lib/operational-cycle/cycle-copy";

export function manualOnlyGuardrail(): MissionGuardrail {
  return {
    code: "manual_only",
    label: guardrailCopy("manual_action_required").label,
    message: guardrailCopy("manual_action_required").message,
    blocksContact: false,
  };
}

export function blockedGuardrail(reason: string): MissionGuardrail {
  return {
    code: "do_not_contact",
    label: guardrailCopy("do_not_contact").label,
    message: reason || guardrailCopy("do_not_contact").message,
    blocksContact: true,
  };
}

export function waitGuardrail(message: string): MissionGuardrail {
  return {
    code: "wait_window",
    label: "Janela ética ativa",
    message: message || OPERATIONAL_CYCLE_COPY.carePause,
    blocksContact: true,
  };
}

export function noGuardrail(): MissionGuardrail {
  return {
    code: "none",
    label: "Sem bloqueio",
    message: "Nenhum bloqueio operacional identificado nesta missão.",
    blocksContact: false,
  };
}

export function contactBlockedActions(): { primary: MissionAction; secondary: MissionAction[] } {
  return {
    primary: {
      id: "respeitar_bloqueio",
      label: "Respeitar bloqueio",
      kind: "close",
    },
    secondary: [
      {
        id: "revisar_historico",
        label: "Revisar histórico",
        kind: "review",
      },
    ],
  };
}

export function waitingActions(): { primary: MissionAction; secondary: MissionAction[] } {
  return {
    primary: {
      id: "aguardar_janela",
      label: "Aguardar janela",
      kind: "wait",
    },
    secondary: [
      {
        id: "revisar_contexto",
        label: "Revisar contexto",
        kind: "review",
      },
    ],
  };
}

export function missionTitle(type: MissionType, subjectLabel: string): string {
  switch (type) {
    case "CUIDADO":
      return `Cuidado com ${subjectLabel}`;
    case "RETORNO":
      return `Fechar retorno com ${subjectLabel}`;
    case "ENCAMINHAMENTO":
      return `Encaminhar ${subjectLabel} com consentimento`;
    case "ESCUTA":
      return `Preparar escuta para ${subjectLabel}`;
    case "VINCULO":
      return `Abrir vínculo com ${subjectLabel}`;
    case "CAMPO":
      return `Fechar missão de campo: ${subjectLabel}`;
    case "MEMORIA":
      return `Registrar memória: ${subjectLabel}`;
  }
}

export function explainMission(
  title: string,
  reason: string,
  nextStep: string,
  signals: MissionSignal[],
  createdFrom: MissionCreatedFrom[],
): string {
  const signalText = signals.map((signal) => signal.label).join("; ");
  const sources = createdFrom.map((source) => source.source).join(", ");
  return `${title}. ${reason} Próximo passo: ${nextStep}. Sinais usados: ${signalText}. Fontes: ${sources}.`;
}
