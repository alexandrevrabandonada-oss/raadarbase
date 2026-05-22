export type DailyNarrativeType =
  | "DIA_DE_RETORNO"
  | "DIA_DE_ESCUTA"
  | "DIA_DE_ENCAMINHAMENTO"
  | "DIA_DE_CUIDADO"
  | "DIA_DE_CAMPO"
  | "DIA_DE_MEMORIA";

export type WeeklyNarrativeType =
  | "SEMANA_DE_ORGANIZACAO"
  | "SEMANA_DE_ESCUTA"
  | "SEMANA_DE_ENCAMINHAMENTO"
  | "SEMANA_DE_CAMPO"
  | "SEMANA_DE_MEMORIA";

export type SeasonNarrativeType =
  | "ANUNCIO_DA_PRE_CANDIDATURA"
  | "ACENDER_A_BASE"
  | "ESCUTA_E_VINCULO"
  | "ENCAMINHAMENTO_E_PARTICIPACAO"
  | "TERRITORIO_E_CAMPO"
  | "MEMORIA_E_DEVOLUTIVA"
  | "MOBILIZACAO_SUSTENTADA";

export interface NarrativeSignal {
  label: string;
  value: number;
}

export interface NarrativeCard<TType extends string> {
  type: TType;
  label: string;
  headline: string;
  summary: string;
  support: string;
  nextStep: string;
  signals: NarrativeSignal[];
}

export interface DailyNarrativeInput {
  pendingReturns: number;
  newSignals: number;
  urgentCare: number;
  openReferrals: number;
  fieldWithoutClosure: number;
  pendingMemory: number;
  recurringLinks: number;
}

export interface WeeklyNarrativeInput {
  unassignedMissions: number;
  pendingReturns: number;
  openReferrals: number;
  fieldWithoutClosure: number;
  pendingMemory: number;
  territoriesReady: number;
  staleTasks: number;
  urgentCare: number;
}

export interface SeasonNarrativeInput {
  activeMissions: number;
  recurringLinks: number;
  openReferrals: number;
  fieldWithoutClosure: number;
  pendingMemory: number;
  territoriesInMobilization: number;
  territoriesInField: number;
  territoriesInContinuity: number;
  urgentCare: number;
}

export type DailyNarrative = NarrativeCard<DailyNarrativeType>;
export type WeeklyNarrative = NarrativeCard<WeeklyNarrativeType>;
export type SeasonNarrative = NarrativeCard<SeasonNarrativeType>;
