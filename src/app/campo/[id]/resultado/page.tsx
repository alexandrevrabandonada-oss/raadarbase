import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getFieldAgendaEvent } from "@/lib/data/field-agenda";
import { notFound } from "next/navigation";
import { createEventResultAction } from "../actions";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

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
            <form action={createEventResultAction.bind(null, event.id)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Resumo do que aconteceu</label>
                <textarea
                  name="resultSummary"
                  rows={5}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Quais foram os principais pontos discutidos? Qual foi o sentimento do bairro sobre a pauta?"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Estimativa de Pessoas Presentes</label>
                <input
                  name="estimatedPeopleCount"
                  type="number"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Ex: 25"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Próximos Passos</label>
                <textarea
                  name="nextSteps"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="O que deve ser feito após este evento? (ex: novo relatório, resposta pública)"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                 <button type="button" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    Cancelar
                 </button>
                 <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    Salvar Resultado
                 </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
