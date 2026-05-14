import type { MissionCreatedFrom, MissionPhase, MissionState, MissionSubjectType, MissionType } from "./mission-types";

export function buildStableMissionId(type: MissionType, subjectType: MissionSubjectType, subjectId?: string): string {
  const target = subjectId ?? "global";
  return `mission:${type}:${subjectType}:${target}`;
}

export function deriveMissionState(responsibleId?: string | null): MissionState {
  return responsibleId ? "ASSUMIDA" : "SUGERIDA";
}

export function createSource(source: MissionCreatedFrom["source"], id?: string | null, note?: string): MissionCreatedFrom {
  return {
    source,
    id: id ?? null,
    note,
  };
}

export function phaseForMission(type: MissionType): MissionPhase {
  switch (type) {
    case "CUIDADO":
      return "CONCLUIR";
    case "RETORNO":
      return "REGISTRAR";
    case "ENCAMINHAMENTO":
      return "ENCAMINHAR";
    case "ESCUTA":
    case "VINCULO":
      return "PREPARAR";
    case "CAMPO":
    case "MEMORIA":
      return "REGISTRAR";
  }
}
