import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MobileBatchListenForm } from "./mobile-batch-listen-form";
import { getInternalSession, requireInternalPageSession } from "@/lib/supabase/auth";
import { listFieldAgendaEvents } from "@/lib/data/field-agenda";

export const dynamic = "force-dynamic";

export default async function EscutasLotePage() {
  await requireInternalPageSession("/escutas/lote");
  const [session, fieldEvents] = await Promise.all([
    getInternalSession(),
    listFieldAgendaEvents().catch(() => []),
  ]);

  const actionOptions = fieldEvents.slice(0, 12).map((event) => ({
    id: event.id,
    title: event.title,
    neighborhood: event.neighborhood,
    startsAt: event.startsAt,
  }));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Modo mobile operacional"
        title="Digitar fichas com poucos toques."
        description="Sessao de campo para registrar escutas no celular com contexto de acao, privacidade e continuidade de digitacao."
        actions={<Button nativeButton={false} render={<Link href="/escutas" />}>Revisar escutas</Button>}
      />

      <Alert className="mb-5 border-[#dcc9aa] bg-[#fff7e9]">
        <AlertTitle>Fluxo recomendado no celular</AlertTitle>
        <AlertDescription>
          Selecione a acao e o entrevistador antes de comecar. O rascunho desta tela fica apenas neste aparelho.
          O envio cria a escuta na base atual sem alterar schema ou regras de revisao.
        </AlertDescription>
      </Alert>

      <MobileBatchListenForm actionOptions={actionOptions} defaultInterviewer={session?.email ?? ""} />
    </AppShell>
  );
}
