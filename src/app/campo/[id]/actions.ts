"use server";

import { revalidatePath } from "next/cache";
import { markFieldAgendaEventDone, createFieldAgendaEventResult } from "@/lib/data/field-agenda";
import { getInternalSession } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";

export async function markEventDoneAction(id: string) {
  const session = await getInternalSession();
  if (!session) throw new Error("Não autorizado");

  await markFieldAgendaEventDone(id, { id: session.id, email: session.email });

  revalidatePath(`/campo/${id}`);
  revalidatePath("/campo");
}

export async function createEventResultAction(eventId: string, formData: FormData) {
    const session = await getInternalSession();
    if (!session) throw new Error("Não autorizado");

    const resultSummary = formData.get("resultSummary") as string;
    const estimatedPeopleCount = parseInt(formData.get("estimatedPeopleCount") as string) || 0;
    const nextSteps = formData.get("nextSteps") as string;

    await createFieldAgendaEventResult({
        eventId,
        resultSummary,
        estimatedPeopleCount,
        nextSteps,
    }, { id: session.id, email: session.email });

    revalidatePath(`/campo/${eventId}`);
    redirect(`/campo/${eventId}`);
}
