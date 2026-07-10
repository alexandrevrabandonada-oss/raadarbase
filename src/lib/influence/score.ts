export type InfluenceScoreConfig = {
  logFollowers: number;
  verified: number;
  business: number;
  creator: number;
  location: number;
  interaction: number;
};

export type InfluenceScoreInput = {
  seguidores: number;
  contaVerificada: boolean;
  empresa: boolean;
  criador: boolean;
  locationConfidence: number;
  interactionScore?: number;
};

export const DEFAULT_INFLUENCE_SCORE_CONFIG: InfluenceScoreConfig = {
  logFollowers: 10,
  verified: 12,
  business: 4,
  creator: 5,
  location: 3,
  interaction: 0,
};

function finiteNonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function calculateInfluenceScore(
  input: InfluenceScoreInput,
  config: InfluenceScoreConfig = DEFAULT_INFLUENCE_SCORE_CONFIG,
) {
  const followers = finiteNonNegative(input.seguidores);
  const locationConfidence = Math.min(1, finiteNonNegative(input.locationConfidence));
  const interactionScore = Math.min(1, finiteNonNegative(input.interactionScore ?? 0));
  const components = {
    followers: Math.log10(Math.max(1, followers)) * config.logFollowers,
    verified: input.contaVerificada ? config.verified : 0,
    business: input.empresa ? config.business : 0,
    creator: input.criador ? config.creator : 0,
    location: locationConfidence * config.location,
    interaction: interactionScore * config.interaction,
  };

  const score = Object.values(components).reduce((total, value) => total + value, 0);
  return {
    score: Number(score.toFixed(4)),
    components: Object.fromEntries(
      Object.entries(components).map(([key, value]) => [key, Number(value.toFixed(4))]),
    ),
  };
}

export function parseInfluenceScoreConfig(value: unknown): InfluenceScoreConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_INFLUENCE_SCORE_CONFIG;
  const candidate = value as Partial<Record<keyof InfluenceScoreConfig, unknown>>;
  return Object.fromEntries(
    Object.entries(DEFAULT_INFLUENCE_SCORE_CONFIG).map(([key, fallback]) => {
      const configured = candidate[key as keyof InfluenceScoreConfig];
      return [key, typeof configured === "number" && Number.isFinite(configured) ? configured : fallback];
    }),
  ) as InfluenceScoreConfig;
}

