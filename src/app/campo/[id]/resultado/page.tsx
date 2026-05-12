import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getFieldAgendaEvent } from "@/lib/data/field-agenda";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { EventResultForm } from "./event-result-form";

export default async function EventResultPage({ params }: { params: { id: string } }) {
  await requireInternalPageSession(`/campo/${params.id}/resultado`);
  await requireRole(["admin", "operador", "comunicacao"]);

  const event = await getFieldAgendaEvent(params.id);
  if (!event) notFound();

  return (
    <AppShell>
      <PageHeader
        title="Registrar Resultado"
        description={`Evento: ${event.title}`}
      />

      <div className="max-w-2xl mx-auto">
        <Alert className="mb-6 border-blue-200 bg-blue-50/60">
          <ShieldAlert className="h-4 w-4 text-blue-600" />
          <AlertTitle>Registro Agregado</AlertTitle>
          <AlertDescription className="text-xs">
            Registre apenas conclusões coletivas, sentimentos gerais do bairro e pautas recorrentes. 
            **É expressamente proibido listar nomes de pessoas ou vincular falas específicas a perfis individuais.**
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conclusões da Atividade</CardTitle>
          </CardHeader>
          <CardContent>
            <EventResultForm eventId={event.id} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
