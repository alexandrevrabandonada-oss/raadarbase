"use server";

import { shouldUseMockData } from "@/lib/config";
import { messageTemplates as mockTemplates } from "@/lib/mock-data";
import { requireRole } from "@/lib/authz/roles";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MessageTemplate } from "@/lib/types";
import type { TableInsert, TableUpdate } from "@/lib/supabase/database.types";
import { type ActionResult, validateId, performAction } from "./utils";

function validateMessagePayload(payload: Pick<MessageTemplate, "name" | "theme" | "body">) {
  if (!payload.name.trim()) throw new Error("Nome do modelo é obrigatório.");
  if (!payload.body.trim()) throw new Error("Texto do modelo é obrigatório.");
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
