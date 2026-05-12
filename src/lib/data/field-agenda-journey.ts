import type { FieldAgendaEvent, FieldAgendaEventResult } from "@/lib/data/field-agenda";

export type FieldJourneyPhaseKey =
  | "planejar"
  | "convidar"
  | "confirmar"
  | "realizar"
  | "registrar"
  | "follow_up";

type JourneyChecklistItem = {
  label: string;
  done: boolean;
};

export type FieldJourneySnapshot = {
  currentPhase: FieldJourneyPhaseKey;
  currentPhaseLabel: string;
  progressPercent: number;
  nextStep: string;
  checklist: JourneyChecklistItem[];
  blockers: string[];
  recommendedActions: string[];
  hasFollowUpTasks: boolean;
  isEventInPastOrNow: boolean;
  shouldShowClosureAlert: boolean;
};

const PHASE_ORDER: FieldJourneyPhaseKey[] = [
  "planejar",
  "convidar",
  "confirmar",
  "realizar",
  "registrar",
  "follow_up",
];

const PHASE_LABEL: Record<FieldJourneyPhaseKey, string> = {
  planejar: "Planejar",
  convidar: "Convidar",
  confirmar: "Confirmar",
  realizar: "Realizar",
  registrar: "Registrar",
  follow_up: "Fazer follow-up",
};

function getMetadataRecord(event: FieldAgendaEvent): Record<string, unknown> {
  const value = event.metadata;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function hasFollowUpSignal(event: FieldAgendaEvent, result: FieldAgendaEventResult | null): boolean {
  const metadata = getMetadataRecord(event);
  const metadataFlag =
    metadata.followUpTasksCreated === true ||
    metadata.postEventTasksCreated === true ||
    (Array.isArray(metadata.followUpTasks) && metadata.followUpTasks.length > 0);

  return Boolean(result?.nextSteps?.trim()) || metadataFlag;
}

function getCurrentPhase(input: {
  event: FieldAgendaEvent;
  result: FieldAgendaEventResult | null;
  isEventInPastOrNow: boolean;
  hasInvites: boolean;
  hasConfirmations: boolean;
  hasFollowUpTasks: boolean;
}): FieldJourneyPhaseKey {
  const { event, result, isEventInPastOrNow, hasInvites, hasConfirmations, hasFollowUpTasks } = input;

  if (hasFollowUpTasks) return "follow_up";
  if (result) return "registrar";
  if (isEventInPastOrNow || event.status === "done") return "realizar";
  if (hasConfirmations) return "confirmar";
  if (hasInvites) return "convidar";
  return "planejar";
}

export function getFieldJourneySnapshot(event: FieldAgendaEvent, result: FieldAgendaEventResult | null): FieldJourneySnapshot {
  const now = Date.now();
  const eventTime = event.startsAt ? new Date(event.startsAt).getTime() : Number.POSITIVE_INFINITY;
  const isEventInPastOrNow = Number.isFinite(eventTime) && eventTime <= now;

  const totalInvited = event.metrics?.totalInvited ?? 0;
  const confirmed = event.metrics?.confirmed ?? 0;
  const hasInvites = totalInvited > 0;
  const hasConfirmations = confirmed > 0;
  const hasResult = Boolean(result);
  const hasFollowUpTasks = hasFollowUpSignal(event, result);

  const currentPhase = getCurrentPhase({
    event,
    result,
    isEventInPastOrNow,
    hasInvites,
    hasConfirmations,
    hasFollowUpTasks,
  });

  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  const progressPercent = Math.round(((currentIndex + 1) / PHASE_ORDER.length) * 100);
  const nextPhase = currentIndex < PHASE_ORDER.length - 1 ? PHASE_ORDER[currentIndex + 1] : null;

  const checklistByPhase: Record<FieldJourneyPhaseKey, JourneyChecklistItem[]> = {
    planejar: [
      { label: "Título e tipo da ação definidos", done: Boolean(event.title && event.type) },
      { label: "Data e hora configuradas", done: Boolean(event.startsAt) },
      { label: "Local e território definidos", done: Boolean(event.locationText || event.neighborhood) },
    ],
    convidar: [
      { label: "Lista de convidados iniciada", done: hasInvites },
      { label: "Convites enviados para pessoas interessadas", done: hasInvites },
      { label: "Pendências de resposta mapeadas", done: (event.metrics?.pendingConfirmation ?? 0) >= 0 },
    ],
    confirmar: [
      { label: "Presenças confirmadas registradas", done: hasConfirmations },
      { label: "Convidados sem resposta identificados", done: (event.metrics?.pendingConfirmation ?? 0) >= 0 },
      { label: "Prioridades de presença organizadas", done: hasConfirmations || hasInvites },
    ],
    realizar: [
      { label: "Evento dentro da janela de execução", done: isEventInPastOrNow || event.status === "done" },
      { label: "Presença em campo registrada", done: (event.metrics?.attended ?? 0) > 0 },
      { label: "Apoios/ajudas registrados", done: (event.metrics?.helped ?? 0) > 0 },
    ],
    registrar: [
      { label: "Resumo agregado do evento registrado", done: hasResult },
      { label: "Estimativa de público registrada", done: Boolean(result?.estimatedPeopleCount) },
      { label: "Aprendizados e próximos passos documentados", done: Boolean(result?.nextSteps?.trim()) },
    ],
    follow_up: [
      { label: "Tarefas pós-evento criadas", done: hasFollowUpTasks },
      { label: "Próximo movimento definido", done: Boolean(result?.nextSteps?.trim()) },
      { label: "Fechamento transformado em memória operacional", done: hasResult },
    ],
  };

  const blockersByPhase: Record<FieldJourneyPhaseKey, string[]> = {
    planejar: [
      !event.startsAt ? "Definir data e hora do evento." : "",
      !event.locationText && !event.neighborhood ? "Definir local ou bairro da ação." : "",
    ].filter(Boolean),
    convidar: [!hasInvites ? "Nenhuma pessoa convidada até agora." : ""].filter(Boolean),
    confirmar: [!hasConfirmations ? "Ainda não há confirmações registradas." : ""].filter(Boolean),
    realizar: [
      !(isEventInPastOrNow || event.status === "done") ? "Data do evento ainda não chegou." : "",
      (isEventInPastOrNow || event.status === "done") && (event.metrics?.attended ?? 0) === 0
        ? "Nenhuma presença registrada no evento."
        : "",
    ].filter(Boolean),
    registrar: [!hasResult ? "Resultado da ação ainda não foi registrado." : ""].filter(Boolean),
    follow_up: [!hasFollowUpTasks ? "Ainda não há tarefa de follow-up registrada." : ""].filter(Boolean),
  };

  const recommendedActionsByPhase: Record<FieldJourneyPhaseKey, string[]> = {
    planejar: [
      "Definir data, horário e local antes de abrir convites.",
      "Vincular bairro e pauta para facilitar o aprendizado territorial.",
    ],
    convidar: [
      "Convidar pessoas interessadas vindas do Radar e registrar status inicial.",
      "Priorizar convites com maior afinidade territorial.",
    ],
    confirmar: [
      "Fazer rodada de confirmação com quem já respondeu.",
      "Concentrar esforço nas confirmações com maior chance de presença.",
    ],
    realizar: [
      "Registrar presença e apoios no mesmo dia da ação.",
      "Fechar o evento com saldo qualitativo do que funcionou e do que travou.",
    ],
    registrar: [
      "Registrar o resultado agregado para não perder aprendizados.",
      "Transformar os próximos passos em tarefas operacionais claras.",
    ],
    follow_up: [
      "Executar os próximos passos com responsáveis e prazo.",
      "Levar aprendizados para a próxima ação de campo no território.",
    ],
  };

  const nextStep = nextPhase
    ? `Próximo passo: ${PHASE_LABEL[nextPhase]}`
    : "Jornada completa. Mantenha o ciclo de aprendizado ativo.";

  const shouldShowClosureAlert = (isEventInPastOrNow || event.status === "done") && !hasResult;

  return {
    currentPhase,
    currentPhaseLabel: PHASE_LABEL[currentPhase],
    progressPercent,
    nextStep,
    checklist: checklistByPhase[currentPhase],
    blockers: blockersByPhase[currentPhase],
    recommendedActions: recommendedActionsByPhase[currentPhase],
    hasFollowUpTasks,
    isEventInPastOrNow,
    shouldShowClosureAlert,
  };
}
