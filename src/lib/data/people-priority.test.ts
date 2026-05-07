import { describe, expect, it } from "vitest";
import { buildPriorityPeople } from "./people-priority";
import type { ContactRecord, MessageTemplate, PersonWithContact } from "@/lib/types";

const now = new Date("2026-05-07T12:00:00.000Z");

function person(overrides: Partial<PersonWithContact>): PersonWithContact {
  return {
    id: "person-1",
    username: "pessoa",
    displayName: "Pessoa Teste",
    totalInteractions: 6,
    lastInteractionAt: "2026-05-06T10:00:00.000Z",
    themes: ["saúde"],
    status: "novo",
    notes: "",
    doNotContactReason: null,
    syncedAt: null,
    contact: null,
    ...overrides,
  };
}

function contact(overrides: Partial<ContactRecord>): ContactRecord {
  return {
    id: "contact-1",
    person_id: "person-1",
    contact_channel: "Instagram",
    contact_value: null,
    phone: null,
    email: null,
    consent_given: true,
    consent_purpose: "Contato comunitário",
    consent_recorded_at: "2026-05-06T12:00:00.000Z",
    consent_status: "confirmed",
    privacy_policy_url: null,
    source: "instagram_manual",
    last_contacted_at: null,
    created_at: "2026-05-06T12:00:00.000Z",
    updated_at: "2026-05-06T12:00:00.000Z",
    ...overrides,
  };
}

const templates: MessageTemplate[] = [
  {
    id: "tpl-1",
    name: "Escuta",
    theme: "escuta",
    body: "Oi, {username}. Vi sua fala sobre {tema}.",
    active: true,
    updatedAt: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "tpl-2",
    name: "Grupo",
    theme: "grupo",
    body: "Oi, {username}. Posso te mandar o link do grupo?",
    active: true,
    updatedAt: "2026-05-01T00:00:00.000Z",
  },
];

describe("people priority", () => {
  it("prioriza interação recente com relato e tarefa pendente", () => {
    const ranked = buildPriorityPeople(
      [
        person({ id: "a", username: "ana", themes: ["saúde"], status: "novo" }),
        person({ id: "b", username: "bia", themes: ["transporte"], status: "novo", lastInteractionAt: "2026-04-20T10:00:00.000Z" }),
      ],
      [
        {
          personId: "a",
          type: "comentario",
          occurredAt: "2026-05-06T10:00:00.000Z",
          text: "Tenho relato sobre demora no posto e posso explicar melhor.",
          theme: "saúde",
        },
        {
          personId: "b",
          type: "curtida",
          occurredAt: "2026-04-20T10:00:00.000Z",
          text: "",
          theme: "transporte",
        },
      ],
      [
        {
          id: "task-1",
          personId: "a",
          column: "responder_comentario",
          title: "Responder",
          notes: "",
          dueAt: null,
          completedAt: null,
          person: null,
        },
      ],
      templates,
      now,
    );

    expect(ranked[0].id).toBe("a");
    expect(ranked[0].priorityReason).toMatch(/relato|Interação|Comentou/i);
    expect(ranked[0].suggestedMessage).toContain("@ana");
  });

  it("exclui não abordar da prioridade elegível", () => {
    const ranked = buildPriorityPeople(
      [person({ status: "nao_abordar", doNotContactReason: "Pediu para não receber contato." })],
      [],
      [],
      templates,
      now,
    );

    expect(ranked[0].priorityEligible).toBe(false);
    expect(ranked[0].priorityScore).toBeLessThan(0);
  });

  it("marca pendente de resposta quando já houve abordagem", () => {
    const ranked = buildPriorityPeople(
      [person({ status: "abordado", contact: contact() })],
      [
        {
          personId: "person-1",
          type: "dm_manual",
          occurredAt: "2026-05-06T10:00:00.000Z",
          text: "DM enviada",
          theme: "saúde",
        },
      ],
      [],
      templates,
      now,
    );

    expect(ranked[0].isPendingResponse).toBe(true);
    expect(ranked[0].nextAction).toMatch(/Acompanhar|Ver se houve resposta/i);
  });

  it("prefere template de grupo para quem respondeu", () => {
    const ranked = buildPriorityPeople(
      [person({ status: "respondeu" })],
      [
        {
          personId: "person-1",
          type: "comentario",
          occurredAt: "2026-05-06T10:00:00.000Z",
          text: "Topo ajudar e entrar no grupo.",
          theme: "saúde",
        },
      ],
      [],
      templates,
      now,
    );

    expect(ranked[0].suggestedTemplateName).toBe("Grupo");
  });
});
