export const INSTAGRAM_RETURN_STORAGE_KEY = "radar_pending_instagram_send:v2";

export const INSTAGRAM_RETURN_LEGACY_STORAGE_KEYS = {
  minha_fila: "radar_pending_instagram_send:v1",
  lista_operacional: "radar_pending_operational_list_instagram_send:v1",
  ficha_rapida: "radar_pending_quick_sheet_instagram_send:v1",
} as const;

// A troca real de aplicativo já é confirmada por visibilitychange/pagehide.
// Uma janela curta evita confirmar um clique que não chegou a sair do portal.
export const INSTAGRAM_RETURN_MIN_AWAY_MS = 250;
export const INSTAGRAM_RETURN_MAX_AGE_MS = 30 * 60 * 1000;
export const INSTAGRAM_RETURN_POLL_MS = 500;
export const INSTAGRAM_RETURN_RESUME_GAP_MS = 2_000;

export type InstagramSendSurface =
  | "minha_fila"
  | "lista_operacional"
  | "ficha_rapida"
  | "perfil_pessoa";

const INSTAGRAM_SEND_SURFACES = new Set<InstagramSendSurface>([
  "minha_fila",
  "lista_operacional",
  "ficha_rapida",
  "perfil_pessoa",
]);

type InstagramPortalLifecycleInput = {
  visibilityState: DocumentVisibilityState;
  hasFocus: boolean;
  observedInactive: boolean;
  elapsedSinceLastCheck: number;
};

export type InstagramPortalLifecycleSignal = "away" | "returned" | "waiting";

export function getInstagramPortalLifecycleSignal({
  visibilityState,
  hasFocus,
  observedInactive,
  elapsedSinceLastCheck,
}: InstagramPortalLifecycleInput): InstagramPortalLifecycleSignal {
  if (visibilityState === "hidden" || !hasFocus) return "away";
  if (observedInactive || elapsedSinceLastCheck >= INSTAGRAM_RETURN_RESUME_GAP_MS) {
    return "returned";
  }
  return "waiting";
}

export interface PendingInstagramSend {
  version: 2;
  surface: InstagramSendSurface;
  personId: string;
  templateId: string | null;
  openedAt: number;
  leftPortalAt: number | null;
}

export function createPendingInstagramSend(
  personId: string,
  templateId: string | null,
  surface: InstagramSendSurface = "minha_fila",
  now = Date.now(),
): PendingInstagramSend {
  return {
    version: 2,
    surface,
    personId,
    templateId,
    openedAt: now,
    leftPortalAt: null,
  };
}

export function markPendingInstagramSendAsAway(
  pending: PendingInstagramSend,
  now = Date.now(),
): PendingInstagramSend {
  if (pending.leftPortalAt !== null) return pending;
  return { ...pending, leftPortalAt: now };
}

export function shouldConfirmPendingInstagramSend(
  pending: PendingInstagramSend,
  now = Date.now(),
) {
  if (pending.leftPortalAt === null) return false;

  const age = now - pending.openedAt;
  const timeAway = now - pending.leftPortalAt;
  return (
    age >= 0 &&
    age <= INSTAGRAM_RETURN_MAX_AGE_MS &&
    timeAway >= INSTAGRAM_RETURN_MIN_AWAY_MS
  );
}

export function parsePendingInstagramSend(
  rawValue: string | null,
  now = Date.now(),
  legacySurface: InstagramSendSurface = "minha_fila",
): PendingInstagramSend | null {
  if (!rawValue) return null;

  try {
    const value = JSON.parse(rawValue) as Partial<PendingInstagramSend> & { version?: number };
    const isV2 = value.version === 2;
    const surface = isV2 ? value.surface : legacySurface;
    if (
      typeof value.personId !== "string" ||
      value.personId.length === 0 ||
      typeof value.openedAt !== "number" ||
      !surface ||
      !INSTAGRAM_SEND_SURFACES.has(surface) ||
      (value.templateId !== undefined && value.templateId !== null && typeof value.templateId !== "string") ||
      (value.leftPortalAt !== undefined && value.leftPortalAt !== null && typeof value.leftPortalAt !== "number")
    ) {
      return null;
    }

    const age = now - value.openedAt;
    if (age < 0 || age > INSTAGRAM_RETURN_MAX_AGE_MS) return null;

    return {
      version: 2,
      surface,
      personId: value.personId,
      templateId: value.templateId ?? null,
      openedAt: value.openedAt,
      // Nos fluxos v1, a chave só era criada imediatamente antes de abrir o
      // Instagram. Se a aba recarregou antes de observar pagehide, a própria
      // restauração comprova que o ciclo precisa ser retomado.
      leftPortalAt: value.leftPortalAt ?? (isV2 ? null : value.openedAt),
    };
  } catch {
    return null;
  }
}

export function getInstagramSendOrigins(surface: InstagramSendSurface) {
  switch (surface) {
    case "minha_fila":
      return { prepared: "minha_fila", confirmed: "minha_fila_retorno_instagram" };
    case "lista_operacional":
      return { prepared: "lista_operacional", confirmed: "lista_operacional_retorno_instagram" };
    case "ficha_rapida":
      return { prepared: "quick_sheet_return", confirmed: "ficha_rapida" };
    case "perfil_pessoa":
      return { prepared: "perfil_pessoa", confirmed: "perfil_pessoa" };
  }
}
