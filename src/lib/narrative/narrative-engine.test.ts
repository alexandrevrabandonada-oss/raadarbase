import { describe, expect, it } from "vitest";
import { buildDailyNarrative } from "./daily-narrative";
import { narrativeContainsForbiddenWords } from "./narrative-copy";
import { buildSeasonNarrative } from "./season-narrative";
import { buildWeeklyNarrative } from "./weekly-narrative";

describe("narrative engine", () => {
  it("gera Dia de Retorno quando há muitos retornos pendentes", () => {
    const narrative = buildDailyNarrative({
      pendingReturns: 8,
      newSignals: 2,
      urgentCare: 0,
      openReferrals: 1,
      fieldWithoutClosure: 0,
      pendingMemory: 0,
      recurringLinks: 1,
    });

    expect(narrative.type).toBe("DIA_DE_RETORNO");
  });

  it("gera Dia de Escuta quando há muitos sinais novos", () => {
    const narrative = buildDailyNarrative({
      pendingReturns: 0,
      newSignals: 9,
      urgentCare: 0,
      openReferrals: 0,
      fieldWithoutClosure: 0,
      pendingMemory: 0,
      recurringLinks: 0,
    });

    expect(narrative.type).toBe("DIA_DE_ESCUTA");
  });

  it("gera Dia de Cuidado quando há cuidados urgentes", () => {
    const narrative = buildDailyNarrative({
      pendingReturns: 12,
      newSignals: 20,
      urgentCare: 2,
      openReferrals: 3,
      fieldWithoutClosure: 1,
      pendingMemory: 0,
      recurringLinks: 4,
    });

    expect(narrative.type).toBe("DIA_DE_CUIDADO");
  });

  it("gera Dia de Campo ou Memória quando há campo sem fechamento", () => {
    const daily = buildDailyNarrative({
      pendingReturns: 0,
      newSignals: 0,
      urgentCare: 0,
      openReferrals: 0,
      fieldWithoutClosure: 3,
      pendingMemory: 0,
      recurringLinks: 0,
    });
    const weekly = buildWeeklyNarrative({
      unassignedMissions: 0,
      pendingReturns: 0,
      openReferrals: 0,
      fieldWithoutClosure: 3,
      pendingMemory: 0,
      territoriesReady: 1,
      staleTasks: 0,
      urgentCare: 0,
    });

    expect(["DIA_DE_CAMPO", "DIA_DE_MEMORIA"]).toContain(daily.type);
    expect(["SEMANA_DE_CAMPO", "SEMANA_DE_MEMORIA"]).toContain(weekly.type);
  });

  it("mantém a temporada inicial no anúncio da pré-candidatura", () => {
    const narrative = buildSeasonNarrative({
      activeMissions: 12,
      recurringLinks: 6,
      openReferrals: 0,
      fieldWithoutClosure: 0,
      pendingMemory: 0,
      territoriesInMobilization: 2,
      territoriesInField: 0,
      territoriesInContinuity: 0,
      urgentCare: 0,
    });

    expect(narrative.type).toBe("ANUNCIO_DA_PRE_CANDIDATURA");
  });

  it("nunca usa palavras proibidas", () => {
    const texts = [
      buildDailyNarrative({
        pendingReturns: 1,
        newSignals: 0,
        urgentCare: 0,
        openReferrals: 0,
        fieldWithoutClosure: 0,
        pendingMemory: 0,
        recurringLinks: 0,
      }),
      buildWeeklyNarrative({
        unassignedMissions: 1,
        pendingReturns: 0,
        openReferrals: 0,
        fieldWithoutClosure: 0,
        pendingMemory: 0,
        territoriesReady: 0,
        staleTasks: 2,
        urgentCare: 0,
      }),
      buildSeasonNarrative({
        activeMissions: 4,
        recurringLinks: 0,
        openReferrals: 1,
        fieldWithoutClosure: 0,
        pendingMemory: 0,
        territoriesInMobilization: 1,
        territoriesInField: 0,
        territoriesInContinuity: 0,
        urgentCare: 0,
      }),
    ];

    for (const item of texts) {
      expect(narrativeContainsForbiddenWords(item.headline)).toBe(false);
      expect(narrativeContainsForbiddenWords(item.summary)).toBe(false);
      expect(narrativeContainsForbiddenWords(item.support)).toBe(false);
      expect(narrativeContainsForbiddenWords(item.nextStep)).toBe(false);
    }
  });
});
