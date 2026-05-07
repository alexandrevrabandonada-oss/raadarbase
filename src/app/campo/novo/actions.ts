"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createFieldAgendaEvent, FieldAgendaEventType } from "@/lib/data/field-agenda";
import { getInternalSession } from "@/lib/supabase/auth";

export async function createFieldAgendaEventAction(formData: FormData) {
  const session = await getInternalSession();
  if (!session) throw new Error("Não autorizado");

  const title = formData.get("title") as string;
  const type = formData.get("type") as FieldAgendaEventType;
  const description = formData.get("description") as string;
  const neighborhood = formData.get("neighborhood") as string;
  const topicSlug = formData.get("topicSlug") as string;
  const startsAt = formData.get("startsAt") as string;
  const endsAt = formData.get("endsAt") as string;
  const locationText = formData.get("locationText") as string;

  const event = await createFieldAgendaEvent({
    title,
    type,
    description,
    neighborhood,
    topicSlug,
    startsAt: startsAt || null,
    endsAt: endsAt || null,
    locationText,
    status: 'planned'
  }, { id: session.id, email: session.email });

  if (!event) throw new Error("Erro ao criar evento");

  revalidatePath("/campo");
  redirect(`/campo/${event.id}`);
}
