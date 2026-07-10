import { describe, expect, it } from "vitest";
import { profilesToCsv } from "./export";
import { MOCK_INFLUENCE_PROFILES } from "./mock-data";

describe("profilesToCsv", () => {
  it("neutraliza células que poderiam ser interpretadas como fórmula", () => {
    const profile = { ...MOCK_INFLUENCE_PROFILES[0], nome: "=HYPERLINK(\"https://example.com\")" };
    const csv = profilesToCsv([profile]);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).not.toContain('\",\"=HYPERLINK');
  });
});

