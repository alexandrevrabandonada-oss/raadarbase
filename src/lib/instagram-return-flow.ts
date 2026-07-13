export const INSTAGRAM_RETURN_STORAGE_KEY = "radar_pending_instagram_send:v1";

// A troca real de aplicativo já é confirmada por visibilitychange/pagehide.
// Uma janela curta evita travar a próxima pessoa ao voltar ao portal.
export const INSTAGRAM_RETURN_MIN_AWAY_MS = 250;
export const INSTAGRAM_RETURN_MAX_AGE_MS = 30 * 60 * 1000;

export interface PendingInstagramSend {
  personId: string;
  templateId: string | null;
  openedAt: number;
  leftPortalAt: number | null;
}

export function createPendingInstagramSend(
  personId: string,
  templateId: string | null,
  now = Date.now(),
): PendingInstagramSend {
  return {
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
): PendingInstagramSend | null {
  if (!rawValue) return null;

  try {
    const value = JSON.parse(rawValue) as Partial<PendingInstagramSend>;
    if (
      typeof value.personId !== "string" ||
      value.personId.length === 0 ||
      typeof value.openedAt !== "number" ||
      (value.templateId !== undefined && value.templateId !== null && typeof value.templateId !== "string") ||
      (value.leftPortalAt !== undefined && value.leftPortalAt !== null && typeof value.leftPortalAt !== "number")
    ) {
      return null;
    }

    if (now - value.openedAt > INSTAGRAM_RETURN_MAX_AGE_MS) {
      return null;
    }

    return {
      personId: value.personId,
      templateId: value.templateId ?? null,
      openedAt: value.openedAt,
      leftPortalAt: value.leftPortalAt ?? null,
    };
  } catch {
    return null;
  }
}
