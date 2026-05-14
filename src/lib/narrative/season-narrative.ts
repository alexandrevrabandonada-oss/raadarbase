import { buildSeasonNarrativeCopy } from "./narrative-copy";
import type { SeasonNarrative, SeasonNarrativeInput, SeasonNarrativeType } from "./narrative-types";

export function buildSeasonNarrative(input: SeasonNarrativeInput): SeasonNarrative {
  let type: SeasonNarrativeType = "ACENDER_A_BASE";

  const territoryActive = input.territoriesInMobilization + input.territoriesInField;

  if (input.pendingMemory > 0 && input.pendingMemory >= input.fieldWithoutClosure) {
    type = "MEMORIA_E_DEVOLUTIVA";
  } else if (input.territoriesInField > 0 || input.fieldWithoutClosure > 0 || territoryActive >= 4) {
    type = "TERRITORIO_E_CAMPO";
  } else if (input.openReferrals > 0) {
    type = "ENCAMINHAMENTO_E_PARTICIPACAO";
  } else if (input.recurringLinks > 0 || input.activeMissions > 8) {
    type = "ESCUTA_E_VINCULO";
  } else if (
    input.activeMissions > 0 &&
    input.urgentCare === 0 &&
    input.pendingMemory === 0 &&
    input.openReferrals === 0 &&
    territoryActive > 0 &&
    input.territoriesInContinuity > 0
  ) {
    type = "MOBILIZACAO_SUSTENTADA";
  }

  return buildSeasonNarrativeCopy(type, [
    { label: "Missões ativas", value: input.activeMissions },
    { label: "Vínculos recorrentes", value: input.recurringLinks },
    { label: "Encaminhamentos", value: input.openReferrals },
    { label: "Territórios ativos", value: territoryActive },
    { label: "Memória pendente", value: input.pendingMemory + input.fieldWithoutClosure },
  ]);
}
