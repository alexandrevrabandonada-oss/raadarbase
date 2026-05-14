import type { AuditLogEntry, InteractionWithPost, OutreachTask, PersonReferral, PriorityPerson } from "@/lib/types";
import { buildMissionFeed } from "./mission-engine";
import type { MissionPersonInput, RadarMission } from "./mission-types";

export type MinhaJornadaWorkMode =
  | "recommended"
  | "returns"
  | "listening"
  | "routing"
  | "care";

export interface QueueMissionSource {
  person: PriorityPerson;
  interactions: InteractionWithPost[];
  tasks?: OutreachTask[];
  referrals?: PersonReferral[];
  auditLogs?: AuditLogEntry[];
}

export interface QueueMissionPlan {
  missions: RadarMission[];
  orderedPersonIds: string[];
}

export function adaptQueueMissionSource(source: QueueMissionSource): MissionPersonInput {
  return {
    person: source.person,
    interactions: source.interactions,
    tasks: source.tasks ?? [],
    referrals: source.referrals ?? [],
    auditLogs: source.auditLogs ?? [],
  };
}

export function buildQueueMissionPlan(sources: QueueMissionSource[], now = new Date()): QueueMissionPlan {
  const missions = buildMissionFeed({
    now,
    people: sources.map(adaptQueueMissionSource),
  }).filter((mission) => mission.subjectType === "person" && Boolean(mission.subjectId));

  return {
    missions,
    orderedPersonIds: missions.map((mission) => mission.subjectId!).filter(Boolean),
  };
}

export function orderQueueByMissionPlan(queue: PriorityPerson[], plan: QueueMissionPlan | null | undefined): PriorityPerson[] {
  if (!plan || plan.orderedPersonIds.length === 0) return queue;

  const queueById = new Map(queue.map((person) => [person.id, person]));
  const ordered = plan.orderedPersonIds
    .map((id) => queueById.get(id))
    .filter((person): person is PriorityPerson => Boolean(person));

  const seen = new Set(ordered.map((person) => person.id));
  const remainder = queue.filter((person) => !seen.has(person.id));

  return [...ordered, ...remainder];
}

function takeFirst(missions: RadarMission[], predicate: (mission: RadarMission) => boolean, seen: Set<string>): RadarMission | null {
  const found = missions.find((mission) => !seen.has(mission.id) && predicate(mission)) ?? null;
  if (found) seen.add(found.id);
  return found;
}

function takeMany(
  missions: RadarMission[],
  predicate: (mission: RadarMission) => boolean,
  seen: Set<string>,
  count: number,
): RadarMission[] {
  const selected: RadarMission[] = [];
  for (const mission of missions) {
    if (selected.length >= count) break;
    if (seen.has(mission.id) || !predicate(mission)) continue;
    seen.add(mission.id);
    selected.push(mission);
  }
  return selected;
}

export function buildRecommendedMissionBlock(
  missions: RadarMission[],
  mode: MinhaJornadaWorkMode = "recommended",
): RadarMission[] {
  if (mode === "returns") {
    return missions.filter((mission) => mission.type === "RETORNO" || mission.type === "CUIDADO").slice(0, 5);
  }

  if (mode === "listening") {
    return missions.filter((mission) => mission.type === "ESCUTA" || mission.type === "VINCULO").slice(0, 5);
  }

  if (mode === "routing") {
    return missions.filter((mission) => mission.type === "ENCAMINHAMENTO").slice(0, 5);
  }

  if (mode === "care") {
    return missions
      .filter((mission) => mission.type === "CUIDADO" || mission.state === "EM_ESPERA" || mission.state === "BLOQUEADA")
      .slice(0, 5);
  }

  const seen = new Set<string>();
  const block: RadarMission[] = [];

  const urgent = takeFirst(missions, (mission) => mission.type === "CUIDADO" || mission.type === "RETORNO", seen);
  if (urgent) block.push(urgent);

  const routing = takeFirst(missions, (mission) => mission.type === "ENCAMINHAMENTO", seen);
  if (routing) block.push(routing);

  block.push(
    ...takeMany(missions, (mission) => mission.type === "ESCUTA" || mission.type === "VINCULO", seen, 2),
  );

  const lightReview = takeFirst(
    missions,
    (mission) =>
      mission.type === "VINCULO" ||
      mission.type === "ESCUTA" ||
      mission.type === "RETORNO" ||
      mission.type === "CUIDADO",
    seen,
  );

  if (lightReview) block.push(lightReview);

  if (block.length < 5) {
    block.push(...takeMany(missions, () => true, seen, 5 - block.length));
  }

  return block.slice(0, 5);
}
