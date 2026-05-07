import { NextResponse } from "next/server";
import { getInternalSession } from "@/lib/supabase/auth";
import { listFieldAgendaEvents, getFieldAgendaEventResult } from "@/lib/data/field-agenda";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getInternalSession();
  if (!session) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const events = await listFieldAgendaEvents();
  
  // Agregando resultados para o export
  const exportData = await Promise.all(events.map(async (event) => {
    const result = event.status === 'done' ? await getFieldAgendaEventResult(event.id) : null;
    
    return {
      id: event.id,
      titulo: event.title,
      tipo: event.type,
      status: event.status,
      bairro: event.neighborhood,
      pauta: event.topicSlug,
      inicio: event.startsAt,
      fim: event.endsAt,
      local: event.locationText,
      resumo_resultado: result?.resultSummary || null,
      pessoas_estimadas: result?.estimatedPeopleCount || null,
      proximos_passos: result?.nextSteps || null,
      criado_em: event.createdAt
    };
  }));

  return NextResponse.json(exportData);
}
