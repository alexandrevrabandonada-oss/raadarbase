import { IS_PRODUCTION, createSupabaseRuntimeError } from "@/lib/config";

export function handleSupabaseReadError(context: string, error: unknown): never {
  throw createSupabaseRuntimeError(context, error);
}

export function getDueLabel(date: string | null) {
  if (!date) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(date));
}

export function canSilentlyFallbackToMock() {
  return !IS_PRODUCTION;
}
