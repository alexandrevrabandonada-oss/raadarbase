import { describe, expect, it } from "vitest";
import { buildPriorityPeople } from "./people-priority";
import type { AuditLogEntry, ContactRecord, MessageTemplate, PersonWithContact } from "@/lib/types";

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
    responsibleId: null,
    responsibleName: null,
    contact: null,
    ...overrides,
  };
}

function contact(overrides: Partial<ContactRecord> = {}): ContactRecord {
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
    category: null,
    whenToUse: null,
    active: true,
    updatedAt: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "tpl-2",
    name: "Grupo",
    theme: "grupo",
    body: "Oi, {username}. Posso te mandar o link do grupo?",
    category: null,
    whenToUse: null,
    active: true,
    updatedAt: "2026-05-01T00:00:00.000Z",
  },
];

function auditLog(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: "audit-1",
    actorId: "operator-1",
    actorEmail: "operador@radar.camp",
    action: "contact.dm_sent",
    entityType: "ig_people",
    entityId: "person-1",
    summary: "DM enviada",
    metadata: {},
    createdAt: "2026-05-06T11:00:00.000Z",
    ...overrides,
  };
}

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
          createdAt: "2026-05-06T12:00:00.000Z",
          updatedAt: "2026-05-06T12:00:00.000Z",
          responsibleId: null,
          person: null,
        },
      ],
      [],
      templates,
      now,
    );

    expect(ranked[0].id).toBe("a");
    expect(ranked[0].priorityReason).toMatch(/relato|Interação|Comentou/i);
    expect(ranked[0].suggestedMessage).toContain("ana");
    expect(ranked[0].suggestedMessage).not.toContain("@@");
  });

  it("exclui não abordar da prioridade elegível", () => {
    const ranked = buildPriorityPeople(
      [person({ status: "nao_abordar", doNotContactReason: "Pediu para não receber contato." })],
      [],
      [],
      [],
      templates,
      now,
    );

    expect(ranked[0].priorityEligible).toBe(false);
    expect(ranked[0].priorityScore).toBeLessThan(0);
  });

  it("ordena perfis sem histórico depois de pessoas com interação real em empate", () => {
    const ranked = buildPriorityPeople(
      [
        person({
          id: "sem-historico",
          username: "semhistorico",
          totalInteractions: 0,
          lastInteractionAt: null,
          themes: ["seguidor_instagram"],
        }),
        person({
          id: "com-historico",
          username: "comhistorico",
          totalInteractions: 1,
          lastInteractionAt: "2026-04-20T10:00:00.000Z",
        }),
      ],
      [
        {
          personId: "com-historico",
          type: "curtida",
          occurredAt: "2026-04-20T10:00:00.000Z",
          text: "",
          theme: "saúde",
        },
      ],
      [],
      [],
      templates,
      now,
    );

    expect(ranked[0].id).toBe("com-historico");
    expect(ranked[1].id).toBe("sem-historico");
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
      [],
      templates,
      now,
    );

    expect(ranked[0].isPendingResponse).toBe(true);
    expect(ranked[0].nextAction).toMatch(/Acompanhar|Ver se houve resposta/i);
  });

  it("marca pendente de resposta quando qualquer tarefa aberta está em espera", () => {
    const ranked = buildPriorityPeople(
      [person({ status: "novo" })],
      [],
      [
        {
          id: "task-1",
          personId: "person-1",
          column: "responder_comentario",
          title: "Responder comentário",
          notes: "",
          dueAt: "2026-05-07T12:00:00.000Z",
          completedAt: null,
          createdAt: "2026-05-06T12:00:00.000Z",
          updatedAt: "2026-05-06T12:00:00.000Z",
          responsibleId: null,
          person: null,
        },
        {
          id: "task-2",
          personId: "person-1",
          column: "esperando_resposta",
          title: "Aguardar retorno",
          notes: "",
          dueAt: null,
          completedAt: null,
          createdAt: "2026-05-06T13:00:00.000Z",
          updatedAt: "2026-05-06T13:00:00.000Z",
          responsibleId: null,
          person: null,
        },
      ],
      [],
      templates,
      now,
    );

    expect(ranked[0].isPendingResponse).toBe(true);
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
      [],
      templates,
      now,
    );

    expect(ranked[0].suggestedTemplateName).toBe("Grupo");
  });

  it("marca como enviado quando existe dm_sent no histórico mesmo com status antigo", () => {
    const ranked = buildPriorityPeople(
      [person({ status: "novo", contact: contact({ last_contacted_at: "2026-05-06T11:00:00.000Z" }) })],
      [],
      [],
      [auditLog()],
      templates,
      now,
    );

    expect(ranked[0].announcementStatus).toBe("enviado");
  });

  it("marca como enviado com sinal legado de contato mesmo sem audit log", () => {
    const ranked = buildPriorityPeople(
      [person({ status: "novo", contact: contact({ last_contacted_at: "2026-05-06T11:00:00.000Z" }) })],
      [
        {
          personId: "person-1",
          type: "dm_manual",
          occurredAt: "2026-05-06T10:00:00.000Z",
          text: "Mensagem enviada manualmente",
          theme: "saúde",
        },
      ],
      [],
      [],
      templates,
      now,
    );

    expect(ranked[0].announcementStatus).toBe("enviado");
  });
});
