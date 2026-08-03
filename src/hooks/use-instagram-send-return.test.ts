/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from "vitest";
import {
  loadInstagramSendPending,
  persistInstagramSendPending,
  getInstagramConfirmationCustodyIds,
  INSTAGRAM_CONFIRMATION_CUSTODY_STORAGE_KEY,
} from "./use-instagram-send-return";
import {
  INSTAGRAM_RETURN_LEGACY_STORAGE_KEYS,
  INSTAGRAM_RETURN_MAX_AGE_MS,
  INSTAGRAM_RETURN_STORAGE_KEY,
  createPendingInstagramSend,
  markPendingInstagramSendAsAway,
} from "@/lib/instagram-return-flow";

describe("instagram send return storage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    persistInstagramSendPending(null);
  });

  it("restores the newest v2 pending send after a reload", () => {
    const older = markPendingInstagramSendAsAway(
      createPendingInstagramSend("person-session", null, "minha_fila", 10_000),
      10_100,
    );
    const newer = markPendingInstagramSendAsAway(
      createPendingInstagramSend("person-local", "template-1", "lista_operacional", 11_000),
      11_100,
    );
    window.sessionStorage.setItem(INSTAGRAM_RETURN_STORAGE_KEY, JSON.stringify(older));
    window.localStorage.setItem(INSTAGRAM_RETURN_STORAGE_KEY, JSON.stringify(newer));

    const restored = loadInstagramSendPending(12_000);

    expect(restored?.personId).toBe("person-local");
    expect(window.sessionStorage.getItem(INSTAGRAM_RETURN_STORAGE_KEY)).toBe(JSON.stringify(newer));
  });

  it("migrates valid v1 keys and removes the legacy record", () => {
    const legacy = {
      personId: "person-quick-sheet",
      templateId: null,
      openedAt: 20_000,
      leftPortalAt: null,
    };
    window.sessionStorage.setItem(
      INSTAGRAM_RETURN_LEGACY_STORAGE_KEYS.ficha_rapida,
      JSON.stringify(legacy),
    );

    const restored = loadInstagramSendPending(21_000);

    expect(restored).toMatchObject({
      version: 2,
      surface: "ficha_rapida",
      personId: "person-quick-sheet",
      leftPortalAt: 20_000,
    });
    expect(window.sessionStorage.getItem(INSTAGRAM_RETURN_LEGACY_STORAGE_KEYS.ficha_rapida)).toBeNull();
    expect(window.localStorage.getItem(INSTAGRAM_RETURN_STORAGE_KEY)).not.toBeNull();
  });

  it("expires stale pending sends in both stores", () => {
    const pending = createPendingInstagramSend("person-expired", null, "perfil_pessoa", 30_000);
    window.sessionStorage.setItem(INSTAGRAM_RETURN_STORAGE_KEY, JSON.stringify(pending));
    window.localStorage.setItem(INSTAGRAM_RETURN_STORAGE_KEY, JSON.stringify(pending));

    expect(loadInstagramSendPending(30_000 + INSTAGRAM_RETURN_MAX_AGE_MS + 1)).toBeNull();
    expect(window.sessionStorage.getItem(INSTAGRAM_RETURN_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(INSTAGRAM_RETURN_STORAGE_KEY)).toBeNull();
  });

  it("keeps recent custody receipts and expires old ones", () => {
    const now = 100_000_000;
    window.localStorage.setItem(INSTAGRAM_CONFIRMATION_CUSTODY_STORAGE_KEY, JSON.stringify([
      { personId: "person-recent", acceptedAt: now - 1_000 },
      { personId: "person-expired", acceptedAt: now - 25 * 60 * 60 * 1_000 },
    ]));

    expect([...getInstagramConfirmationCustodyIds(now)]).toEqual(["person-recent"]);
    expect(window.sessionStorage.getItem(INSTAGRAM_CONFIRMATION_CUSTODY_STORAGE_KEY)).toContain("person-recent");
    expect(window.localStorage.getItem(INSTAGRAM_CONFIRMATION_CUSTODY_STORAGE_KEY)).not.toContain("person-expired");
  });
});
