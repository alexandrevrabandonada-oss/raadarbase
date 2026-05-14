import { JOURNEY_PHASES_ORDER, mapPersonToJourney, type JourneyPhase, type JourneyStatus } from "@/lib/data/journey-mapper";
import type {
  AuditLogEntry,
  InteractionType,
  InteractionWithPost,
  OutreachTaskWithPerson,
  PersonReferral,
  PriorityPerson,
} from "@/lib/types";
import { buildMissionFeed } from "./mission-engine";
import { compareMissionPriority } from "./mission-priority";
import type { MissionPersonInput, RadarMission } from "./mission-types";

type LegacyInteractionSummary = {
  personId: string;
  type: InteractionType;
  occurredAt: string;
  text: string;
  theme: string | null;
};

export interface PriorityPersonMissionAdapterInput {
  priorityPeople: PriorityPerson[];
  interactions: LegacyInteractionSummary[];
  tasks: OutreachTaskWithPerson[];
  referrals?: PersonReferral[];
  auditLogs?: AuditLogEntry[];
  now?: Date;
}

const missionTypeLabels: Record<RadarMission["type"], string> = {
  ESCUTA: "Escuta",
  VINCULO: "Vínculo",
  RETORNO: "Retorno",
  ENCAMINHAMENTO: "Encaminhamento",
  CUIDADO: "Cuidado",
  CAMPO: "Campo",
  MEMORIA: "Memória",
};

const missionPhaseLabels: Record<RadarMission["phase"], string> = {
  PREPARAR: "Preparar",
  CONVERSAR: "Conversar",
  REGISTRAR: "Registrar",
  ENCAMINHAR: "Encaminhar",
  CONCLUIR: "Concluir",
};

const missionStateLabels: Record<RadarMission["state"], string> = {
  SUGERIDA: "Sugerida",
  ASSUMIDA: "Assumida",
  EM_ANDAMENTO: "Em andamento",
  EM_ESPERA: "Em espera",
  BLOQUEADA: "Bloqueada",
  CONCLUIDA: "Concluída",
  ARQUIVADA: "Arquivada",
};

function toMissionInteraction(summary: LegacyInteractionSummary, index: number): InteractionWithPost {
  return {
    id: `legacy-interaction:${summary.personId}:${summary.occurredAt}:${summary.type}:${index}`,
    personId: summary.personId,
    postId: null,
    type: summary.type,
    occurredAt: summary.occurredAt,
    text: summary.text,
    theme: summary.theme,
    post: null,
  };
}

function getAuditLogPersonId(entry: AuditLogEntry): string | null {
  if (entry.entityId) {
    return entry.entityId;
  }

  const metadata = entry.metadata;
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const candidate = (metadata as Record<string, unknown>).personId ?? (metadata as Record<string, unknown>).person_id;
  return typeof candidate === "string" ? candidate : null;
}

function mapMissionPhaseToJourneyPhase(phase: RadarMission["phase"]): JourneyPhase {
  switch (phase) {
    case "PREPARAR":
      return "preparar";
    case "CONVERSAR":
      return "conversar";
    case "REGISTRAR":
      return "registrar";
    case "ENCAMINHAR":
      return "encaminhar";
    case "CONCLUIR":
      return "concluir";
  }
}

function buildMissionJourney(mission: RadarMission): JourneyStatus {
  const currentPhase = mapMissionPhaseToJourneyPhase(mission.phase);
  const currentIndex = JOURNEY_PHASES_ORDER.indexOf(currentPhase);
  const completedPhases = currentIndex > 0 ? JOURNEY_PHASES_ORDER.slice(0, currentIndex) : [];
  const isBlocked = mission.state === "BLOQUEADA";

  return {
    currentPhase,
    completedPhases,
    isBlocked,
    blockedReason: isBlocked ? mission.guardrail.message : undefined,
    nextStepLabel: mission.nextStep,
  };
}

function buildMissionMetadata(person: PriorityPerson, mission: RadarMission | null, fallbackUsed = false): PriorityPerson {
  if (!mission) {
    return {
      ...person,
      missionPlan: null,
      missionTypeLabel: null,
      missionPhaseLabel: null,
      missionStateLabel: null,
      missionReason: null,
      missionNextStep: null,
      missionGuardrailText: null,
      missionSignals: [],
      missionBlocksContact: false,
      missionExplainability: null,
      missionFallbackUsed: fallbackUsed,
    };
  }

  return {
    ...person,
    missionPlan: mission,
    missionTypeLabel: missionTypeLabels[mission.type],
    missionPhaseLabel: missionPhaseLabels[mission.phase],
    missionStateLabel: missionStateLabels[mission.state],
    missionReason: mission.reason,
    missionNextStep: mission.nextStep,
    missionGuardrailText: mission.guardrail.message,
    missionSignals: mission.signals.map((signal) => signal.label),
    missionBlocksContact: mission.guardrail.blocksContact,
    missionExplainability: mission.explainabilityText,
    missionFallbackUsed: fallbackUsed,
  };
}

export function getPriorityPersonMission(person: PriorityPerson): RadarMission | null {
  return person.missionPlan ?? null;
}

export function getPriorityPersonMissionTypeLabel(person: PriorityPerson): string | null {
  return person.missionTypeLabel ?? (person.missionPlan ? missionTypeLabels[person.missionPlan.type] : null);
}

export function getPriorityPersonMissionPhaseLabel(person: PriorityPerson): string {
  if (person.missionPhaseLabel) return person.missionPhaseLabel;
  if (person.missionPlan) return missionPhaseLabels[person.missionPlan.phase];

  const journey = mapPersonToJourney(
    person.status,
    person.hasPendingTask,
    person.hasReferral,
    person.lastInteractionAt,
  );
  const labels = {
    preparar: "Preparar",
    conversar: "Conversar",
    registrar: "Registrar",
    encaminhar: "Encaminhar",
    concluir: "Concluir",
  } as const;

  return journey.isBlocked ? "Em espera" : labels[journey.currentPhase];
}

export function getPriorityPersonMissionReason(person: PriorityPerson): string {
  return person.missionReason ?? person.priorityReason;
}

export function getPriorityPersonMissionNextStep(person: PriorityPerson): string {
  return person.missionNextStep ?? person.nextAction;
}

export function getPriorityPersonHoldState(person: PriorityPerson): "blocked" | "waiting" | "free" {
  const mission = getPriorityPersonMission(person);
  if (mission?.state === "BLOQUEADA" || person.missionBlocksContact) {
    return "blocked";
  }
  if (mission?.state === "EM_ESPERA") {
    return "waiting";
  }
  if (person.status === "nao_abordar" || person.doNotContactReason || person.riskFlags?.doNotContact) {
    return "blocked";
  }
  if (person.riskFlags?.recentOutreach || person.isPendingResponse) {
    return "waiting";
  }
  return "free";
}

export function getPriorityPersonHoldText(person: PriorityPerson): string {
  const mission = getPriorityPersonMission(person);
  const holdState = getPriorityPersonHoldState(person);

  if (mission && holdState === "blocked") {
    return mission.guardrail.message;
  }
  if (mission && holdState === "waiting") {
    return mission.nextStep || mission.guardrail.message;
  }
  if (mission && holdState === "free") {
    return "Caminho livre. Sem bloqueio ativo agora.";
  }
  if (holdState === "blocked") {
    return person.doNotContactReason || "Missão bloqueada por cuidado ético.";
  }
  if (person.riskFlags?.recentOutreach) {
    return "Contato recente. Aguarde a janela ética antes de insistir.";
  }
  if (person.isPendingResponse) {
    return "Conversa aberta. Registrar retorno quando houver resposta.";
  }
  return "Caminho livre. Sem bloqueio ativo agora.";
}

export function getPriorityPersonJourney(person: PriorityPerson): JourneyStatus {
  const mission = getPriorityPersonMission(person);
  if (!mission) {
    return mapPersonToJourney(
      person.status,
      person.hasPendingTask,
      person.hasReferral,
      person.lastInteractionAt,
    );
  }

  return buildMissionJourney(mission);
}

export function attachMissionMetadataToPriorityPeople({
  priorityPeople,
  interactions,
  tasks,
  referrals = [],
  auditLogs = [],
  now = new Date(),
}: PriorityPersonMissionAdapterInput): PriorityPerson[] {
  if (priorityPeople.length === 0) return priorityPeople;

  try {
    const interactionsByPerson = new Map<string, InteractionWithPost[]>();
    for (const interaction of interactions) {
      const current = interactionsByPerson.get(interaction.personId) ?? [];
      current.push(toMissionInteraction(interaction, current.length));
      interactionsByPerson.set(interaction.personId, current);
    }

    const tasksByPerson = new Map<string, OutreachTaskWithPerson[]>();
    for (const task of tasks) {
      const current = tasksByPerson.get(task.personId) ?? [];
      current.push(task);
      tasksByPerson.set(task.personId, current);
    }

    const referralsByPerson = new Map<string, PersonReferral[]>();
    for (const referral of referrals) {
      const current = referralsByPerson.get(referral.personId) ?? [];
      current.push(referral);
      referralsByPerson.set(referral.personId, current);
    }

    const auditsByPerson = new Map<string, AuditLogEntry[]>();
    for (const auditLog of auditLogs) {
      const personId = getAuditLogPersonId(auditLog);
      if (!personId) continue;
      const current = auditsByPerson.get(personId) ?? [];
      current.push(auditLog);
      auditsByPerson.set(personId, current);
    }

    const missionInputs: MissionPersonInput[] = priorityPeople.map((person) => ({
      person,
      interactions: interactionsByPerson.get(person.id) ?? [],
      tasks: tasksByPerson.get(person.id) ?? [],
      referrals: referralsByPerson.get(person.id) ?? [],
      auditLogs: auditsByPerson.get(person.id) ?? [],
    }));

    const missions = buildMissionFeed({
      now,
      people: missionInputs,
    }).filter((mission) => mission.subjectType === "person" && Boolean(mission.subjectId));

    const missionsByPersonId = new Map(
      missions.map((mission) => [mission.subjectId!, mission] as const),
    );

    return priorityPeople.map((person) => buildMissionMetadata(person, missionsByPersonId.get(person.id) ?? null));
  } catch {
    return priorityPeople.map((person) => buildMissionMetadata(person, null, true));
  }
}

export function sortPriorityPeopleByMission(people: PriorityPerson[]): PriorityPerson[] {
  return [...people].sort((left, right) => {
    if (left.missionPlan && right.missionPlan) {
      const byMission = compareMissionPriority(left.missionPlan.priority, right.missionPlan.priority);
      if (byMission !== 0) return byMission;
    } else if (left.missionPlan || right.missionPlan) {
      return left.missionPlan ? -1 : 1;
    }

    if (right.priorityScore !== left.priorityScore) {
      return right.priorityScore - left.priorityScore;
    }

    return new Date(right.lastInteractionAt ?? 0).getTime() - new Date(left.lastInteractionAt ?? 0).getTime();
  });
}
