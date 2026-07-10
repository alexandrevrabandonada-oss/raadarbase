"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getInfluenceClient } from "@/lib/influence/db-types";
import { sanitizeText } from "@/lib/influence/sanitize";
import { requireInternalSession } from "@/lib/supabase/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function addInfluenceNote(formData: FormData) {
  const session = await requireInternalSession();
  const profileId = String(formData.get("profileId") ?? "");
  const body = sanitizeText(formData.get("body"), 2000);
  if (!UUID.test(profileId)) throw new Error("Perfil inválido.");
  if (!body) throw new Error("A observação não pode ficar vazia.");
  const supabase = getInfluenceClient();
  const saved = await supabase.from("instagram_profile_notes").insert({ profile_id: profileId, body, created_by: session.id, created_by_email: session.email }).select("id").single();
  if (saved.error) throw saved.error;
  await writeAuditLog({ actorId: session.id, actorEmail: session.email, action: "influence.note_created", entityType: "instagram_profiles", entityId: profileId, summary: "Observação adicionada ao perfil de influência.", metadata: { noteId: saved.data.id } });
  revalidatePath(`/dashboard/influencia/${profileId}`);
}

