import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { messageTemplates as mockTemplates } from "@/lib/mock-data";
import type { MessageTemplate } from "@/lib/types";
import { handleSupabaseReadError } from "./utils";

export async function listMessageTemplates(): Promise<MessageTemplate[]> {
  if (shouldUseMockData()) return mockTemplates;
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from("message_templates").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((template) => ({
      id: template.id,
      name: template.name,
      theme: template.theme ?? "",
      body: template.body,
      active: template.active,
      updatedAt: template.updated_at,
    }));
  } catch (error) {
    handleSupabaseReadError("listMessageTemplates", error);
  }
}
