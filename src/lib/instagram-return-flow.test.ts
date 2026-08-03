import { describe, expect, it } from "vitest";
import {
  INSTAGRAM_RETURN_MAX_AGE_MS,
  INSTAGRAM_RETURN_MIN_AWAY_MS,
  INSTAGRAM_RETURN_RESUME_GAP_MS,
  createPendingInstagramSend,
  getInstagramPortalLifecycleSignal,
  markPendingInstagramSendAsAway,
  parsePendingInstagramSend,
  shouldConfirmPendingInstagramSend,
} from "./instagram-return-flow";

describe("instagram return flow", () => {
  it("only confirms after the operator left and returned", () => {
    const openedAt = 1_000;
    const pending = createPendingInstagramSend("person-1", "template-1", "minha_fila", openedAt);

    expect(shouldConfirmPendingInstagramSend(pending, openedAt + 5_000)).toBe(false);

    const away = markPendingInstagramSendAsAway(pending, openedAt + 100);
    expect(
      shouldConfirmPendingInstagramSend(
        away,
        openedAt + 100 + INSTAGRAM_RETURN_MIN_AWAY_MS - 1,
      ),
    ).toBe(false);
    expect(
      shouldConfirmPendingInstagramSend(
        away,
        openedAt + 100 + INSTAGRAM_RETURN_MIN_AWAY_MS,
      ),
    ).toBe(true);
  });

  it("rejects expired and malformed pending sends", () => {
    const openedAt = 10_000;
    const serialized = JSON.stringify(
      markPendingInstagramSendAsAway(
        createPendingInstagramSend("person-2", null, "lista_operacional", openedAt),
        openedAt + 1_000,
      ),
    );

    expect(parsePendingInstagramSend(serialized, openedAt + 2_000)?.personId).toBe("person-2");
    expect(parsePendingInstagramSend(serialized, openedAt + 2_000)?.surface).toBe("lista_operacional");
    expect(
      parsePendingInstagramSend(serialized, openedAt + INSTAGRAM_RETURN_MAX_AGE_MS + 1),
    ).toBeNull();
    expect(parsePendingInstagramSend('{"personId":42}', openedAt)).toBeNull();
  });

  it("migrates a valid v1 value to the surface associated with its old key", () => {
    const openedAt = 20_000;
    const legacy = JSON.stringify({
      personId: "person-legacy",
      templateId: "template-legacy",
      openedAt,
      leftPortalAt: openedAt + 100,
    });

    expect(parsePendingInstagramSend(legacy, openedAt + 1_000, "ficha_rapida")).toEqual({
      version: 2,
      surface: "ficha_rapida",
      personId: "person-legacy",
      templateId: "template-legacy",
      openedAt,
      leftPortalAt: openedAt + 100,
    });
  });

  it("detects a return even when Android skips focus and pageshow", () => {
    expect(getInstagramPortalLifecycleSignal({
      visibilityState: "hidden",
      hasFocus: false,
      observedInactive: false,
      elapsedSinceLastCheck: 500,
    })).toBe("away");

    expect(getInstagramPortalLifecycleSignal({
      visibilityState: "visible",
      hasFocus: true,
      observedInactive: true,
      elapsedSinceLastCheck: 500,
    })).toBe("returned");

    expect(getInstagramPortalLifecycleSignal({
      visibilityState: "visible",
      hasFocus: true,
      observedInactive: false,
      elapsedSinceLastCheck: INSTAGRAM_RETURN_RESUME_GAP_MS,
    })).toBe("returned");

    expect(getInstagramPortalLifecycleSignal({
      visibilityState: "visible",
      hasFocus: true,
      observedInactive: false,
      elapsedSinceLastCheck: 500,
    })).toBe("waiting");
  });
});
