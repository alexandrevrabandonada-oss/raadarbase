import { describe, expect, it } from "vitest";
import {
  assertVolunteerExportAllowed,
  buildVolunteerExportRows,
  sanitizeVolunteerForList,
  validateVolunteerInput,
  type CampaignVolunteer,
} from "./volunteers";

const sampleVolunteer: CampaignVolunteer = {
  id: "vol-1",
  displayName: "Ana Consentida",
  neighborhood: "Aterrado",
  city: "Volta Redonda",
  contactEmail: "ana@example.com",
  contactPhone: "24999999999",
  contactPreference: "whatsapp",
  consentToContact: true,
  consentToStoreData: true,
  availability: {
    weekdays: ["segunda", "quarta"],
    periods: ["noite"],
    notes: "Após 18h",
  },
  skills: ["rua", "eventos"],
  interests: ["mutirão", "escuta"],
  status: "ativo",
  source: "formulario",
  createdBy: null,
  createdByEmail: null,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  metadata: {},
};

describe("volunteers data layer", () => {
  it("nao cria voluntario sem consentimento de armazenamento", () => {
    const result = validateVolunteerInput({
      displayName: "Sem Consentimento",
      consentToStoreData: false,
      consentToContact: false,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("Consentimento para guardar dados");
  });

  it("contato exige consentimento para contato", () => {
    const result = validateVolunteerInput({
      displayName: "Contato sem consentimento",
      contactPhone: "24988887777",
      consentToStoreData: true,
      consentToContact: false,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("Contato preenchido exige consentimento");
  });

  it("lista nao mostra telefone ou email por padrao", () => {
    const safeVolunteer = sanitizeVolunteerForList(sampleVolunteer) as Record<string, unknown>;

    expect(safeVolunteer.contactEmail).toBeUndefined();
    expect(safeVolunteer.contactPhone).toBeUndefined();
    expect(safeVolunteer.hasContact).toBe(true);
  });

  it("exportacao padrao nao contem contato", () => {
    const rows = buildVolunteerExportRows([{ volunteer: sampleVolunteer, squads: ["Rua Centro"] }]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).not.toHaveProperty("contact_email");
    expect(rows[0]).not.toHaveProperty("contact_phone");
    expect(rows[0]).toHaveProperty("squads", "Rua Centro");
  });

  it("include_contact exige admin", () => {
    expect(() => assertVolunteerExportAllowed("operador", true)).toThrow(/admin/);
    expect(() => assertVolunteerExportAllowed("admin", true)).not.toThrow();
  });

  it("ig_people nao vira voluntario automaticamente", () => {
    const instagramDerived = validateVolunteerInput({
      displayName: "usuario_instagram",
      source: "outro",
      consentToStoreData: false,
      consentToContact: false,
    });

    expect(instagramDerived.valid).toBe(false);
  });

  it("banco vazio nao quebra exportacao", () => {
    expect(buildVolunteerExportRows([])).toEqual([]);
  });
});