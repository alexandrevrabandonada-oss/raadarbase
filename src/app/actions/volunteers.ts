"use server";

import { requireRole } from "@/lib/authz/roles";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { outreachTasks as mockTasks } from "@/lib/mock-data";
import type { PersonImportPreview } from "@/lib/data/import";
import { type ActionResult, validateId, performAction, updateMockPerson } from "./utils";

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
      await requireRole(["admin", "operador"]);
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
      const actor = await requireRole(["admin", "operador"]);
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
      await requireRole(["admin", "operador"]);
      if (shouldUseMockData()) {
        const task = mockTasks.find((t) => t.id === taskId);
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
      const actor = await requireRole(["admin", "operador"]);
      if (shouldUseMockData()) {
        const task = mockTasks.find((t) => t.id === taskId);
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
      await requireRole(["admin", "operador"]);
      if (shouldUseMockData()) {
        return; // Mock import not supported yet, just skip
      }

      const supabase = getSupabaseAdminClient();
      const validPreviews = previews.filter((p) => !p.hasErrors);

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
          const { data, error } = await supabase
            .from("ig_people")
            .insert({
              username: preview.username,
              display_name: preview.displayName,
              themes: preview.themes,
              status: preview.status,
              notes: preview.notes || "",
              do_not_contact_reason: preview.doNotContactReason,
              total_interactions: 0,
            })
            .select("id")
            .single();

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

export async function convertToVolunteerAction(
  personId: string,
  options?: {
    consentPurpose?: string;
    source?: "formulario" | "evento_campo" | "indicacao" | "outro";
  },
): Promise<ActionResult> {
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
        throw new Error(
          "Consentimento explícito não encontrado. O voluntariado exige registro de consentimento prévio.",
        );
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
        contact_preference: contact.phone ? "whatsapp" : contact.email ? "email" : "nenhum",
        metadata: {
          original_person_id: personId,
          converted_by: actor.id,
          conversion_date: new Date().toISOString(),
        },
      });

      if (volunteerError) throw volunteerError;

      // 4. Marcar na ficha da pessoa
      const currentThemes = person.themes || [];
      if (!currentThemes.includes("voluntario_convertido")) {
        await supabase
          .from("ig_people")
          .update({
            themes: [...currentThemes, "voluntario_convertido"],
            updated_at: new Date().toISOString(),
          })
          .eq("id", personId);
      }
    },
    revalidate: [`/pessoas/${personId}`, "/voluntarios"],
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
      const { data: people } = await supabase.from("ig_people").select("id, status").in("id", personIds);

      const safeIds = people?.filter((p) => p.status !== "nao_abordar").map((p) => p.id) || [];

      if (safeIds.length === 0) {
        throw new Error("Nenhuma pessoa elegível para atribuição (perfis 'Não Abordar' protegidos).");
      }

      const { error } = await supabase
        .from("ig_people")
        .update({
          responsible_id: responsibleId,
          updated_at: new Date().toISOString(),
        })
        .in("id", safeIds);

      if (error) throw error;
    },
    revalidate: ["/pessoas", "/relatorios"],
  });
}
