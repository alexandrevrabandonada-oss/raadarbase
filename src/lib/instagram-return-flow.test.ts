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
    const pending = createPendingInstagramSend("person-1", "template-1", openedAt);

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
        createPendingInstagramSend("person-2", null, openedAt),
        openedAt + 1_000,
      ),
    );

    expect(parsePendingInstagramSend(serialized, openedAt + 2_000)?.personId).toBe("person-2");
    expect(
      parsePendingInstagramSend(serialized, openedAt + INSTAGRAM_RETURN_MAX_AGE_MS + 1),
    ).toBeNull();
    expect(parsePendingInstagramSend('{"personId":42}', openedAt)).toBeNull();
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
