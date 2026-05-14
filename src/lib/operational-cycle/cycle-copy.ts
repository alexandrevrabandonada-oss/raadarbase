import { severityForGuardrail } from "./cycle-priority";
import type { OperationalCycleActionCode, OperationalCycleGuardrailCode } from "./cycle-types";

export const OPERATIONAL_CYCLE_FORBIDDEN_WORDS = [
  "lead",
  "conversao",
  "conversão",
  "eleitor",
  "persuadir",
  "disparo",
] as const;

export const OPERATIONAL_CYCLE_COPY = {
  carePause: "Cuidar também é pausar.",
  interestNeedsConsent: "Interesse não é consentimento.",
  manualSendConfirmation: "Mensagem manual: confirme apenas depois de enviar.",
  fieldNeedsMemory: "Campo sem memória ainda é ciclo aberto.",
  safeClosure: "Ciclo fechado com segurança.",
} as const;

function normalizeOperationalCycleText(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function containsForbiddenOperationalCycleWords(text: string) {
  const normalized = normalizeOperationalCycleText(text);
  return OPERATIONAL_CYCLE_FORBIDDEN_WORDS.some((word) =>
    normalized.includes(normalizeOperationalCycleText(word)),
  );
}

export function assertOperationalCycleText(text: string) {
  const forbiddenWord = OPERATIONAL_CYCLE_FORBIDDEN_WORDS.find((word) =>
    normalizeOperationalCycleText(text).includes(normalizeOperationalCycleText(word)),
  );
  if (forbiddenWord) {
    throw new Error(`Texto do ciclo contém termo proibido: ${forbiddenWord}`);
  }
  return text;
}

export function guardrailCopy(guardrail: OperationalCycleGuardrailCode) {
  switch (guardrail) {
    case "do_not_contact":
      return {
        label: "Não abordar",
        message: OPERATIONAL_CYCLE_COPY.carePause,
      };
    case "recent_contact":
      return {
        label: "Contato recente",
        message: OPERATIONAL_CYCLE_COPY.carePause,
      };
    case "consent_required":
      return {
        label: "Consentimento necessário",
        message: OPERATIONAL_CYCLE_COPY.interestNeedsConsent,
      };
    case "sensitive_data":
      return {
        label: "Dado sensível",
        message: "Dado sensível pede revisão antes de circular na base.",
      };
    case "waiting_window":
      return {
        label: "Janela de espera",
        message: OPERATIONAL_CYCLE_COPY.carePause,
      };
    case "overload":
      return {
        label: "Sobrecarga",
        message: "Carga alta pede redistribuição antes de acelerar a base.",
      };
    case "manual_action_required":
      return {
        label: "Ação manual necessária",
        message: OPERATIONAL_CYCLE_COPY.manualSendConfirmation,
      };
  }
}

export function actionIsManualOnly(action: OperationalCycleActionCode) {
  return action === "prepare_message" || action === "open_instagram" || action === "confirm_manual_send";
}

export function actionAllowsAutomation(action: OperationalCycleActionCode) {
  return action !== "confirm_manual_send" && action !== "prepare_message" && action !== "open_instagram";
}

export function severityLabelForGuardrail(guardrail: OperationalCycleGuardrailCode) {
  return severityForGuardrail(guardrail);
}
