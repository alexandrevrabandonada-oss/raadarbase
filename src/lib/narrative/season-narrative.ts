import { buildSeasonNarrativeCopy } from "./narrative-copy";
import type { SeasonNarrative, SeasonNarrativeInput, SeasonNarrativeType } from "./narrative-types";

export function buildSeasonNarrative(input: SeasonNarrativeInput): SeasonNarrative {
  const type: SeasonNarrativeType = "ANUNCIO_DA_PRE_CANDIDATURA";

  const territoryActive = input.territoriesInMobilization + input.territoriesInField;

  return buildSeasonNarrativeCopy(type, [
    { label: "Sinais para retorno", value: input.activeMissions },
    { label: "Pessoas recorrentes", value: input.recurringLinks },
    { label: "Caminhos abertos", value: input.openReferrals },
    { label: "Bairros em leitura", value: territoryActive },
    { label: "Fechamentos pendentes", value: input.pendingMemory + input.fieldWithoutClosure },
  ]);
}
