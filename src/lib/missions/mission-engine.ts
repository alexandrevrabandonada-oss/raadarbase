import type { InteractionWithPost, PersonWithContact } from "@/lib/types";
import { compareMissionPriority, resolveMissionPriority } from "./mission-priority";
import {
  blockedGuardrail,
  contactBlockedActions,
  explainMission,
  manualOnlyGuardrail,
  missionTitle,
  noGuardrail,
  waitingActions,
  waitGuardrail,
} from "./mission-copy";
import { buildStableMissionId, createSource, deriveMissionState, phaseForMission } from "./mission-mappers";
import {
  daysSince,
  getActiveTask,
  getLatestInteraction,
  hasDoNotContact,
  hasLongOpenCycle,
  hasPositiveResponseWithoutDestination,
  hasPreparedDmWithoutConfirmation,
  hasRecentContactSignal,
  hasRecentThematicComment,
  hasRecurringInteractions,
} from "./mission-guards";
import type { MissionEngineInput, MissionFieldInput, MissionPersonInput, MissionSignal, RadarMission } from "./mission-types";

function getSubjectLabel(person: PersonWithContact): string {
  return person.displayName || `@${person.username}`;
}

function baseSignals(mainTheme: string | null, latestInteraction: InteractionWithPost | null): MissionSignal[] {
  const signals: MissionSignal[] = [];

  if (mainTheme) {
    signals.push({
      code: "main_theme",
      label: `Tema principal: ${mainTheme}`,
      severity: "info",
    });
  }

  if (latestInteraction) {
    signals.push({
      code: `interaction_${latestInteraction.type}`,
      label: `Interação recente: ${latestInteraction.type}`,
      detail: latestInteraction.text || undefined,
      severity: "info",
      at: latestInteraction.occurredAt,
    });
  }

  return signals;
}

function getMainTheme(person: PersonWithContact, interactions: InteractionWithPost[]): string | null {
  return interactions.find((interaction) => interaction.theme)?.theme ?? person.themes[0] ?? null;
}

function buildPersonMissionFromKind(
  input: MissionPersonInput,
  kind:
    | "DO_NOT_CONTACT"
    | "RECENT_CONTACT"
    | "LONG_WAIT"
    | "DM_PREPARED"
    | "POSITIVE_RESPONSE"
    | "RECENT_COMMENT"
    | "RECURRING_INTERACTIONS",
  now: Date,
): RadarMission {
  const { person, interactions, tasks = [], referrals = [], auditLogs = [] } = input;
  const activeTask = getActiveTask(tasks);
  const latestInteraction = getLatestInteraction(interactions);
  const subjectLabel = getSubjectLabel(person);
  const theme = getMainTheme(person, interactions);
  const sourceRefs = [
    createSource("ig_people", person.id),
    latestInteraction ? createSource("ig_interactions", latestInteraction.id) : null,
    activeTask ? createSource("outreach_tasks", activeTask.id) : null,
    referrals[0] ? createSource("ig_person_referrals", referrals[0].id) : null,
    auditLogs[0] ? createSource("audit_logs", auditLogs[0].id) : null,
  ].filter((value): value is NonNullable<typeof value> => Boolean(value));

  switch (kind) {
    case "DO_NOT_CONTACT": {
      const reason = person.doNotContactReason || "Pessoa com restrição explícita de contato.";
      const actions = contactBlockedActions();
      const mission: RadarMission = {
        id: buildStableMissionId("CUIDADO", "person", person.id),
        type: "CUIDADO",
        phase: "CONCLUIR",
        state: "BLOQUEADA",
        title: missionTitle("CUIDADO", subjectLabel),
        subjectType: "person",
        subjectId: person.id,
        reason,
        signals: [
          {
            code: "do_not_contact",
            label: "Não abordar ativo",
            detail: reason,
            severity: "critical",
          },
        ],
        guardrail: blockedGuardrail(reason),
        nextStep: "Respeitar bloqueio e evitar qualquer nova abordagem.",
        primaryAction: actions.primary,
        secondaryActions: actions.secondary,
        priority: resolveMissionPriority("CUIDADO", "BLOQUEADA"),
        createdFrom: sourceRefs,
        explainabilityText: "",
      };
      mission.explainabilityText = explainMission(mission.title, mission.reason, mission.nextStep, mission.signals, mission.createdFrom);
      return mission;
    }
    case "RECENT_CONTACT": {
      const actions = waitingActions();
      const reason = "Houve contato recente. A missão entra em espera para respeitar a janela ética.";
      const mission: RadarMission = {
        id: buildStableMissionId("CUIDADO", "person", person.id),
        type: "CUIDADO",
        phase: "CONCLUIR",
        state: "EM_ESPERA",
        title: missionTitle("CUIDADO", subjectLabel),
        subjectType: "person",
        subjectId: person.id,
        reason,
        signals: [
          {
            code: "recent_contact",
            label: "Contato recente detectado",
            severity: "attention",
            at: person.contact?.last_contacted_at ?? latestInteraction?.occurredAt ?? null,
          },
        ],
        guardrail: waitGuardrail("Aguardar a janela antes de retomar o contato."),
        nextStep: "Aguardar janela antes de abrir nova conversa.",
        primaryAction: actions.primary,
        secondaryActions: actions.secondary,
        priority: resolveMissionPriority("CUIDADO", "EM_ESPERA"),
        createdFrom: sourceRefs,
        explainabilityText: "",
      };
      mission.explainabilityText = explainMission(mission.title, mission.reason, mission.nextStep, mission.signals, mission.createdFrom);
      return mission;
    }
    case "LONG_WAIT": {
      const waitDays = daysSince(person.lastInteractionAt ?? person.contact?.last_contacted_at ?? null, now);
      const mission: RadarMission = {
        id: buildStableMissionId("CUIDADO", "person", person.id),
        type: "CUIDADO",
        phase: "CONCLUIR",
        state: "EM_ESPERA",
        title: missionTitle("CUIDADO", subjectLabel),
        subjectType: "person",
        subjectId: person.id,
        reason: "Há um ciclo aberto há tempo demais sem fechamento claro.",
        signals: [
          {
            code: "long_open_cycle",
            label: "Espera longa detectada",
            detail: waitDays !== null ? `${Math.floor(waitDays)} dias desde o último avanço.` : undefined,
            severity: "critical",
          },
        ],
        guardrail: noGuardrail(),
        nextStep: "Revisar a trava e decidir se retoma, encaminha ou fecha o ciclo com cuidado.",
        primaryAction: {
          id: "revisar_trava",
          label: "Revisar trava",
          kind: "review",
          cycleAction: "review",
        },
        secondaryActions: [
          {
            id: "registrar_nota",
            label: "Registrar nota",
            kind: "record",
            cycleAction: "register_response",
          },
        ],
        priority: resolveMissionPriority("CUIDADO", "EM_ESPERA"),
        createdFrom: sourceRefs,
        explainabilityText: "",
      };
      mission.explainabilityText = explainMission(mission.title, mission.reason, mission.nextStep, mission.signals, mission.createdFrom);
      return mission;
    }
    case "DM_PREPARED": {
      const mission: RadarMission = {
        id: buildStableMissionId("RETORNO", "person", person.id),
        type: "RETORNO",
        phase: phaseForMission("RETORNO"),
        state: activeTask?.responsibleId ? "EM_ANDAMENTO" : deriveMissionState(person.responsibleId),
        title: missionTitle("RETORNO", subjectLabel),
        subjectType: "person",
        subjectId: person.id,
        reason: "Existe preparação de DM sem confirmação de envio manual.",
        signals: [
          {
            code: "dm_prepared",
            label: "DM preparada sem confirmação",
            severity: "attention",
          },
        ],
        guardrail: manualOnlyGuardrail(),
        nextStep: "Confirmar o envio manual antes de avançar o status.",
        primaryAction: {
          id: "confirmar_envio_manual",
          label: "Confirmar envio manual",
          kind: "record",
          cycleAction: "confirm_manual_send",
        },
        secondaryActions: [
          {
            id: "abrir_instagram",
            label: "Abrir Instagram",
            kind: "open_external",
            cycleAction: "open_instagram",
          },
          {
            id: "revisar_mensagem",
            label: "Revisar mensagem",
            kind: "review",
            cycleAction: "prepare_message",
          },
        ],
        priority: resolveMissionPriority("RETORNO", activeTask?.responsibleId ? "EM_ANDAMENTO" : deriveMissionState(person.responsibleId)),
        createdFrom: sourceRefs,
        explainabilityText: "",
      };
      mission.explainabilityText = explainMission(mission.title, mission.reason, mission.nextStep, mission.signals, mission.createdFrom);
      return mission;
    }
    case "POSITIVE_RESPONSE": {
      const mission: RadarMission = {
        id: buildStableMissionId("ENCAMINHAMENTO", "person", person.id),
        type: "ENCAMINHAMENTO",
        phase: phaseForMission("ENCAMINHAMENTO"),
        state: activeTask?.responsibleId ? "EM_ANDAMENTO" : deriveMissionState(person.responsibleId),
        title: missionTitle("ENCAMINHAMENTO", subjectLabel),
        subjectType: "person",
        subjectId: person.id,
        reason: "Há resposta positiva sem destino registrado no sistema.",
        signals: [
          {
            code: "positive_response",
            label: "Resposta positiva sem encaminhamento",
            detail: theme ? `Tema em jogo: ${theme}` : undefined,
            severity: "attention",
          },
        ],
        guardrail: noGuardrail(),
        nextStep: "Escolher o próximo caminho com consentimento explícito.",
        primaryAction: {
          id: "escolher_caminho",
          label: "Escolher caminho",
          kind: "route",
          cycleAction: "refer",
        },
        secondaryActions: [
          {
            id: "registrar_consentimento",
            label: "Registrar consentimento",
            kind: "record",
            cycleAction: "register_response",
          },
          {
            id: "revisar_ficha",
            label: "Revisar ficha",
            kind: "review",
            cycleAction: "review",
          },
        ],
        priority: resolveMissionPriority("ENCAMINHAMENTO", activeTask?.responsibleId ? "EM_ANDAMENTO" : deriveMissionState(person.responsibleId)),
        createdFrom: sourceRefs,
        explainabilityText: "",
      };
      mission.explainabilityText = explainMission(mission.title, mission.reason, mission.nextStep, mission.signals, mission.createdFrom);
      return mission;
    }
    case "RECENT_COMMENT": {
      const mission: RadarMission = {
        id: buildStableMissionId("ESCUTA", "person", person.id),
        type: "ESCUTA",
        phase: phaseForMission("ESCUTA"),
        state: deriveMissionState(person.responsibleId),
        title: missionTitle("ESCUTA", subjectLabel),
        subjectType: "person",
        subjectId: person.id,
        reason: "Comentário recente com tema claro pede preparação de resposta contextual.",
        signals: [
          {
            code: "thematic_comment",
            label: "Comentário recente com tema claro",
            detail: theme ? `Tema: ${theme}` : undefined,
            severity: "info",
          },
          ...baseSignals(theme, latestInteraction).slice(0, 1),
        ],
        guardrail: manualOnlyGuardrail(),
        nextStep: "Preparar resposta contextual antes de abrir conversa.",
        primaryAction: {
          id: "preparar_resposta_contextual",
          label: "Preparar resposta",
          kind: "review",
          cycleAction: "prepare_message",
        },
        secondaryActions: [
          {
            id: "ver_historico",
            label: "Ver histórico",
            kind: "review",
            cycleAction: "review",
          },
        ],
        priority: resolveMissionPriority("ESCUTA", deriveMissionState(person.responsibleId)),
        createdFrom: sourceRefs,
        explainabilityText: "",
      };
      mission.explainabilityText = explainMission(mission.title, mission.reason, mission.nextStep, mission.signals, mission.createdFrom);
      return mission;
    }
    case "RECURRING_INTERACTIONS": {
      const mission: RadarMission = {
        id: buildStableMissionId("VINCULO", "person", person.id),
        type: "VINCULO",
        phase: phaseForMission("VINCULO"),
        state: deriveMissionState(person.responsibleId),
        title: missionTitle("VINCULO", subjectLabel),
        subjectType: "person",
        subjectId: person.id,
        reason: "As interações recorrentes indicam espaço para abrir uma conversa cuidadosa, sem presumir intenção.",
        signals: [
          {
            code: "recurring_interactions",
            label: "Interações recorrentes detectadas",
            detail: `${person.totalInteractions} interações acumuladas`,
            severity: "info",
          },
        ],
        guardrail: manualOnlyGuardrail(),
        nextStep: "Abrir conversa cuidadosa sem presumir intenção política, ideológica ou de voluntariado.",
        primaryAction: {
          id: "abrir_conversa_cuidadosa",
          label: "Abrir conversa cuidadosa",
          kind: "manual_contact",
          cycleAction: "open_instagram",
        },
        secondaryActions: [
          {
            id: "revisar_sinais",
            label: "Revisar sinais",
            kind: "review",
            cycleAction: "review",
          },
        ],
        priority: resolveMissionPriority("VINCULO", deriveMissionState(person.responsibleId)),
        createdFrom: sourceRefs,
        explainabilityText: "",
      };
      mission.explainabilityText = explainMission(mission.title, mission.reason, mission.nextStep, mission.signals, mission.createdFrom);
      return mission;
    }
  }
}

export function buildMissionForPerson(input: MissionPersonInput, now = new Date()): RadarMission | null {
  const { person, interactions, tasks = [], referrals = [], auditLogs = [] } = input;
  const activeTask = getActiveTask(tasks);

  if (hasDoNotContact(person)) {
    return buildPersonMissionFromKind(input, "DO_NOT_CONTACT", now);
  }

  if (hasRecentContactSignal(person, interactions, auditLogs, now)) {
    return buildPersonMissionFromKind(input, "RECENT_CONTACT", now);
  }

  if (hasLongOpenCycle(person, activeTask, referrals, now)) {
    return buildPersonMissionFromKind(input, "LONG_WAIT", now);
  }

  if (hasPreparedDmWithoutConfirmation(auditLogs)) {
    return buildPersonMissionFromKind(input, "DM_PREPARED", now);
  }

  if (hasPositiveResponseWithoutDestination(person, interactions, referrals)) {
    return buildPersonMissionFromKind(input, "POSITIVE_RESPONSE", now);
  }

  if (hasRecentThematicComment(interactions, now)) {
    return buildPersonMissionFromKind(input, "RECENT_COMMENT", now);
  }

  if (hasRecurringInteractions(person, interactions, now)) {
    return buildPersonMissionFromKind(input, "RECURRING_INTERACTIONS", now);
  }

  return null;
}

export function buildMissionForField(input: MissionFieldInput, now = new Date()): RadarMission | null {
  const { event, result = null } = input;
  const eventTime = event.startsAt ? new Date(event.startsAt).getTime() : null;
  const isPastOrDone = event.status === "done" || (eventTime !== null && eventTime <= now.getTime());

  if (!isPastOrDone || result) return null;

  const createdFrom = [
    createSource("field_agenda_events", event.id),
  ];

  const mission: RadarMission = {
    id: buildStableMissionId("CAMPO", "field", event.id),
    type: "CAMPO",
    phase: phaseForMission("CAMPO"),
    state: "EM_ANDAMENTO",
    title: missionTitle("CAMPO", event.title),
    subjectType: "field",
    subjectId: event.id,
    reason: "A ação de campo já aconteceu, mas ainda não existe resultado registrado.",
    signals: [
      {
        code: "field_without_result",
        label: "Evento sem fechamento",
        detail: event.neighborhood ? `Bairro: ${event.neighborhood}` : undefined,
        severity: "attention",
        at: event.startsAt,
      },
    ],
    guardrail: noGuardrail(),
    nextStep: "Registrar resultado agregado e transformar aprendizados em memória operacional.",
    primaryAction: {
      id: "registrar_resultado",
      label: "Registrar resultado",
      kind: "record",
      cycleAction: "register_result",
    },
    secondaryActions: [
      {
        id: "criar_memoria",
        label: "Criar memória",
        kind: "record",
        cycleAction: "create_memory",
      },
    ],
    priority: resolveMissionPriority("CAMPO", "EM_ANDAMENTO"),
    createdFrom,
    explainabilityText: "",
  };
  mission.explainabilityText = explainMission(mission.title, mission.reason, mission.nextStep, mission.signals, mission.createdFrom);
  return mission;
}

export function buildMissionFeed(input: MissionEngineInput): RadarMission[] {
  const now = input.now ?? new Date();

  const personMissions = (input.people ?? [])
    .map((personInput) => buildMissionForPerson(personInput, now))
    .filter((mission): mission is RadarMission => mission !== null);

  const fieldMissions = (input.fieldEvents ?? [])
    .map((fieldInput) => buildMissionForField(fieldInput, now))
    .filter((mission): mission is RadarMission => mission !== null);

  return [...personMissions, ...fieldMissions].sort((a, b) => {
    const byPriority = compareMissionPriority(a.priority, b.priority);
    if (byPriority !== 0) return byPriority;
    return a.title.localeCompare(b.title, "pt-BR");
  });
}

export type { RadarMission } from "./mission-types";
