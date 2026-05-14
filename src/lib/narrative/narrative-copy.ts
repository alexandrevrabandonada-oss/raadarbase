import type {
  DailyNarrative,
  DailyNarrativeType,
  NarrativeCard,
  NarrativeSignal,
  SeasonNarrative,
  SeasonNarrativeType,
  WeeklyNarrative,
  WeeklyNarrativeType,
} from "./narrative-types";
import {
  OPERATIONAL_CYCLE_COPY,
  assertOperationalCycleText,
  containsForbiddenOperationalCycleWords,
} from "@/lib/operational-cycle/cycle-copy";

type NarrativeCopyTemplate<TType extends string> = Omit<NarrativeCard<TType>, "signals">;

const DAILY_COPY: Record<DailyNarrativeType, NarrativeCopyTemplate<DailyNarrativeType>> = {
  DIA_DE_RETORNO: {
    type: "DIA_DE_RETORNO",
    label: "Dia de Retorno",
    headline: "Hoje é Dia de Retorno",
    summary: "Registre o que já aconteceu antes de abrir novas conversas.",
    support: "Retornos pendentes pedem fechamento curto, contexto preservado e menos dispersão.",
    nextStep: "Fechar retornos e confirmar os registros manuais do ciclo.",
  },
  DIA_DE_ESCUTA: {
    type: "DIA_DE_ESCUTA",
    label: "Dia de Escuta",
    headline: "Hoje é Dia de Escuta",
    summary: "Organize os sinais novos e prepare respostas contextuais com calma.",
    support: "Sinais públicos recentes pedem leitura antes de qualquer avanço de vínculo.",
    nextStep: "Separar os sinais mais claros e preparar respostas contextualizadas.",
  },
  DIA_DE_ENCAMINHAMENTO: {
    type: "DIA_DE_ENCAMINHAMENTO",
    label: "Dia de Encaminhamento",
    headline: "Hoje é Dia de Encaminhamento",
    summary: "Pessoas responderam e precisam de caminho claro, com consentimento.",
    support: `${OPERATIONAL_CYCLE_COPY.interestNeedsConsent} Encaminhamento aberto é ciclo incompleto mesmo quando a conversa andou bem.`,
    nextStep: "Escolher o próximo caminho e registrar o destino combinado.",
  },
  DIA_DE_CUIDADO: {
    type: "DIA_DE_CUIDADO",
    label: "Dia de Cuidado",
    headline: "Hoje é Dia de Cuidado",
    summary: "Bloqueios, pausas e pontos sensíveis pedem revisão antes de qualquer aceleração.",
    support: "Cuidado bem feito protege a base e evita que a operação perca contexto ético.",
    nextStep: "Revisar guardrails, pausas e registros sensíveis antes de abrir frente nova.",
  },
  DIA_DE_CAMPO: {
    type: "DIA_DE_CAMPO",
    label: "Dia de Campo",
    headline: "Hoje é Dia de Campo",
    summary: "Feche presença, confirmação e resultado das ações já abertas.",
    support: OPERATIONAL_CYCLE_COPY.fieldNeedsMemory,
    nextStep: "Registrar presença, confirmação e devolutiva das ações presenciais.",
  },
  DIA_DE_MEMORIA: {
    type: "DIA_DE_MEMORIA",
    label: "Dia de Memória",
    headline: "Hoje é Dia de Memória",
    summary: "Transforme o que aconteceu em registro útil para o próximo ciclo.",
    support: "Memória curta reduz repetição de esforço e sustenta continuidade entre equipes.",
    nextStep: "Fechar rascunhos e consolidar os aprendizados recentes da base.",
  },
};

const WEEKLY_COPY: Record<WeeklyNarrativeType, NarrativeCopyTemplate<WeeklyNarrativeType>> = {
  SEMANA_DE_ORGANIZACAO: {
    type: "SEMANA_DE_ORGANIZACAO",
    label: "Semana de Organização",
    headline: "Semana de Organização",
    summary: "Distribuição, limpeza de fila e revisão de travas sustentam o restante do ciclo.",
    support: "Quando a base organiza cedo, missão e território andam com menos perda de contexto.",
    nextStep: "Distribuir responsabilidades e reduzir pendências antigas primeiro.",
  },
  SEMANA_DE_ESCUTA: {
    type: "SEMANA_DE_ESCUTA",
    label: "Semana de Escuta",
    headline: "Semana de Escuta",
    summary: "Sinais novos pedem leitura cuidadosa e preparo antes de puxar vínculo.",
    support: "Escuta boa não acelera por volume; ela melhora a qualidade do próximo passo.",
    nextStep: "Agrupar sinais recorrentes e preparar respostas contextualizadas.",
  },
  SEMANA_DE_ENCAMINHAMENTO: {
    type: "SEMANA_DE_ENCAMINHAMENTO",
    label: "Semana de Encaminhamento",
    headline: "Semana de Encaminhamento",
    summary: "Pessoas responderam e precisam de caminho registrado com clareza.",
    support: "Encaminhar bem agora evita travas, esquecimentos e retornos sem destino depois.",
    nextStep: "Fechar encaminhamentos abertos e registrar destino com consentimento.",
  },
  SEMANA_DE_CAMPO: {
    type: "SEMANA_DE_CAMPO",
    label: "Semana de Campo",
    headline: "Semana de Campo",
    summary: "Território e presença pedem ação enxuta com fechamento garantido.",
    support: "Campo bem amarrado conecta prontidão territorial, confirmação e resultado agregado.",
    nextStep: "Planejar ou fechar ações presenciais nos territórios que já amadureceram.",
  },
  SEMANA_DE_MEMORIA: {
    type: "SEMANA_DE_MEMORIA",
    label: "Semana de Memória",
    headline: "Semana de Memória",
    summary: "Aprendizados e devolutivas precisam virar registro acessível para a equipe.",
    support: `${OPERATIONAL_CYCLE_COPY.fieldNeedsMemory} Sem memória consolidada, o próximo ciclo volta a perguntar o que já foi entendido.`,
    nextStep: "Fechar rascunhos e publicar a síntese do que a base aprendeu.",
  },
};

const SEASON_COPY: Record<SeasonNarrativeType, NarrativeCopyTemplate<SeasonNarrativeType>> = {
  ACENDER_A_BASE: {
    type: "ACENDER_A_BASE",
    label: "Acender a Base",
    headline: "Temporada de Acender a Base",
    summary: "A operação ainda está ganhando corpo e precisa de organização inicial.",
    support: "Abrir base é distribuir contexto, limpar travas e consolidar o primeiro ritmo comum.",
    nextStep: "Aumentar cobertura responsável sem abrir frentes maiores do que a base sustenta.",
  },
  ESCUTA_E_VINCULO: {
    type: "ESCUTA_E_VINCULO",
    label: "Escuta e Vínculo",
    headline: "Temporada de Escuta e Vínculo",
    summary: "Transforme sinais públicos em conversas cuidadosas e continuidade de contexto.",
    support: "A base cresce melhor quando a escuta vira vínculo progressivo, não pressão difusa.",
    nextStep: "Priorizar sinais quentes e recorrentes para abrir conversas contextualizadas.",
  },
  ENCAMINHAMENTO_E_PARTICIPACAO: {
    type: "ENCAMINHAMENTO_E_PARTICIPACAO",
    label: "Encaminhamento e Participação",
    headline: "Temporada de Encaminhamento e Participação",
    summary: "O ciclo já recebeu resposta e agora precisa de caminho viável para avançar.",
    support: "Quando o encaminhamento aparece cedo, a base evita promessas vagas e sustenta participação real.",
    nextStep: "Escolher destinos claros e acompanhar os próximos passos combinados.",
  },
  TERRITORIO_E_CAMPO: {
    type: "TERRITORIO_E_CAMPO",
    label: "Território e Campo",
    headline: "Temporada de Território e Campo",
    summary: "Bairros e ações presenciais pedem coordenação curta, foco e fechamento.",
    support: "Território amadurecido precisa de presença com memória, não só de leitura bonita no mapa.",
    nextStep: "Abrir ou fechar ações de campo onde o território já mostrou prontidão.",
  },
  MEMORIA_E_DEVOLUTIVA: {
    type: "MEMORIA_E_DEVOLUTIVA",
    label: "Memória e Devolutiva",
    headline: "Temporada de Memória e Devolutiva",
    summary: "O que a base viveu precisa virar aprendizado compartilhado e fechamento de ciclo.",
    support: "Memória consolidada reduz repetição de esforço e qualifica a próxima rodada de missão.",
    nextStep: "Fechar registros, consolidar aprendizados e preparar devolutivas internas.",
  },
  MOBILIZACAO_SUSTENTADA: {
    type: "MOBILIZACAO_SUSTENTADA",
    label: "Mobilização Sustentada",
    headline: "Temporada de Mobilização Sustentada",
    summary: "A base já tem ritmo suficiente para operar com continuidade sem perder cuidado.",
    support: "O desafio agora é manter consistência, distribuir carga e preservar contexto entre frentes.",
    nextStep: "Sustentar a cadência com redistribuição saudável e fechamento frequente.",
  },
};

export function assertNarrativeText(text: string) {
  return assertOperationalCycleText(text);
}

function finalizeNarrative<TType extends string>(
  template: NarrativeCopyTemplate<TType>,
  signals: NarrativeSignal[],
): NarrativeCard<TType> {
  return {
    ...template,
    headline: assertNarrativeText(template.headline),
    summary: assertNarrativeText(template.summary),
    support: assertNarrativeText(template.support),
    nextStep: assertNarrativeText(template.nextStep),
    signals,
  };
}

export function buildDailyNarrativeCopy(type: DailyNarrativeType, signals: NarrativeSignal[]): DailyNarrative {
  return finalizeNarrative(DAILY_COPY[type], signals);
}

export function buildWeeklyNarrativeCopy(type: WeeklyNarrativeType, signals: NarrativeSignal[]): WeeklyNarrative {
  return finalizeNarrative(WEEKLY_COPY[type], signals);
}

export function buildSeasonNarrativeCopy(type: SeasonNarrativeType, signals: NarrativeSignal[]): SeasonNarrative {
  return finalizeNarrative(SEASON_COPY[type], signals);
}

export function narrativeContainsForbiddenWords(text: string) {
  return containsForbiddenOperationalCycleWords(text);
}
