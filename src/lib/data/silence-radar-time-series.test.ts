import { describe, it, expect } from "vitest";
import { classifyTimeSeriesTrend } from "./silence-radar-time-series";

describe("silence-radar-time-series", () => {
  it("classifies empty data as sem_dados_suficientes", () => {
    expect(classifyTimeSeriesTrend([])).toBe("sem_dados_suficientes");
  });

  it("classifies single point as sem_dados_suficientes", () => {
    expect(classifyTimeSeriesTrend([{ date: "2026-05-01", reportCount: 1, formCount: 0, interactionCount: 0 }])).toBe("sem_dados_suficientes");
  });

  it("classifies rising trend", () => {
    const points = [
      { date: "2026-05-01", reportCount: 0, formCount: 0, interactionCount: 0 },
      { date: "2026-05-02", reportCount: 0, formCount: 0, interactionCount: 0 },
      { date: "2026-05-03", reportCount: 5, formCount: 2, interactionCount: 0 },
      { date: "2026-05-04", reportCount: 10, formCount: 2, interactionCount: 0 },
    ];
    expect(classifyTimeSeriesTrend(points)).toBe("subindo");
  });

  it("classifies falling trend", () => {
    const points = [
      { date: "2026-05-01", reportCount: 10, formCount: 0, interactionCount: 0 },
      { date: "2026-05-02", reportCount: 5, formCount: 0, interactionCount: 0 },
      { date: "2026-05-03", reportCount: 0, formCount: 0, interactionCount: 0 },
      { date: "2026-05-04", reportCount: 0, formCount: 0, interactionCount: 0 },
    ];
    expect(classifyTimeSeriesTrend(points)).toBe("caindo");
  });

  it("classifies stable trend", () => {
    const points = [
      { date: "2026-05-01", reportCount: 2, formCount: 0, interactionCount: 0 },
      { date: "2026-05-02", reportCount: 2, formCount: 0, interactionCount: 0 },
      { date: "2026-05-03", reportCount: 2, formCount: 0, interactionCount: 0 },
      { date: "2026-05-04", reportCount: 2, formCount: 0, interactionCount: 0 },
    ];
    expect(classifyTimeSeriesTrend(points)).toBe("estavel");
  });
});
