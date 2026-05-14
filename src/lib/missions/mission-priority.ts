import type { MissionPriority, MissionState, MissionType } from "./mission-types";

const PRIORITY_BASE: Record<MissionType, { tier: 1 | 2 | 3 | 4 | 5 | 6; baseScore: number; label: string }> = {
  CUIDADO: { tier: 1, baseScore: 1000, label: "Cuidado urgente" },
  RETORNO: { tier: 2, baseScore: 850, label: "Ciclo aberto" },
  ENCAMINHAMENTO: { tier: 3, baseScore: 740, label: "Encaminhamento pendente" },
  ESCUTA: { tier: 4, baseScore: 620, label: "Sinal recente" },
  VINCULO: { tier: 5, baseScore: 520, label: "Vínculo recorrente" },
  CAMPO: { tier: 6, baseScore: 420, label: "Campo ou território" },
  MEMORIA: { tier: 6, baseScore: 380, label: "Campo ou território" },
};

export function resolveMissionPriority(type: MissionType, state: MissionState): MissionPriority {
  const config = PRIORITY_BASE[type];
  let score = config.baseScore;

  if (state === "BLOQUEADA") score += 80;
  if (state === "EM_ESPERA") score += 40;
  if (state === "CONCLUIDA" || state === "ARQUIVADA") score -= 200;

  return {
    score,
    tier: config.tier,
    label: config.label,
  };
}

export function compareMissionPriority(a: MissionPriority, b: MissionPriority): number {
  return b.score - a.score;
}
