import { describe, expect, it } from "vitest";
import { buildPersonOperationalProfile, buildPersonTimeline } from "./person-profile";
import type { AuditLogEntry, InteractionWithPost, MessageTemplate, OutreachTaskWithPerson, PersonWithContact } from "@/lib/types";

const person: PersonWithContact = {
  id: "person-1",
  username: "ana",
  displayName: "Ana",
  totalInteractions: 5,
  lastInteractionAt: "2026-05-07T10:00:00.000Z",
  themes: ["saúde"],
  status: "respondeu",
  notes: "",
  doNotContactReason: null,
  syncedAt: null,
  responsibleId: null,
  responsibleName: null,
  contact: null,
};

const interactions: InteractionWithPost[] = [
  {
    id: "interaction-1",
    personId: "person-1",
    postId: null,
    type: "comentario",
    occurredAt: "2026-05-07T10:00:00.000Z",
    text: "Posso ajudar a organizar uma conversa sobre saúde no bairro.",
    theme: "saúde",
    post: null,
  },
];

const tasks: OutreachTaskWithPerson[] = [
  {
    id: "task-1",
    personId: "person-1",
    column: "convidar_grupo",
    title: "Enviar convite para grupo",
    notes: "Pessoa quer continuar a conversa.",
    dueAt: null,
    completedAt: null,
    createdAt: "2026-05-07T10:00:00.000Z",
    updatedAt: "2026-05-07T10:00:00.000Z",
    responsibleId: null,
    person: null,
  },
];

const templates: MessageTemplate[] = [
  {
    id: "template-1",
    name: "Grupo",
    theme: "grupo",
    body: "Oi, {username}. Posso te mandar o link do grupo?",
    category: null,
    whenToUse: null,
    active: true,
    updatedAt: "2026-05-07T00:00:00.000Z",
  },
];

const auditLogs: AuditLogEntry[] = [
  {
    id: "audit-1",
    actorId: "admin-1",
    actorEmail: "admin@example.com",
    action: "contact.response_recorded",
    entityType: "ig_people",
    entityId: "person-1",
    summary: "Resposta da pessoa registrada.",
    metadata: { responseType: "quer_entrar_grupo" },
    createdAt: "2026-05-07T11:00:00.000Z",
  },
];

describe("person profile", () => {
  it("monta perfil operacional com proxima acao e template", () => {
    const profile = buildPersonOperationalProfile(person, interactions, tasks, templates, auditLogs, new Date("2026-05-07T12:00:00.000Z"));
    expect(profile.priority.nextAction).toMatch(/Encaminhar|Convidar/i);
    expect(profile.compatibleTemplate?.name).toBe("Grupo");
    expect(profile.reasons.length).toBeGreaterThan(0);
  });

  it("une timeline de interacoes, tarefas e registros", () => {
    const timeline = buildPersonTimeline(interactions, tasks, auditLogs);
    expect(timeline).toHaveLength(3);
    expect(timeline.map((item) => item.type).sort()).toEqual(["instagram", "registro", "tarefa"].sort());
  });
});
