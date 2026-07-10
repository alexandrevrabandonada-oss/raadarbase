import { beforeEach, describe, expect, it } from "vitest";
import { checkInfluenceRateLimit, resetInfluenceRateLimitsForTests } from "./rate-limit";

describe("influence rate limit", () => {
  beforeEach(resetInfluenceRateLimitsForTests);
  it("bloqueia acima do limite e libera após a janela", () => {
    expect(checkInfluenceRateLimit("user", 2, 1000, 0).allowed).toBe(true);
    expect(checkInfluenceRateLimit("user", 2, 1000, 1).allowed).toBe(true);
    expect(checkInfluenceRateLimit("user", 2, 1000, 2).allowed).toBe(false);
    expect(checkInfluenceRateLimit("user", 2, 1000, 1001).allowed).toBe(true);
  });
});

