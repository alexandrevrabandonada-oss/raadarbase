"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured, shouldUseMockData } from "@/lib/config";
import { people as mockPeople, messageTemplates as mockTemplates, outreachTasks as mockTasks, kanbanLabels } from "@/lib/mock-data";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AuditAction, KanbanColumnId, MessageTemplate, PersonResponseKind, PersonStatus, PersonReferralType, PersonReferralStatus } from "@/lib/types";
import { upsertPersonReferral } from "@/lib/data/referrals";
import { createActionPlan, createActionPlanItem } from "@/lib/data/action-plans";
import type { Json, TableInsert, TableUpdate } from "@/lib/supabase/database.types";
import { boardColumnNeedsDoNotContactReason, mapBoardColumnToPersonStatus, normalizeOutreachColumn, type BoardColumnId } from "@/lib/outreach-workflow";
import { getPilotFeedbackCategory, getPilotFeedbackCategoryLabel, getPilotFeedbackTypeLabel, type PilotFeedbackLoopStatus } from "@/lib/data/pilot-feedback-loop";

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

function upsertMockTask(
  personId: string,
  payload: { column: KanbanColumnId; title: string; notes?: string; completedAt?: string | null },
) {
  const existing = mockTasks.find((task) => task.personId === personId && !task.completedAt);
  if (existing) {
    existing.column = payload.column;
    existing.title = payload.title;
    existing.notes = payload.notes ?? existing.notes;
    existing.completedAt = payload.completedAt ?? null;
    return existing.id;
  }

  const id = `task-${crypto.randomUUID()}`;
  mockTasks.unshift({
    id,
    personId,
    column: payload.column,
    title: payload.title,
    notes: payload.notes ?? "",
    dueAt: null,
    completedAt: payload.completedAt ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    responsibleId: null,
    person: null,
  });
  return id;
}

function getResponseTaskConfig(responseType: PersonResponseKind) {
  switch (responseType) {
    case "nao_respondeu":
      return {
        status: "abordado" as PersonStatus,
        column: "esperando_resposta" as KanbanColumnId,
        title: "Aguardar retorno da pessoa",
        notes: "Tentativa feita, sem resposta registrada até agora.",
      };
    case "respondeu_bem":
      return {
        status: "respondeu" as PersonStatus,
        column: "precisa_encaminhar" as KanbanColumnId,
        title: "Definir próximo passo após resposta positiva",
        notes: "Pessoa respondeu bem. Abrir próximo passo manual.",
      };
    case "pediu_informacoes":
      return {
        status: "respondeu" as PersonStatus,
        column: "mensagem_enviada" as KanbanColumnId,
        title: "Responder com informações complementares",
        notes: "Pessoa pediu mais informações antes de avançar.",
      };
    case "quer_entrar_grupo":
      return {
        status: "respondeu" as PersonStatus,
        column: "convidado" as KanbanColumnId,
        title: "Enviar convite manual para grupo",
        notes: "Pessoa demonstrou interesse em entrar no grupo.",
      };
    case "quer_ir_evento":
      return {
        status: "respondeu" as PersonStatus,
        column: "convidado" as KanbanColumnId,
        title: "Encaminhar manualmente para evento de pré-campanha",
        notes: "Pessoa quer ir a um evento ou ação de campo.",
      };
    case "quer_conhecer_missao_eluta":
      return {
        status: "respondeu" as PersonStatus,
        column: "precisa_encaminhar" as KanbanColumnId,
        title: "Apresentar o app Missão ÉLuta",
        notes: "Pessoa quer conhecer o app Missão ÉLuta.",
      };
    case "quer_ajudar_online":
      return {
        status: "respondeu" as PersonStatus,
        column: "precisa_encaminhar" as KanbanColumnId,
        title: "Encaminhar para ajuda online",
        notes: "Pessoa se ofereceu para ajudar online.",
      };
    case "quer_ajudar_presencial":
      return {
        status: "respondeu" as PersonStatus,
        column: "precisa_encaminhar" as KanbanColumnId,
        title: "Encaminhar para ajuda presencial",
        notes: "Pessoa se ofereceu para ajudar presencialmente.",
      };
    case "nao_quer_contato":
      return {
        status: "nao_abordar" as PersonStatus,
        column: "nao_abordar" as KanbanColumnId,
        title: "Respeitar pedido de não contato",
        notes: "Pessoa pediu para não receber novas abordagens.",
      };
    case "manter_aguardando":
      return {
        status: "abordado" as PersonStatus,
        column: "esperando_resposta" as KanbanColumnId,
        title: "Aguardar retorno da pessoa (Régua Ética)",
        notes: "Operador decidiu manter aguardando por mais tempo.",
      };
    case "arquivar_sem_retorno":
      return {
        status: "abordado" as PersonStatus,
        column: "nao_insistir" as KanbanColumnId,
        title: "Arquivar por falta de retorno",
        notes: "Silêncio prolongado após tentativa de contato. Movido para não insistir.",
      };
    case "resposta_tardia":
      return {
        status: "respondeu" as PersonStatus,
        column: "esperando_resposta" as KanbanColumnId,
        title: "Retomar conversa (Resposta Tardia)",
        notes: "Pessoa respondeu após janela de espera. Retomar fluxo.",
      };
    case "revisar_depois":
    default:
      return {
        status: "abordado" as PersonStatus,
        column: "esperando_resposta" as KanbanColumnId,
        title: "Revisar conversa depois",
        notes: "Retomar manualmente em outro momento.",
      };
  }
}

async function upsertOutreachTaskForPerson(
  personId: string,
  payload: { column: KanbanColumnId; title: string; notes: string; completedAt?: string | null },
) {
  if (shouldUseMockData()) {
    return { id: upsertMockTask(personId, payload) };
  }

  const supabase = getSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("outreach_tasks")
    .select("*")
    .eq("person_id", personId)
    .is("completed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  if (existing) {
    const updatePayload: TableUpdate<"outreach_tasks"> = {
      column_key: payload.column,
      title: payload.title,
      notes: payload.notes,
      completed_at: payload.completedAt ?? null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("outreach_tasks").update(updatePayload).eq("id", existing.id).select("*").single();
    if (error) throw new Error(error.message);
    return data;
  }

  const insertPayload: TableInsert<"outreach_tasks"> = {
    person_id: personId,
    column_key: payload.column,
    title: payload.title,
    notes: payload.notes,
    completed_at: payload.completedAt ?? null,
  };
  const { data, error } = await supabase.from("outreach_tasks").insert(insertPayload).select("*").single();
  if (error) throw new Error(error.message);
  return data;
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

export async function recordDMPreparedAction(personId: string, origin: string): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  return performAction({
    action: "contact.dm_prepared",
    entityType: "ig_people",
    entityId: personId,
    summary: `DM preparada para envio (Origem: ${origin}).`,
    metadata: { origin },
    mutate: async () => {
      await requireRole(["admin", "operador"]);
      // Apenas auditoria/telemetria, não altera estado da pessoa ainda
    },
  });
}

export async function confirmDMSentAction(personId: string, origin: string): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  return performAction({
    action: "contact.dm_sent",
    entityType: "ig_people",
    entityId: personId,
    summary: `DM confirmada como enviada manualmente (Origem: ${origin}).`,
    metadata: { origin, auto_status: true },
    mutate: async () => {
      await requireRole(["admin", "operador"]);
      
      if (shouldUseMockData()) {
        updateMockPerson(personId, (person) => {
          person.status = "abordado";
        });
        upsertMockTask(personId, { 
          column: "esperando_resposta", 
          title: "Aguardar retorno da pessoa (Auto-Status)",
          notes: `Confirmado envio manual via ${origin}.`
        });
        return;
      }

      const supabase = getSupabaseAdminClient();
      
      // 1. Atualizar status da pessoa
      const { error: personError } = await supabase
        .from("ig_people")
        .update({ status: "abordado", updated_at: new Date().toISOString() })
        .eq("id", personId);
      if (personError) throw new Error(personError.message);

      // 2. Mover/Criar tarefa no Kanban
      await upsertOutreachTaskForPerson(personId, {
        column: "esperando_resposta",
        title: "Aguardar retorno da pessoa (Auto-Status)",
        notes: `Confirmação de envio manual realizada via ${origin}. Sistema moveu automaticamente para Aguardando Retorno.`
      });

      // 3. Atualizar last_contacted_at
      const { error: contactError } = await supabase
        .from("contacts")
        .update({ last_contacted_at: new Date().toISOString() })
        .eq("person_id", personId);
      if (contactError) throw new Error(contactError.message);
    },
    revalidate: ["/pessoas", `/pessoas/${personId}`, "/abordagem", "/minha-fila"],
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

export async function createOutreachTask(
  personId: string,
  input?: { column?: KanbanColumnId; title?: string; notes?: string },
): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  return performAction({
    action: "contact.outreach_task_created",
    entityType: "ig_people",
    entityId: personId,
    summary: "Tarefa de abordagem criada ou atualizada.",
    metadata: { column: input?.column ?? "novo" },
    mutate: async () => {
      await requireRole(["admin", "operador"]);
      const column = input?.column ?? "novo";
      const normalizedColumn = normalizeOutreachColumn(column);
      const title = input?.title?.trim() || `Acompanhar pessoa em ${kanbanLabels[normalizedColumn]}`;
      const notes = input?.notes?.trim() || "Tarefa criada a partir da ficha operacional da pessoa.";
      await upsertOutreachTaskForPerson(personId, { column: normalizedColumn, title, notes });
    },
    revalidate: ["/pessoas", `/pessoas/${personId}`, "/abordagem"],
  });
}

export async function recordPersonResponse(personId: string, responseType: PersonResponseKind): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  return performAction({
    action: "contact.response_recorded",
    entityType: "ig_people",
    entityId: personId,
    summary: "Resposta da pessoa registrada.",
    metadata: { responseType },
    mutate: async () => {
      await requireRole(["admin", "operador"]);
      const config = getResponseTaskConfig(responseType);

      if (responseType === "nao_quer_contato") {
        if (shouldUseMockData()) {
          updateMockPerson(personId, (person) => {
            person.status = "nao_abordar";
            person.doNotContactReason = config.notes;
          });
          upsertMockTask(personId, { column: config.column, title: config.title, notes: config.notes });
          return;
        }
        const supabase = getSupabaseAdminClient();
        const payload: TableUpdate<"ig_people"> = {
          status: "nao_abordar",
          do_not_contact_reason: config.notes,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from("ig_people").update(payload).eq("id", personId);
        if (error) throw new Error(error.message);
        await upsertOutreachTaskForPerson(personId, { column: config.column, title: config.title, notes: config.notes });
        return;
      }

      if (shouldUseMockData()) {
        updateMockPerson(personId, (person) => {
          person.status = config.status;
        });
        upsertMockTask(personId, { column: config.column, title: config.title, notes: config.notes });
        return;
      }

      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("ig_people")
        .update({ status: config.status, updated_at: new Date().toISOString() })
        .eq("id", personId);
      if (error) throw new Error(error.message);
      await upsertOutreachTaskForPerson(personId, { column: config.column, title: config.title, notes: config.notes });
    },
    revalidate: ["/pessoas", `/pessoas/${personId}`, "/abordagem"],
  });
}

export async function recordPersonReferral(
  personId: string,
  target: PersonReferralType,
  details?: { 
    targetId?: string; 
    notes?: string; 
    status?: PersonReferralStatus;
    createConfirmationTask?: boolean;
  },
): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  return performAction({
    action: "contact.referral_recorded",
    entityType: "ig_people",
    entityId: personId,
    summary: "Encaminhamento manual registrado.",
    metadata: { target },
    mutate: async () => {
      const actor = await requireRole(["admin", "operador"]);
      
      // 1. Criar registro estruturado na nova tabela
      const initialStatus = details?.status || "recomendado";
      await upsertPersonReferral(null, {
        personId,
        targetType: target,
        targetId: details?.targetId || null,
        status: initialStatus,
        notes: details?.notes || "",
      }, actor);

      // 2. Garantir que a tarefa de abordagem esteja na coluna de encaminhamento
      let column: KanbanColumnId = "precisa_encaminhar";
      let title = `Encaminhar para ${target.replace("_", " ")}`;
      let notes = details?.notes || `Encaminhamento para ${target} registrado na ficha da pessoa.`;

      if (details?.createConfirmationTask) {
        column = "esperando_resposta"; // Move to waiting for response if it's a follow-up task
        title = `Confirmar presença: ${target.replace("_", " ")}`;
        notes = `Pessoa marcada como ${initialStatus}. Necessário confirmar presença para o evento.`;
      }
      
      await upsertOutreachTaskForPerson(personId, { 
        column, 
        title, 
        notes 
      });

      // 3. Adicionar etiqueta/tema de interesse à pessoa para filtros
      if (!shouldUseMockData()) {
        const supabase = getSupabaseAdminClient();
        const { data: person } = await supabase.from("ig_people").select("themes").eq("id", personId).single();
        const currentThemes = person?.themes || [];
        const newTheme = `quer_${target}`;
        if (!currentThemes.includes(newTheme)) {
          await supabase.from("ig_people").update({ 
            themes: [...currentThemes, newTheme],
            updated_at: new Date().toISOString()
          }).eq("id", personId);
        }
      }
    },
    revalidate: ["/pessoas", `/pessoas/${personId}`, "/abordagem", "/campo", "/voluntarios"],
  });
}

export async function updatePersonReferralStatus(
  referralId: string,
  personId: string,
  status: PersonReferralStatus,
  notes?: string
): Promise<ActionResult> {
  validateId(referralId, "Encaminhamento");
  return performAction({
    action: "referral.status_updated",
    entityType: "ig_person_referrals",
    entityId: referralId,
    summary: `Status do encaminhamento atualizado para: ${status}`,
    metadata: { status },
    mutate: async () => {
      const actor = await requireRole(["admin", "operador"]);
      
      const supabase = getSupabaseAdminClient();
      const { data: referral } = await supabase.from("ig_person_referrals").select("*").eq("id", referralId).single();
      if (!referral) throw new Error("Encaminhamento não encontrado.");

      await upsertPersonReferral(referralId, {
        personId: referral.person_id,
        targetType: referral.target_type as PersonReferralType,
        targetId: referral.target_id,
        status,
        notes: notes ?? referral.notes,
      }, actor);
    },
    revalidate: [`/pessoas/${personId}`, "/pessoas", "/abordagem", "/campo"],
  });
}

export async function updateOutreachTaskStatus(taskId: string, nextColumn: BoardColumnId): Promise<ActionResult> {
  validateId(taskId, "Tarefa");
  try {
    const actor = await requireRole(["admin", "operador"]);

    let previousColumn: BoardColumnId;
    let personId: string;

    if (shouldUseMockData()) {
      const task = mockTasks.find((item) => item.id === taskId);
      if (!task) throw new Error("Tarefa de abordagem não encontrada.");
      previousColumn = normalizeOutreachColumn(task.column);
      personId = task.personId;
      task.column = nextColumn;
      updateMockPerson(task.personId, (person) => {
        person.status = mapBoardColumnToPersonStatus(nextColumn, person.status);
        if (boardColumnNeedsDoNotContactReason(nextColumn)) {
          person.doNotContactReason = person.doNotContactReason ?? "Marcado manualmente no quadro de abordagem.";
        }
      });
    } else {
      const supabase = getSupabaseAdminClient();
      const { data: task, error: taskError } = await supabase.from("outreach_tasks").select("*").eq("id", taskId).maybeSingle();
      if (taskError) throw new Error(taskError.message);
      if (!task) throw new Error("Tarefa de abordagem não encontrada.");

      previousColumn = normalizeOutreachColumn(task.column_key);
      personId = task.person_id;

      const { error: updateError } = await supabase
        .from("outreach_tasks")
        .update({ column_key: nextColumn, updated_at: new Date().toISOString() })
        .eq("id", taskId);
      if (updateError) throw new Error(updateError.message);

      const { data: person, error: personReadError } = await supabase.from("ig_people").select("status").eq("id", task.person_id).maybeSingle();
      if (personReadError) throw new Error(personReadError.message);
      const personUpdate: TableUpdate<"ig_people"> = {
        status: mapBoardColumnToPersonStatus(nextColumn, (person?.status as PersonStatus | null) ?? "novo"),
        updated_at: new Date().toISOString(),
      };
      if (boardColumnNeedsDoNotContactReason(nextColumn)) {
        personUpdate.do_not_contact_reason = "Marcado manualmente no quadro de abordagem.";
      }
      const { error: personError } = await supabase.from("ig_people").update(personUpdate).eq("id", task.person_id);
      if (personError) throw new Error(personError.message);
    }

    await writeAuditLog({
      actorId: actor.id,
      actorEmail: actor.email ?? null,
      action: "contact.outreach_task_updated",
      entityType: "outreach_tasks",
      entityId: taskId,
      summary: "Status da tarefa de abordagem atualizado.",
      metadata: { previousColumn, nextColumn, personId },
    });
    revalidatePath("/abordagem");
    revalidatePath("/pessoas");
    revalidatePath(`/pessoas/${personId}`);
    return { ok: true, message: "Status da tarefa atualizado." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao atualizar a tarefa.",
    };
  }
}

export async function upsertMessageTemplate(
  templateId: string | null,
  payload: Pick<MessageTemplate, "name" | "theme" | "body" | "category" | "whenToUse">,
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
            category: payload.category ?? null,
            whenToUse: payload.whenToUse ?? null,
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
          category: payload.category,
          when_to_use: payload.whenToUse,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from("message_templates").update(updatePayload).eq("id", templateId);
        if (error) throw new Error(error.message);
      } else {
        const insertPayload: TableInsert<"message_templates"> = {
          name: payload.name,
          theme: payload.theme,
          body: payload.body,
          category: payload.category,
          when_to_use: payload.whenToUse,
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

export async function assignPersonResponsible(personId: string, internalUserId: string | null): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  if (internalUserId !== null) validateId(internalUserId, "Usuário interno");
  
  return performAction({
    action: "contact.responsible_assigned",
    entityType: "ig_people",
    entityId: personId,
    summary: internalUserId ? "Responsável pela pessoa atribuído." : "Responsável pela pessoa removido.",
    metadata: { assignedTo: internalUserId },
    mutate: async () => {
      if (shouldUseMockData()) {
        updateMockPerson(personId, (p) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (p as any).responsibleId = internalUserId;
        });
        return;
      }
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("ig_people")
        .update({ responsible_id: internalUserId })
        .eq("id", personId);
      if (error) throw new Error(error.message);
    },
    revalidate: ["/pessoas", `/pessoas/${personId}`, "/abordagem"],
  });
}

export async function assumePersonResponsible(personId: string): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  
  return performAction({
    action: "contact.responsible_assigned",
    entityType: "ig_people",
    entityId: personId,
    summary: "Responsável pela pessoa atribuído (assumido).",
    mutate: async () => {
      const actor = await requireInternalSession();
      if (shouldUseMockData()) {
        updateMockPerson(personId, (p) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (p as any).responsibleId = actor.id;
        });
        return;
      }
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("ig_people")
        .update({ responsible_id: actor.id })
        .eq("id", personId);
      if (error) throw new Error(error.message);
    },
    revalidate: ["/pessoas", `/pessoas/${personId}`, "/abordagem"],
  });
}

export async function assignTaskResponsible(taskId: string, internalUserId: string | null): Promise<ActionResult> {
  validateId(taskId, "Tarefa");
  if (internalUserId !== null) validateId(internalUserId, "Usuário interno");
  
  return performAction({
    action: "outreach_task.responsible_assigned",
    entityType: "outreach_tasks",
    entityId: taskId,
    summary: internalUserId ? "Responsável pela tarefa atribuído." : "Responsável pela tarefa removido.",
    metadata: { assignedTo: internalUserId },
    mutate: async () => {
      if (shouldUseMockData()) {
        const task = mockTasks.find(t => t.id === taskId);
        if (task) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (task as any).responsibleId = internalUserId;
        }
        return;
      }
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("outreach_tasks")
        .update({ responsible_id: internalUserId })
        .eq("id", taskId);
      if (error) throw new Error(error.message);
    },
    revalidate: ["/abordagem"],
  });
}

export async function assumeTaskResponsible(taskId: string): Promise<ActionResult> {
  validateId(taskId, "Tarefa");
  
  return performAction({
    action: "outreach_task.responsible_assigned",
    entityType: "outreach_tasks",
    entityId: taskId,
    summary: "Responsável pela tarefa atribuído (assumido).",
    mutate: async () => {
      const actor = await requireInternalSession();
      if (shouldUseMockData()) {
        const task = mockTasks.find(t => t.id === taskId);
        if (task) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (task as any).responsibleId = actor.id;
        }
        return;
      }
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("outreach_tasks")
        .update({ responsible_id: actor.id })
        .eq("id", taskId);
      if (error) throw new Error(error.message);
    },
    revalidate: ["/abordagem", "/pessoas"],
  });
}

import type { PersonImportPreview } from "@/lib/data/import";

export async function executePersonImportBatch(previews: PersonImportPreview[]): Promise<ActionResult> {
  // Import dynamically to avoid circular dependencies if any
  const { getSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const { shouldUseMockData } = await import("@/lib/config");

  return performAction({
    action: "contact.imported",
    entityType: "ig_people",
    entityId: null,
    summary: `Importação em lote de ${previews.length} pessoas executada.`,
    metadata: { importedCount: previews.length },
    mutate: async () => {
      if (shouldUseMockData()) {
        return; // Mock import not supported yet, just skip
      }

      const supabase = getSupabaseAdminClient();
      const validPreviews = previews.filter(p => !p.hasErrors);

      for (const preview of validPreviews) {
        if (preview.isDuplicate && preview.existingId) {
          // Update existing
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updates: any = { updated_at: new Date().toISOString() };
          if (preview.displayName) updates.display_name = preview.displayName;
          if (preview.themes && preview.themes.length > 0) updates.themes = preview.themes;
          if (preview.doNotContactReason) updates.do_not_contact_reason = preview.doNotContactReason;
          if (preview.notes) updates.notes = preview.notes;
          if (preview.status !== "novo" && preview.status !== "nao_abordar") updates.status = preview.status;

          await supabase.from("ig_people").update(updates).eq("id", preview.existingId);
        } else if (preview.isNew) {
          // Insert new
          const { data, error } = await supabase.from("ig_people").insert({
            username: preview.username,
            display_name: preview.displayName,
            themes: preview.themes,
            status: preview.status,
            notes: preview.notes || "",
            do_not_contact_reason: preview.doNotContactReason,
            total_interactions: 0,
          }).select("id").single();

          if (error) continue; // Skip on error

          // Create task if it's hot or aborda hoje
          if (data && (preview.status === "responder" || preview.temperature === "quente")) {
            await supabase.from("outreach_tasks").insert({
              person_id: data.id,
              column_key: "para_abordar",
              title: "Abordagem Inicial (Importação)",
              notes: preview.priorityReason || "Importado com prioridade alta.",
            });
          }
        }
      }
    },
    revalidate: ["/pessoas", "/abordagem"],
  });
}

export async function getPersonInteractionsAction(personId: string) {
  const { listInteractions } = await import("@/lib/data/interactions");
  return listInteractions(personId);
}

export async function listFieldAgendaEventsAction() {
  const { listFieldAgendaEvents } = await import("@/lib/data/field-agenda");
  return listFieldAgendaEvents({ status: "planned" });
}

export async function trackOperationalEvent(
  event: string,
  personId?: string,
  metadata?: Json
): Promise<ActionResult> {
  return performAction({
    action: "telemetry.event_recorded",
    entityType: "operational_telemetry",
    entityId: personId || null,
    summary: `Evento operacional registrado: ${event}`,
    metadata: {
      ...((metadata as Record<string, unknown>) || {}),
      event,
      timestamp: new Date().toISOString()
    },
    mutate: async () => {}
  });
}

const PILOT_FEEDBACK_STATUSES: PilotFeedbackLoopStatus[] = ["novo", "em_analise", "resolvido", "adiado", "nao_sera_feito"];
const PILOT_FEEDBACK_ACTION_PLAN_TITLE = "Correções rápidas de feedback";

type PilotFeedbackSubmission = {
  id: string;
  metadata: {
    type?: string;
    route?: string;
    description?: string;
    urgency?: "low" | "medium" | "high";
  } | null;
};

function assertPilotFeedbackStatus(status: string): asserts status is PilotFeedbackLoopStatus {
  if (!PILOT_FEEDBACK_STATUSES.includes(status as PilotFeedbackLoopStatus)) {
    throw new Error("Status de feedback inválido.");
  }
}

async function getPilotFeedbackSubmission(feedbackId: string): Promise<PilotFeedbackSubmission> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, metadata")
    .eq("id", feedbackId)
    .eq("entity_type", "pilot_feedback")
    .eq("action", "pilot.feedback_submitted")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Feedback não encontrado.");
  return data as PilotFeedbackSubmission;
}

async function getExistingPilotFeedbackTask(feedbackId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id")
    .eq("entity_type", "pilot_feedback")
    .eq("entity_id", feedbackId)
    .eq("action", "pilot.feedback_converted_to_task")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function ensurePilotFeedbackActionPlan(actor: { actorId: string; actorEmail: string | null }) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("action_plans")
    .select("id")
    .eq("title", PILOT_FEEDBACK_ACTION_PLAN_TITLE)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data?.id) return data.id;

  const plan = await createActionPlan({
    title: PILOT_FEEDBACK_ACTION_PLAN_TITLE,
    description: "Backlog leve para correções rápidas e dúvidas recorrentes vindas da Voz da Equipe.",
    status: "active",
    priority: "medium",
    topic_id: null,
    created_by: actor.actorId,
    created_by_email: actor.actorEmail,
    metadata: {
      source: "pilot_feedback_loop",
      kind: "feedback_fast_fix",
    },
  });

  return plan.id;
}

export async function submitPilotFeedback(payload: {
  type: string;
  route: string;
  description: string;
  urgency: "low" | "medium" | "high";
}): Promise<ActionResult> {
  if (!payload.description.trim()) throw new Error("Descrição é obrigatória.");
  
  return performAction({
    action: "pilot.feedback_submitted",
    entityType: "pilot_feedback",
    entityId: null,
    summary: `Feedback do piloto enviado: ${payload.type} em ${payload.route}`,
    metadata: {
      type: payload.type,
      route: payload.route,
      description: payload.description,
      urgency: payload.urgency,
      timestamp: new Date().toISOString()
    },
    mutate: async () => {
      // O mutate é intencionalmente vazio pois o feedback é persistido no audit_log
      // através da função performAction.
    },
    revalidate: ["/relatorios", "/relatorios/feedback-piloto"]
  });
}

export async function updatePilotFeedbackStatus(feedbackId: string, status: PilotFeedbackLoopStatus): Promise<ActionResult> {
  validateId(feedbackId, "Feedback");
  assertPilotFeedbackStatus(status);

  return performAction({
    action: "pilot.feedback_status_changed",
    entityType: "pilot_feedback",
    entityId: feedbackId,
    summary: `Feedback movido para ${status}.`,
    metadata: { status },
    mutate: async () => {
      await requireRole(["admin", "operador", "comunicacao"]);
      await getPilotFeedbackSubmission(feedbackId);
    },
    revalidate: ["/relatorios", "/ritmo"],
  });
}

export async function convertPilotFeedbackToTechnicalTask(feedbackId: string): Promise<ActionResult> {
  validateId(feedbackId, "Feedback");

  return performAction({
    action: "pilot.feedback_converted_to_task",
    entityType: "pilot_feedback",
    entityId: feedbackId,
    summary: "Feedback convertido em tarefa técnica.",
    metadata: await (async () => {
      const actor = await requireActor();
      await requireRole(["admin", "operador", "comunicacao"]);
      const existingTask = await getExistingPilotFeedbackTask(feedbackId);
      if (existingTask) throw new Error("Este feedback já foi transformado em tarefa técnica.");

      const submission = await getPilotFeedbackSubmission(feedbackId);
      const submissionMetadata = submission.metadata ?? {};
      const planId = await ensurePilotFeedbackActionPlan(actor);
      const category = getPilotFeedbackCategory(submissionMetadata.type ?? "ux_confuso");
      const item = await createActionPlanItem({
        action_plan_id: planId,
        type: "encaminhamento",
        title: `Resolver feedback: ${getPilotFeedbackTypeLabel(submissionMetadata.type ?? "ux_confuso")}`,
        description: [
          `Categoria: ${getPilotFeedbackCategoryLabel(category)}`,
          `Rota: ${submissionMetadata.route ?? "rota não informada"}`,
          `Urgência: ${submissionMetadata.urgency ?? "medium"}`,
          "",
          submissionMetadata.description ?? "Sem descrição informada.",
        ].join("\n"),
        status: "todo",
        metadata: {
          source: "pilot_feedback_loop",
          feedbackId,
          feedbackType: submissionMetadata.type ?? "ux_confuso",
          route: submissionMetadata.route ?? null,
        },
      });

      return {
        actionPlanId: planId,
        actionPlanItemId: item.id,
        status: "em_analise",
      } satisfies Json;
    })(),
    mutate: async () => {},
    revalidate: ["/relatorios", "/acoes", "/ritmo"],
  });
}

export async function exportPilotFeedbackToRetrospective(feedbackId: string): Promise<ActionResult> {
  validateId(feedbackId, "Feedback");

  return performAction({
    action: "pilot.feedback_exported_to_retrospective",
    entityType: "pilot_feedback",
    entityId: feedbackId,
    summary: "Feedback exportado para retrospectiva.",
    metadata: { exportedAt: new Date().toISOString() },
    mutate: async () => {
      await requireRole(["admin", "operador", "comunicacao"]);
      await getPilotFeedbackSubmission(feedbackId);
    },
    revalidate: ["/relatorios", "/ritmo"],
  });
}

export async function convertToVolunteerAction(personId: string, options?: { 
  consentPurpose?: string,
  source?: "formulario" | "evento_campo" | "indicacao" | "outro"
}): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  return performAction({
    action: "person.converted_to_volunteer",
    entityType: "campaign_volunteers",
    entityId: personId,
    summary: "Pessoa convertida em voluntário com consentimento.",
    mutate: async () => {
      const actor = await requireRole(["admin", "operador"]);
      const supabase = getSupabaseAdminClient();
      
      // 1. Verificar se a pessoa tem consentimento
      const { data: contact } = await supabase.from("contacts").select("*").eq("person_id", personId).maybeSingle();
      
      if (!contact || !contact.consent_given) {
        throw new Error("Consentimento explícito não encontrado. O voluntariado exige registro de consentimento prévio.");
      }

      // 2. Buscar dados da pessoa para preencher o voluntário
      const { data: person } = await supabase.from("ig_people").select("*").eq("id", personId).single();
      if (!person) throw new Error("Pessoa não encontrada.");

      // 3. Criar registro de voluntário
      const { error: volunteerError } = await supabase.from("campaign_volunteers").insert({
        display_name: person.display_name || person.username || "Voluntário Convertido",
        consent_to_contact: true,
        consent_to_store_data: true,
        status: "novo",
        source: options?.source || "evento_campo",
        contact_phone: contact.phone,
        contact_email: contact.email,
        contact_preference: contact.phone ? "whatsapp" : (contact.email ? "email" : "nenhum"),
        metadata: { 
          original_person_id: personId,
          converted_by: actor.id,
          conversion_date: new Date().toISOString()
        }
      });

      if (volunteerError) throw volunteerError;

      // 4. Marcar na ficha da pessoa
      const currentThemes = person.themes || [];
      if (!currentThemes.includes("voluntario_convertido")) {
        await supabase.from("ig_people").update({
          themes: [...currentThemes, "voluntario_convertido"],
          updated_at: new Date().toISOString()
        }).eq("id", personId);
      }
    },
    revalidate: [`/pessoas/${personId}`, "/voluntarios"],
  });
}

export async function resolveDuplicateAction(mainId: string, duplicateId: string, action: "archive" | "keep_separate"): Promise<ActionResult> {
  validateId(mainId, "Perfil Principal");
  validateId(duplicateId, "Perfil Duplicado");
  
  return performAction({
    action: "person.duplicate_resolved",
    entityType: "ig_people",
    entityId: mainId,
    summary: `Duplicata resolvida (${action === "archive" ? "arquivado" : "mantido separado"})`,
    metadata: { duplicateId, action },
    mutate: async () => {
      await requireRole(["admin"]);
      const supabase = getSupabaseAdminClient();
      
      if (action === "archive") {
        const { error } = await supabase
          .from("ig_people")
          .update({ 
            status: "nao_abordar",
            notes: `Arquivado como duplicata de ${mainId}.`,
            updated_at: new Date().toISOString()
          })
          .eq("id", duplicateId);
        if (error) throw error;
      }
    },
    revalidate: ["/relatorios", "/pessoas"]
  });
}

export async function updatePersonUsernameAction(personId: string, newUsername: string): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  const cleaned = newUsername.trim().toLowerCase().replace("@", "");
  if (!cleaned) throw new Error("Username inválido.");

  return performAction({
    action: "person.username_updated",
    entityType: "ig_people",
    entityId: personId,
    summary: `Username atualizado para @${cleaned}`,
    mutate: async () => {
      await requireRole(["admin", "operador"]);
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("ig_people")
        .update({ 
          username: cleaned,
          updated_at: new Date().toISOString()
        })
        .eq("id", personId);
      if (error) throw error;
    },
    revalidate: [`/pessoas/${personId}`, "/relatorios"]
  });
}

export async function updatePersonThemeAction(personId: string, themes: string[]): Promise<ActionResult> {
  validateId(personId, "Pessoa");
  validateTags(themes);

  return performAction({
    action: "person.theme_updated_assisted",
    entityType: "ig_people",
    entityId: personId,
    summary: `Temas atualizados: ${themes.join(", ")}`,
    mutate: async () => {
      await requireRole(["admin", "operador"]);
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("ig_people")
        .update({ 
          themes,
          updated_at: new Date().toISOString()
        })
        .eq("id", personId);
      if (error) throw error;
    },
    revalidate: [`/pessoas/${personId}`, "/relatorios"]
  });
}

export async function assignPeopleBatchAction(personIds: string[], responsibleId: string): Promise<ActionResult> {
  if (!Array.isArray(personIds) || personIds.length === 0) throw new Error("Nenhuma pessoa selecionada.");
  validateId(responsibleId, "Responsável");

  return performAction({
    action: "person.batch_assignment_completed",
    entityType: "ig_people",
    entityId: null,
    summary: `Atribuição em lote realizada para ${personIds.length} pessoas.`,
    metadata: { personIds, responsibleId },
    mutate: async () => {
      await requireRole(["admin"]);
      const supabase = getSupabaseAdminClient();
      
      // Filtramos pessoas que estão como "Não Abordar" para proteção adicional
      const { data: people } = await supabase
        .from("ig_people")
        .select("id, status")
        .in("id", personIds);
      
      const safeIds = people?.filter(p => p.status !== "nao_abordar").map(p => p.id) || [];
      
      if (safeIds.length === 0) throw new Error("Nenhuma pessoa elegível para atribuição (perfis 'Não Abordar' protegidos).");

      const { error } = await supabase
        .from("ig_people")
        .update({ 
          responsible_id: responsibleId,
          updated_at: new Date().toISOString()
        })
        .in("id", safeIds);
        
      if (error) throw error;
    },
    revalidate: ["/pessoas", "/relatorios"]
  });
}
