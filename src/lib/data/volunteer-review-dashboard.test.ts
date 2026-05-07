import { describe, expect, it } from "vitest";
import {
  buildVolunteerReviewDashboard,
  buildVolunteerReviewDashboardExport,
  getApplicationsEligibleForRedaction,
  getApplicationsWithConsentIssues,
  getPendingApplicationsByAge,
  getVolunteerReviewRecommendations,
  type VolunteerReviewRound,
} from "./volunteer-review-dashboard";
import type { VolunteerApplication } from "./volunteer-applications";

const now = new Date("2026-05-06T12:00:00.000Z");

function daysAgo(days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function app(overrides: Partial<VolunteerApplication>): VolunteerApplication {
  return {
    id: "app",
    displayName: "Pessoa Interna",
    neighborhood: "Centro",
    city: "Volta Redonda",
    contactEmail: null,
    contactPhone: null,
    contactPreference: "nenhum",
    consentToContact: false,
    consentToStoreData: true,
    availability: { weekdays: [], periods: [], notes: null },
    skills: ["rua"],
    interests: ["escuta"],
    status: "pending",
    reviewNotes: null,
    reviewedBy: null,
    reviewedByEmail: null,
    reviewedAt: null,
    convertedVolunteerId: null,
    createdAt: daysAgo(10),
    metadata: {},
    retentionStatus: "active",
    retentionReason: null,
    redactedAt: null,
    redactedBy: null,
    redactedByEmail: null,
    scheduledRedactionAt: null,
    ...overrides,
  };
}

const round: VolunteerReviewRound = {
  id: "round-1",
  title: "Semana 1",
  status: "done",
  reviewedPendingCount: 3,
  approvedCount: 1,
  rejectedCount: 1,
  archivedCount: 1,
  redactedCount: 1,
  retainedCount: 0,
  notes: null,
  createdBy: null,
  createdByEmail: null,
  createdAt: daysAgo(1),
  completedAt: daysAgo(0),
  metadata: {},
};

describe("volunteer review dashboard", () => {
  it("banco vazio nao quebra", () => {
    const dashboard = buildVolunteerReviewDashboard([], [], now);
    expect(dashboard.pending90d).toEqual([]);
    expect(dashboard.latestRound).toBeNull();
  });

  it("pending acima de 90 dias aparece", () => {
    const items = [app({ id: "old", createdAt: daysAgo(91) })];
    expect(getPendingApplicationsByAge(items, 90, now)).toHaveLength(1);
  });

  it("rejected e archived elegiveis aparecem", () => {
    const items = [app({ status: "rejected", createdAt: daysAgo(31) }), app({ status: "archived", createdAt: daysAgo(31) })];
    expect(getApplicationsEligibleForRedaction(items, now)).toHaveLength(2);
  });

  it("detecta contato preenchido com consentimento invalido", () => {
    const items = [app({ contactEmail: "pessoa@example.com", consentToContact: false })];
    expect(getApplicationsWithConsentIssues(items)).toHaveLength(1);
  });

  it("exportacao agregada nao contem contato", () => {
    const dashboard = buildVolunteerReviewDashboard([app({ contactEmail: "pessoa@example.com", consentToContact: true })], [round], now);
    const exported = buildVolunteerReviewDashboardExport(dashboard) as Record<string, unknown>;
    expect(JSON.stringify(exported)).not.toContain("pessoa@example.com");
    expect(exported.latest_round).toBeTruthy();
  });

  it("rodada concluida gera status correto no painel", () => {
    const dashboard = buildVolunteerReviewDashboard([], [round], now);
    expect(dashboard.latestRound?.status).toBe("done");
  });

  it("recomendacoes nao incluem acoes proibidas", () => {
    const dashboard = buildVolunteerReviewDashboard([app({ createdAt: daysAgo(91) })], [], now);
    const recommendations = getVolunteerReviewRecommendations(dashboard).join(" ");
    expect(recommendations).not.toMatch(/mensagem automática|score|voto|classificar/i);
  });
});
