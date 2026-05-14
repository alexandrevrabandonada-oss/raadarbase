import { buildWeeklyNarrativeCopy } from "./narrative-copy";
import type { WeeklyNarrative, WeeklyNarrativeInput, WeeklyNarrativeType } from "./narrative-types";

export function buildWeeklyNarrative(input: WeeklyNarrativeInput): WeeklyNarrative {
  let type: WeeklyNarrativeType = "SEMANA_DE_ORGANIZACAO";

  if (input.pendingMemory > 0 && input.pendingMemory >= input.territoriesReady) {
    type = "SEMANA_DE_MEMORIA";
  } else if (input.fieldWithoutClosure > 0 || input.territoriesReady > 0) {
    type = "SEMANA_DE_CAMPO";
  } else if (input.openReferrals > 0) {
    type = "SEMANA_DE_ENCAMINHAMENTO";
  } else if (input.pendingReturns > 0 || input.urgentCare > 0) {
    type = "SEMANA_DE_ORGANIZACAO";
  } else if (input.staleTasks > 0 || input.unassignedMissions > 0) {
    type = "SEMANA_DE_ORGANIZACAO";
  } else {
    type = "SEMANA_DE_ESCUTA";
  }

  return buildWeeklyNarrativeCopy(type, [
    { label: "Sem responsável", value: input.unassignedMissions },
    { label: "Retornos", value: input.pendingReturns },
    { label: "Encaminhamentos", value: input.openReferrals },
    { label: "Campo aberto", value: input.fieldWithoutClosure },
    { label: "Memória", value: input.pendingMemory },
  ]);
}
