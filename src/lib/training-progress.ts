export const TRAINING_PROGRESS_KEY = "radar_training_progress_v1";

export interface TrainingProgress {
  completedPhases: string[];
  ethicalChecks: string[];
  finished: boolean;
  officialChecklist: string[];
  version: 1;
}

export function readTrainingProgress() {
  if (typeof window === "undefined") return null;

  try {
    const progress = JSON.parse(localStorage.getItem(TRAINING_PROGRESS_KEY) || "null") as Partial<TrainingProgress> | null;

    if (
      !progress
      || progress.version !== 1
      || !Array.isArray(progress.completedPhases)
      || !Array.isArray(progress.ethicalChecks)
      || !Array.isArray(progress.officialChecklist)
      || typeof progress.finished !== "boolean"
    ) {
      return null;
    }

    return progress as TrainingProgress;
  } catch {
    return null;
  }
}

export function writeTrainingProgress(progress: TrainingProgress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRAINING_PROGRESS_KEY, JSON.stringify(progress));
}
