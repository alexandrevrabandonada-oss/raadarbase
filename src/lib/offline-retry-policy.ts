const RETRYABLE_ERROR_TOKENS = [
  "indispon",
  "timeout",
  "network",
  "fetch",
  "temporar",
  "lock",
  "supabase",
  "falha",
  "erro desconhecido",
];

export function shouldKeepOfflineTaskForRetry(error?: string | null) {
  if (!error) return true;
  const normalized = error.toLowerCase();
  return RETRYABLE_ERROR_TOKENS.some((token) => normalized.includes(token));
}
