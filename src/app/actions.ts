"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured, shouldUseMockData } from "@/lib/config";
import { people as mockPeople, messageTemplates as mockTemplates } from "@/lib/mock-data";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AuditAction, MessageTemplate, PersonStatus } from "@/lib/types";
import type { Json, TableInsert, TableUpdate } from "@/lib/supabase/database.types";

export type ActionResult = { ok: true; message: string; id?: string } | { ok: false; error: string };

function validateId(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} inválido.`);
}

function validateNotes(value: string) {
  if (value.length > 5000) throw new Error("Notas excedem o limite permitido.");
}

function validateTags(tags: string[]) {
  if (!Array.isArray(tags) || tags.some((tag) => !tag.trim())) {
    throw new Error("Tags temáticas inválidas.");
  }
}

function validateMessagePayload(payload: Pick<MessageTemplate, "name" | "theme" | "body">) {
  if (!payload.name.trim()) throw new Error("Nome do modelo é obrigatório.");
  if (!payload.body.trim()) throw new Error("Texto do modelo é obrigatório.");
}

async function requireActor() {
  const user = await requireInternalSession();
  return { actorId: user.id, actorEmail: user.email ?? null };
}

async function performAction({
  action,
  entityType,
  entityId,
  summary,
  metadata,
  mutate,
  revalidate,
}: {
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  summary: string;
  metadata?: Json;
  mutate: () => Promise<void>;
  revalidate?: string[];
}): Promise<ActionResult> {
  try {
    const actor = await requireActor();
    await mutate();
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase nao configurado para auditoria.");
    }
    await writeAuditLog({
      ...actor,
      action,
      entityType,
      entityId,
      summary,
      metadata,
    });
    revalidate?.forEach((path) => revalidatePath(path));
    return { ok: true, message: summary };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao executar ação.",
    };
  }
}

function updateMockPerson(personId: string, updater: (person: (typeof mockPeople)[number]) => void) {
  const person = mockPeople.find((item) => item.id === personId);
  if (!person) throw new Error("Pessoa não encontrada.");
  updater(person);
}

export async function updateContactStatus(personId: string, status: PersonStatus): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  return performAction({
    action: "contact.status_changed",
    entityType: "ig_people",
    entityId: personId,
    summary: `Status atualizado para ${status}.`,
    metadata: { status },
    mutate: async () => {
      await requireRole(["admin", "operador"]);
      if (shouldUseMockData()) {
        updateMockPerson(personId, (person) => {
          person.status = status;
        });
        return;
      }
      const supabase = getSupabaseAdminClient();
      const payload: TableUpdate<"ig_people"> = { status, updated_at: new Date().toISOString() };
      const { error } = await supabase.from("ig_people").update(payload).eq("id", personId);
      if (error) throw new Error(error.message);
    },
    revalidate: ["/pessoas", `/pessoas/${personId}`],
  });
}

export async function registerManualDm(personId: string): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  return performAction({
    action: "contact.dm_registered",
    entityType: "ig_people",
    entityId: personId,
    summary: "DM manual registrada.",
    mutate: async () => {
      await requireRole(["admin", "operador"]);
      if (shouldUseMockData()) {
        updateMockPerson(personId, (person) => {
          person.status = "abordado";
        });
        return;
      }
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("ig_people")
        .update({ status: "abordado", updated_at: new Date().toISOString() })
        .eq("id", personId);
      if (error) throw new Error(error.message);
      const interactionPayload: TableInsert<"ig_interactions"> = {
        person_id: personId,
        type: "dm_manual",
        occurred_at: new Date().toISOString(),
        text_content: "DM manual registrada no painel interno.",
        raw_payload: { origin: "radar_de_base" },
      };
      const { error: interactionError } = await supabase.from("ig_interactions").insert(interactionPayload);
      if (interactionError) throw new Error(interactionError.message);
      const { error: contactError } = await supabase
        .from("contacts")
        .update({ last_contacted_at: new Date().toISOString() })
        .eq("person_id", personId);
      if (contactError) throw new Error(contactError.message);
    },
    revalidate: ["/pessoas", `/pessoas/${personId}`],
  });
}

export async function markResponded(personId: string): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  return performAction({
    action: "contact.replied",
    entityType: "ig_people",
    entityId: personId,
    summary: "Pessoa marcada como respondeu.",
    mutate: async () => {
      if (shouldUseMockData()) {
        updateMockPerson(personId, (person) => {
          person.status = "respondeu";
        });
        return;
      }
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("ig_people")
        .update({ status: "respondeu", updated_at: new Date().toISOString() })
        .eq("id", personId);
      if (error) throw new Error(error.message);
    },
    revalidate: ["/pessoas", `/pessoas/${personId}`],
  });
}

export async function markContactConfirmed(personId: string, channel = "Instagram"): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  return performAction({
    action: "contact.confirmed",
    entityType: "contacts",
    entityId: personId,
    summary: "Contato confirmado com consentimento.",
    metadata: { channel },
    mutate: async () => {
      if (shouldUseMockData()) {
        updateMockPerson(personId, (person) => {
          person.status = "contato_confirmado";
          person.contact = {
            id: `contact-${personId}`,
            person_id: personId,
            contact_channel: channel,
            contact_value: null,
            phone: null,
            email: null,
            consent_given: true,
            consent_purpose: "Organização comunitária e convites manuais",
            consent_recorded_at: new Date().toISOString(),
            consent_status: "confirmed",
            privacy_policy_url: null,
            source: "instagram_manual",
            last_contacted_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        });
        return;
      }
      const supabase = getSupabaseAdminClient();
      const { error: personError } = await supabase
        .from("ig_people")
        .update({ status: "contato_confirmado", updated_at: new Date().toISOString() })
        .eq("id", personId);
      if (personError) throw new Error(personError.message);
      const contactPayload: TableInsert<"contacts"> = {
        person_id: personId,
        contact_channel: channel,
        consent_given: true,
        consent_purpose: "Organização comunitária e convites manuais",
        consent_recorded_at: new Date().toISOString(),
        consent_status: "confirmed",
        source: "instagram_manual",
        last_contacted_at: new Date().toISOString(),
      };
      const { error: contactError } = await supabase.from("contacts").upsert(contactPayload, { onConflict: "person_id" });
      if (contactError) throw new Error(contactError.message);
    },
    revalidate: ["/pessoas", `/pessoas/${personId}`, "/configuracoes"],
  });
}

export async function markDoNotContact(personId: string, reason = "Pedido da própria pessoa."): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  return performAction({
    action: "contact.do_not_contact",
    entityType: "ig_people",
    entityId: personId,
    summary: "Pessoa marcada como não abordar.",
    metadata: { reason },
    mutate: async () => {
      if (shouldUseMockData()) {
        updateMockPerson(personId, (person) => {
          person.status = "nao_abordar";
          person.doNotContactReason = reason;
        });
        return;
      }
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("ig_people")
        .update({
          status: "nao_abordar",
          do_not_contact_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", personId);
      if (error) throw new Error(error.message);
    },
    revalidate: ["/pessoas", `/pessoas/${personId}`, "/configuracoes"],
  });
}

export async function updatePersonNotes(personId: string, notes: string): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  validateNotes(notes);
  return performAction({
    action: "contact.notes_updated",
    entityType: "ig_people",
    entityId: personId,
    summary: "Notas internas atualizadas.",
    mutate: async () => {
      if (shouldUseMockData()) {
        updateMockPerson(personId, (person) => {
          person.notes = notes;
        });
        return;
      }
      const supabase = getSupabaseAdminClient();
      const payload: TableUpdate<"ig_people"> = { notes, updated_at: new Date().toISOString() };
      const { error } = await supabase.from("ig_people").update(payload).eq("id", personId);
      if (error) throw new Error(error.message);
    },
    revalidate: [`/pessoas/${personId}`],
  });
}

export async function updatePersonTags(personId: string, tags: string[]): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  validateTags(tags);
  return performAction({
    action: "contact.tags_updated",
    entityType: "ig_people",
    entityId: personId,
    summary: "Tags temáticas atualizadas.",
    metadata: { tags },
    mutate: async () => {
      if (shouldUseMockData()) {
        updateMockPerson(personId, (person) => {
          person.themes = tags;
        });
        return;
      }
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("ig_people")
        .update({ themes: tags, updated_at: new Date().toISOString() })
        .eq("id", personId);
      if (error) throw new Error(error.message);
    },
    revalidate: [`/pessoas/${personId}`],
  });
}

export async function upsertMessageTemplate(
  templateId: string | null,
  payload: Pick<MessageTemplate, "name" | "theme" | "body">,
): Promise<ActionResult> {
  validateMessagePayload(payload);
  return performAction({
    action: templateId ? "message.updated" : "message.created",
    entityType: "message_templates",
    entityId: templateId,
    summary: templateId ? "Modelo de mensagem atualizado." : "Modelo de mensagem criado.",
    mutate: async () => {
      await requireRole(["admin", "operador", "comunicacao"]);
      if (shouldUseMockData()) {
        if (templateId) {
          const template = mockTemplates.find((item) => item.id === templateId);
          if (!template) throw new Error("Modelo não encontrado.");
          Object.assign(template, payload, { updatedAt: new Date().toISOString() });
        } else {
          mockTemplates.unshift({
            id: crypto.randomUUID(),
            name: payload.name,
            theme: payload.theme,
            body: payload.body,
            active: true,
            updatedAt: new Date().toISOString(),
          });
        }
        return;
      }
      const supabase = getSupabaseAdminClient();
      if (templateId) {
        const updatePayload: TableUpdate<"message_templates"> = {
          name: payload.name,
          theme: payload.theme,
          body: payload.body,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from("message_templates").update(updatePayload).eq("id", templateId);
        if (error) throw new Error(error.message);
      } else {
        const insertPayload: TableInsert<"message_templates"> = {
          name: payload.name,
          theme: payload.theme,
          body: payload.body,
          active: true,
        };
        const { error } = await supabase.from("message_templates").insert(insertPayload);
        if (error) throw new Error(error.message);
      }
    },
    revalidate: ["/mensagens"],
  });
}

export async function removeMessageTemplate(templateId: string): Promise<ActionResult> {
  validateId(templateId, "Modelo");
  return performAction({
    action: "message.deleted",
    entityType: "message_templates",
    entityId: templateId,
    summary: "Modelo de mensagem removido.",
    mutate: async () => {
      await requireRole(["admin", "operador", "comunicacao"]);
      if (shouldUseMockData()) {
        const next = mockTemplates.filter((item) => item.id !== templateId);
        mockTemplates.splice(0, mockTemplates.length, ...next);
        return;
      }
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase.from("message_templates").delete().eq("id", templateId);
      if (error) throw new Error(error.message);
    },
    revalidate: ["/mensagens"],
  });
}

export async function anonymizeContact(personId: string): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  return performAction({
    action: "contact.anonymized",
    entityType: "ig_people",
    entityId: personId,
    summary: "Contato anonimizado e retirado da base operacional.",
    mutate: async () => {
      await requireRole(["admin"]);
      if (shouldUseMockData()) {
        updateMockPerson(personId, (person) => {
          person.username = `anon_${person.id}`;
          person.displayName = "Anonimizado";
          person.notes = "";
          person.themes = [];
          person.status = "nao_abordar";
          person.doNotContactReason = "Anonimizado manualmente.";
          person.contact = null;
        });
        return;
      }
      const supabase = getSupabaseAdminClient();
      const personPayload: TableUpdate<"ig_people"> = {
        username: `anon_${personId.slice(0, 8)}`,
        display_name: "Anonimizado",
        notes: "",
        themes: [],
        status: "nao_abordar",
        do_not_contact_reason: "Anonimizado manualmente.",
        updated_at: new Date().toISOString(),
      };
      const { error: personError } = await supabase.from("ig_people").update(personPayload).eq("id", personId);
      if (personError) throw new Error(personError.message);
      const contactPayload: TableUpdate<"contacts"> = {
        phone: null,
        email: null,
        contact_value: null,
        consent_status: "revoked",
        updated_at: new Date().toISOString(),
      };
      const { error: contactError } = await supabase.from("contacts").update(contactPayload).eq("person_id", personId);
      if (contactError) throw new Error(contactError.message);
    },
    revalidate: ["/configuracoes", "/pessoas", `/pessoas/${personId}`],
  });
}
