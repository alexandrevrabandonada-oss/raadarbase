import { buildDailyNarrativeCopy } from "./narrative-copy";
import type { DailyNarrative, DailyNarrativeInput, DailyNarrativeType } from "./narrative-types";

export function buildDailyNarrative(input: DailyNarrativeInput): DailyNarrative {
  let type: DailyNarrativeType = "DIA_DE_ESCUTA";

  if (input.urgentCare > 0) {
    type = "DIA_DE_CUIDADO";
  } else if (input.pendingReturns > 0) {
    type = "DIA_DE_RETORNO";
  } else if (input.openReferrals > 0) {
    type = "DIA_DE_ENCAMINHAMENTO";
  } else if (input.fieldWithoutClosure > 0) {
    type = "DIA_DE_CAMPO";
  } else if (input.pendingMemory > 0) {
    type = "DIA_DE_MEMORIA";
  } else if (input.newSignals > 0) {
    type = "DIA_DE_ESCUTA";
  } else if (input.recurringLinks > 0) {
    type = "DIA_DE_ESCUTA";
  }

  return buildDailyNarrativeCopy(type, [
    { label: "Retornos", value: input.pendingReturns },
    { label: "Sinais novos", value: input.newSignals },
    { label: "Cuidados urgentes", value: input.urgentCare },
    { label: "Encaminhamentos", value: input.openReferrals },
    { label: "Campo aberto", value: input.fieldWithoutClosure + input.pendingMemory },
  ]);
}
