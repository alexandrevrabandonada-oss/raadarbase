import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ConfirmOutreachDeliveryInput = {
  personId: string;
  actorId: string;
  actorEmail: string | null;
  origin: string;
  templateId?: string | null;
  sentAt?: string;
};

export type OutreachDeliveryConfirmation = {
  recorded: boolean;
  sentAt: string;
};

/**
 * Confirma uma primeira DM em uma única transação do banco.
 * A PK do ledger torna a operação idempotente mesmo com retorno duplicado,
 * retry offline ou dois operadores confirmando ao mesmo tempo.
 */
export async function confirmOutreachDelivery(
  input: ConfirmOutreachDeliveryInput,
): Promise<OutreachDeliveryConfirmation> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("confirm_outreach_delivery", {
    p_person_id: input.personId,
    p_actor_id: input.actorId,
    p_actor_email: input.actorEmail ?? "",
    p_origin: input.origin.trim(),
    p_template_id: input.templateId?.trim() || undefined,
    p_sent_at: input.sentAt,
  });

  if (error) throw new Error(error.message);
  const result = data?.[0];
  if (!result?.sent_at) throw new Error("A confirmação de envio não retornou recibo.");

  return {
    recorded: result.recorded,
    sentAt: result.sent_at,
  };
}

export async function listDeliveredPersonIds(personIds: string[]) {
  if (personIds.length === 0) return new Set<string>();

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("outreach_delivery_ledger")
    .select("person_id")
    .in("person_id", personIds);
  if (error) throw new Error(error.message);

  return new Set((data ?? []).map((delivery) => delivery.person_id));
}
