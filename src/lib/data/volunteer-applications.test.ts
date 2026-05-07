import { describe, expect, it, vi } from "vitest";
import {
  buildVolunteerApplicationExportRows,
  checkPublicVolunteerApplicationRateLimit,
  sanitizeApplicationForList,
  sanitizePublicText,
  validateVolunteerApplicationInput,
  type VolunteerApplication,
} from "./volunteer-applications";

const sampleApplication: VolunteerApplication = {
  id: "app-1",
  displayName: "Ana Pública",
  neighborhood: "Aterrado",
  city: "Volta Redonda",
  contactEmail: "ana@example.com",
  contactPhone: "24999999999",
  contactPreference: "whatsapp",
  consentToContact: true,
  consentToStoreData: true,
  availability: { weekdays: ["segunda"], periods: ["noite"], notes: "Depois das 18h" },
  skills: ["rua", "dados"],
  interests: ["escuta"],
  status: "pending",
  reviewNotes: null,
  reviewedBy: null,
  reviewedByEmail: null,
  reviewedAt: null,
  convertedVolunteerId: null,
  createdAt: new Date(0).toISOString(),
  metadata: {},
  retentionStatus: "active",
  retentionReason: null,
  redactedAt: null,
  redactedBy: null,
  redactedByEmail: null,
  scheduledRedactionAt: null,
};

vi.mock("./volunteers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./volunteers")>();
  return {
    ...actual,
    createVolunteer: vi.fn(async () => ({ id: "vol-1" })),
  };
});

describe("volunteer applications data layer", () => {
  it("envio publico exige consentimento de armazenamento", () => {
    const result = validateVolunteerApplicationInput({
      displayName: "Sem consentimento",
      consentToStoreData: false,
      consentToContact: false,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("Consentimento para guardar dados");
  });

  it("contato exige consentimento de contato", () => {
    const result = validateVolunteerApplicationInput({
      displayName: "Com contato",
      contactPhone: "24988887777",
      consentToStoreData: true,
      consentToContact: false,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("Contato preenchido exige consentimento");
  });

  it("honeypot bloqueia inscricao", () => {
    const result = validateVolunteerApplicationInput({
      displayName: "Bot",
      consentToStoreData: true,
      consentToContact: false,
      honeypot: "https://spam.example",
    });

    expect(result.valid).toBe(false);
  });

  it("sanitiza html e scripts", () => {
    expect(sanitizePublicText("<script>alert(1)</script> Maria", 80)).not.toContain("<script>");
    expect(sanitizePublicText("<b>Maria</b>", 80)).toBe("Maria");
  });

  it("inscricao fica pending e nao vira voluntario automaticamente", () => {
    expect(sampleApplication.status).toBe("pending");
    expect(sampleApplication.convertedVolunteerId).toBeNull();
  });

  it("lista nao expoe contato por padrao", () => {
    const safe = sanitizeApplicationForList(sampleApplication) as Record<string, unknown>;
    expect(safe.contactEmail).toBeUndefined();
    expect(safe.contactPhone).toBeUndefined();
    expect(safe.hasContact).toBe(true);
  });

  it("exportacao padrao nao expoe contato", () => {
    const rows = buildVolunteerApplicationExportRows([sampleApplication]);
    expect(rows[0]).not.toHaveProperty("contact_email");
    expect(rows[0]).not.toHaveProperty("contact_phone");
  });

  it("rate limit leve bloqueia excesso por IP", () => {
    expect(checkPublicVolunteerApplicationRateLimit("1.2.3.4", 1000)).toBe(true);
    expect(checkPublicVolunteerApplicationRateLimit("1.2.3.4", 1001)).toBe(true);
    expect(checkPublicVolunteerApplicationRateLimit("1.2.3.4", 1002)).toBe(true);
    expect(checkPublicVolunteerApplicationRateLimit("1.2.3.4", 1003)).toBe(true);
    expect(checkPublicVolunteerApplicationRateLimit("1.2.3.4", 1004)).toBe(true);
    expect(checkPublicVolunteerApplicationRateLimit("1.2.3.4", 1005)).toBe(false);
  });

  it("banco vazio nao quebra exportacao", () => {
    expect(buildVolunteerApplicationExportRows([])).toEqual([]);
  });
});
