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

      <div className="mx-auto max-w-2xl">
        <Alert className="mb-6 border-blue-200 bg-blue-50/60">
          <ShieldAlert className="h-4 w-4 text-blue-600" />
          <AlertTitle>Aviso de Governança</AlertTitle>
          <AlertDescription className="text-xs">
            Esta agenda organiza ações públicas e coletivas. **Não use para abordar pessoas individualmente sem consentimento.** 
            O registro de nomes ou dados sensíveis de participantes não é permitido nesta etapa.
          </AlertDescription>
        </Alert>

        <Card className="rounded-2xl border-[#e2d7c4]">
          <CardHeader>
            <CardTitle className="text-base">Dados do Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createFieldAgendaEventAction} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título do Evento</label>
                <input
                  name="title"
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Ex: Roda de Escuta - Bairro Centro"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <select
                    name="type"
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Ex: Centro"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Pauta Relacionada (Slug)</label>
                <input
                  name="topicSlug"
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Ex: transporte-publico"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data/Hora Início</label>
                  <input
                    name="startsAt"
                    type="datetime-local"
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data/Hora Fim</label>
                  <input
                    name="endsAt"
                    type="datetime-local"
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Local (Texto)</label>
                <input
                  name="locationText"
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Ex: Praca, feira ou ponto coletivo"
                />
                <p className="text-xs text-muted-foreground">Prefira descrever o local coletivo sem expor dados pessoais desnecessarios.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição / Objetivos</label>
                <textarea
                  name="description"
                  rows={4}
                  className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Descreva o que será feito e qual o objetivo coletivo da ação."
                />
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                 <button type="button" className="inline-flex h-12 items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-base font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:h-10 sm:text-sm">
                    Cancelar
                 </button>
                 <button type="submit" className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-4 py-2 text-base font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:h-10 sm:text-sm">
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
