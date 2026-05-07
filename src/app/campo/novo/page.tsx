import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createFieldAgendaEventAction } from "./actions";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewFieldEventPage() {
  await requireInternalPageSession("/campo/novo");
  await requireRole(["admin", "operador", "comunicacao"]);

  return (
    <AppShell>
      <PageHeader
        title="Nova Ação de Campo"
        description="Planeje uma atividade presencial ou pública conectada à escuta territorial."
      />

      <div className="max-w-2xl mx-auto">
        <Alert className="mb-6 border-blue-200 bg-blue-50/60">
          <ShieldAlert className="h-4 w-4 text-blue-600" />
          <AlertTitle>Aviso de Governança</AlertTitle>
          <AlertDescription className="text-xs">
            Esta agenda organiza ações públicas e coletivas. **Não use para abordar pessoas individualmente sem consentimento.** 
            O registro de nomes ou dados sensíveis de participantes não é permitido nesta etapa.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createFieldAgendaEventAction} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título do Evento</label>
                <input
                  name="title"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Ex: Roda de Escuta - Bairro Centro"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <select
                    name="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="roda_escuta">Roda de Escuta</option>
                    <option value="reuniao">Reunião</option>
                    <option value="plenaria">Plenária</option>
                    <option value="panfletagem">Panfletagem</option>
                    <option value="visita_bairro">Visita de Bairro</option>
                    <option value="visita_institucional">Visita Institucional</option>
                    <option value="live">Live</option>
                    <option value="mutirao_conversa">Mutirão de Conversa</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bairro</label>
                  <input
                    name="neighborhood"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Ex: Centro"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Pauta Relacionada (Slug)</label>
                <input
                  name="topicSlug"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Ex: transporte-publico"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data/Hora Início</label>
                  <input
                    name="startsAt"
                    type="datetime-local"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data/Hora Fim</label>
                  <input
                    name="endsAt"
                    type="datetime-local"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Local (Texto)</label>
                <input
                  name="locationText"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Ex: Praça da Matriz, 123"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição / Objetivos</label>
                <textarea
                  name="description"
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Descreva o que será feito e qual o objetivo coletivo da ação."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                 <button type="button" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    Cancelar
                 </button>
                 <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    Salvar Evento
                 </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
