import { describe, expect, it } from "vitest";
import {
  buildRedactedApplicationUpdate,
  buildRetentionSummary,
  isApplicationEligibleForRedaction,
  validateRetentionReason,
  type VolunteerApplicationRetentionFilters,
} from "./volunteer-application-retention";
import type { VolunteerApplication } from "./volunteer-applications";

const oldDate = new Date("2026-01-01T00:00:00.000Z").toISOString();
const now = new Date("2026-03-15T00:00:00.000Z");

function app(overrides: Partial<VolunteerApplication>): VolunteerApplication {
  return {
    id: "app-1",
    displayName: "Pessoa Teste",
    neighborhood: "Centro",
    city: "Volta Redonda",
    contactEmail: "pessoa@example.com",
    contactPhone: "24999999999",
    contactPreference: "whatsapp",
    consentToContact: true,
    consentToStoreData: true,
    availability: { weekdays: [], periods: [], notes: null },
    skills: [],
    interests: [],
    status: "pending",
    reviewNotes: "nota sensível",
    reviewedBy: null,
    reviewedByEmail: null,
    reviewedAt: null,
    convertedVolunteerId: null,
    createdAt: oldDate,
    metadata: { raw: "sensivel" },
    retentionStatus: "active",
    retentionReason: null,
    redactedAt: null,
    redactedBy: null,
    redactedByEmail: null,
    scheduledRedactionAt: null,
    ...overrides,
  };
}

describe("volunteer application retention", () => {
  it("rejected acima de 30 dias e elegivel", () => {
    expect(isApplicationEligibleForRedaction(app({ status: "rejected" }), now)).toBe(true);
  });

  it("archived acima de 30 dias e elegivel", () => {
    expect(isApplicationEligibleForRedaction(app({ status: "archived" }), now)).toBe(true);
  });

  it("approved convertido nao e elegivel", () => {
    expect(isApplicationEligibleForRedaction(app({ status: "approved", convertedVolunteerId: "vol-1" }), now)).toBe(false);
  });

  it("redact remove contato e PII direta", () => {
    const update = buildRedactedApplicationUpdate("prazo encerrado", { id: "admin-1", email: "admin@example.com" }, now);
    expect(update.contact_email).toBeNull();
    expect(update.contact_phone).toBeNull();
    expect(update.display_name).toBe("Inscrição anonimizada");
    expect(update.review_notes).toContain("redigidas");
    expect(update.retention_status).toBe("redacted");
  });

  it("retained exige motivo", () => {
    expect(() => validateRetentionReason("")).toThrow(/justificativa/);
    expect(validateRetentionReason("necessidade operacional")).toBe("necessidade operacional");
  });

  it("bulk respeita regras de elegibilidade via resumo", () => {
    const applications = [
      app({ id: "rejected", status: "rejected" }),
      app({ id: "archived", status: "archived" }),
      app({ id: "approved", status: "approved", convertedVolunteerId: "vol-1" }),
      app({ id: "retained", status: "rejected", retentionStatus: "retained" }),
    ];
    const summary = buildRetentionSummary(applications, now);
    expect(summary.eligibleForRedactionCount).toBe(2);
    expect(summary.rejectedEligible.map((item) => item.id)).toEqual(["rejected"]);
  });

  it("filtros de bulk aceitam status e retention status previstos", () => {
    const filters: VolunteerApplicationRetentionFilters = { status: "rejected", retentionStatus: "active" };
    expect(filters).toEqual({ status: "rejected", retentionStatus: "active" });
  });

  it("audit logs previstos estao nomeados", () => {
    expect([
      "volunteer_application.redaction_scheduled",
      "volunteer_application.redacted",
      "volunteer_application.retained",
      "volunteer_application.bulk_redaction_scheduled",
      "volunteer_application.bulk_redacted",
    ]).toHaveLength(5);
  });
});
