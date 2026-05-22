import type { CorrectionKind } from "@/app/treinamento/mini-game/game-data";

export const MINI_GAME_RESULT_KEY = "radar_training_mini_game_result_v1";

export interface MiniGameTrainingResult {
  cleanMissions: number;
  completedAt: string;
  masteredKinds: CorrectionKind[];
  reviewKinds: CorrectionKind[];
  totalCorrections: number;
  version: 1;
}

export const MINI_GAME_COMPETENCY_KINDS: CorrectionKind[] = [
  "personalization",
  "automation",
  "response",
  "privacy",
  "routing",
];

export function readMiniGameTrainingResult() {
  if (typeof window === "undefined") return null;

  try {
    const result = JSON.parse(localStorage.getItem(MINI_GAME_RESULT_KEY) || "null") as Partial<MiniGameTrainingResult> | null;

    if (
      !result
      || result.version !== 1
      || !result.completedAt
      || !Array.isArray(result.reviewKinds)
      || !Array.isArray(result.masteredKinds)
      || typeof result.totalCorrections !== "number"
      || typeof result.cleanMissions !== "number"
    ) {
      return null;
    }

    return result as MiniGameTrainingResult;
  } catch {
    return null;
  }
}

export function writeMiniGameTrainingResult(result: MiniGameTrainingResult) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MINI_GAME_RESULT_KEY, JSON.stringify(result));
}
