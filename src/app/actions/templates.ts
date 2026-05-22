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
            isCampaignDefault: false,
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
          is_campaign_default: false,
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

export async function setCampaignDefaultTemplate(templateId: string): Promise<ActionResult> {
  validateId(templateId, "Modelo");
  return performAction({
    action: "message.updated",
    entityType: "message_templates",
    entityId: templateId,
    summary: "Modelo de mensagem de campanha atualizado.",
    mutate: async () => {
      await requireRole(["admin", "operador", "comunicacao"]);
      
      let wasDefault = false;
      if (shouldUseMockData()) {
        const template = mockTemplates.find((item) => item.id === templateId);
        wasDefault = template?.isCampaignDefault || false;
        mockTemplates.forEach((item) => {
          item.isCampaignDefault = item.id === templateId ? !wasDefault : false;
        });
        return;
      }
      
      const supabase = getSupabaseAdminClient();
      
      // 1. Verificar se o modelo alvo já é o padrão de campanha
      const { data: targetTemplate, error: fetchError } = await supabase
        .from("message_templates")
        .select("is_campaign_default")
        .eq("id", templateId)
        .single();
        
      if (fetchError) throw new Error(fetchError.message);
      wasDefault = targetTemplate?.is_campaign_default || false;
      
      // 2. Desativar destaque de campanha de todas as mensagens
      const { error: resetError } = await supabase
        .from("message_templates")
        .update({ is_campaign_default: false })
        .eq("is_campaign_default", true);
        
      if (resetError) throw new Error(resetError.message);
      
      // 3. Se não era o padrão, definir este como padrão agora
      if (!wasDefault) {
        const { error: setError } = await supabase
          .from("message_templates")
          .update({ is_campaign_default: true, updated_at: new Date().toISOString() })
          .eq("id", templateId);
          
        if (setError) throw new Error(setError.message);
      }
    },
    revalidate: ["/mensagens", "/minha-fila"],
  });
}
