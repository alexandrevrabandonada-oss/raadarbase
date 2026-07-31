import { describe, expect, it } from "vitest";
import {
  buildInstagramAndroidIntentUrl,
  buildInstagramProfileUrl,
  getInstagramLaunchTarget,
  normalizeInstagramUsername,
} from "./instagram-launch";

describe("Instagram launch", () => {
  it("normalizes handles before building a profile URL", () => {
    expect(normalizeInstagramUsername("  @@radar.base  ")).toBe("radar.base");
    expect(buildInstagramProfileUrl("@radar.base")).toBe(
      "https://www.instagram.com/radar.base/",
    );
  });

  it("uses an Android Intent with an encoded web fallback", () => {
    const fallback = "https://www.instagram.com/radar.base/";
    const intent = buildInstagramAndroidIntentUrl("@radar.base");

    expect(intent).toBe(
      "intent://www.instagram.com/radar.base/" +
        "#Intent;scheme=https;package=com.instagram.android;" +
        `S.browser_fallback_url=${encodeURIComponent(fallback)};end`,
    );
  });

  it("keeps the current Radar window on Android", () => {
    expect(
      getInstagramLaunchTarget(
        "radar.base",
        "Mozilla/5.0 (Linux; Android 15; SM-A556E) AppleWebKit/537.36 Chrome/138 Mobile Safari/537.36",
      ),
    ).toEqual({
      url: buildInstagramAndroidIntentUrl("radar.base"),
      opensExternalTab: false,
    });
  });

  it("uses a separate web tab outside Android", () => {
    expect(
      getInstagramLaunchTarget(
        "@radar.base",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X)",
      ),
    ).toEqual({
      url: "https://www.instagram.com/radar.base/",
      opensExternalTab: true,
    });
  });
});
