export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
export const E2E_BYPASS_AUTH_ACTIVE =
  process.env.E2E_BYPASS_AUTH === "true" &&
  process.env.NODE_ENV !== "production" &&
  (process.env.NODE_ENV === "test" ||
    (process.env.NODE_ENV === "development" &&
      process.env.E2E_TEST_MODE === "true" &&
      process.env.NEXT_PUBLIC_USE_MOCKS === "true"));
export const E2E_BYPASS_AUTH_MISCONFIGURED =
  process.env.E2E_BYPASS_AUTH === "true" && !E2E_BYPASS_AUTH_ACTIVE;

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getMockModeLabel() {
  return USE_MOCKS ? "ativo" : "inativo";
}

export function getEnvironmentLabel() {
  return process.env.NODE_ENV ?? "development";
}

export function shouldUseMockData() {
  return USE_MOCKS;
}

export function createSupabaseRuntimeError(context: string, error?: unknown) {
  const detail =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Erro desconhecido";
  const suffix = IS_PRODUCTION
    ? "Produção não deve usar fallback mock."
    : "Ative NEXT_PUBLIC_USE_MOCKS=true somente se quiser modo demonstração.";
  return new Error(`Falha ao acessar Supabase em ${context}. ${suffix} Detalhe: ${detail}`);
}
