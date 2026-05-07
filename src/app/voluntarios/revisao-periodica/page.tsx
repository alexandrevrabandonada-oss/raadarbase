import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getVolunteerReviewDashboard } from "@/lib/data/volunteer-review-dashboard";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import {
  archiveVolunteerReviewRoundAction,
  completeVolunteerReviewRoundAction,
  createVolunteerReviewRoundAction,
} from "../actions";

export const dynamic = "force-dynamic";

const checklist = [
  "revisar pendentes novas",
  "revisar pendentes antigas",
  "resolver inscrições com consentimento incompleto",
  "anonimizar rejeitadas antigas",
  "revisar retidas",
  "exportar relatório agregado, se necessário",
  "registrar decisão da equipe",
];

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="text-3xl font-black">{value}</CardContent>
    </Card>
  );
}

export default async function VolunteerReviewDashboardPage() {
  const session = await requireInternalPageSession("/voluntarios/revisao-periodica");
  const dashboard = await getVolunteerReviewDashboard();
  const canManageRounds = session.internalUser.role === "admin" || session.internalUser.role === "operador";

  return (
    <AppShell>
      <PageHeader
        title="Revisão periódica de voluntariado"
        description="Alertas internos, agregados e operacionais. Nenhum contato é feito automaticamente."
        action={
          <div className="flex gap-2">
            <Button nativeButton={false} variant="outline" render={<Link href="/api/voluntarios/revisao-periodica/export" />}>Exportar agregado</Button>
            <Button nativeButton={false} variant="outline" render={<Link href="/voluntarios/inscricoes" />}>Ver inscrições</Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard title="Pending +7d" value={dashboard.pending7d.length} />
        <MetricCard title="Pending +30d" value={dashboard.pending30d.length} />
        <MetricCard title="Pending +90d" value={dashboard.pending90d.length} />
        <MetricCard title="Rejected elegíveis" value={dashboard.rejectedEligible.length} />
        <MetricCard title="Archived elegíveis" value={dashboard.archivedEligible.length} />
        <MetricCard title="Redaction agendada" value={dashboard.redactionScheduled.length} />
        <MetricCard title="Retained" value={dashboard.retained.length} />
        <MetricCard title="Consentimento inválido" value={dashboard.consentIssues.length} />
        <MetricCard title="Sem bairro" value={dashboard.missingNeighborhood.length} />
        <MetricCard title="Sem habilidade/interesse" value={dashboard.missingSkillsOrInterests.length} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Checklist semanal de revisão</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {checklist.map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm">
                <input type="checkbox" />
                {item}
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Próximas ações recomendadas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {dashboard.recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum alerta operacional no momento.</p>
            ) : (
              dashboard.recommendations.map((item) => <Badge key={item} variant="outline">{item}</Badge>)
            )}
            <p className="pt-3 text-xs text-muted-foreground">Proibido: mensagem automática, score político, classificação individual, inferência de voto ou criação automática de contato.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Rodada de revisão</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            Última rodada: {dashboard.latestRound ? (
              <span><strong>{dashboard.latestRound.title}</strong> <Badge variant="outline">{dashboard.latestRound.status}</Badge></span>
            ) : "nenhuma rodada registrada"}
          </div>
          {canManageRounds ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <form action={createVolunteerReviewRoundAction} className="space-y-3">
                <Input name="title" placeholder="Título da rodada" required />
                <Textarea name="notes" placeholder="Notas operacionais sem PII" />
                <Button type="submit">Criar rodada</Button>
              </form>
              {dashboard.latestRound && dashboard.latestRound.status === "open" ? (
                <form action={completeVolunteerReviewRoundAction.bind(null, dashboard.latestRound.id)} className="grid gap-2 md:grid-cols-3">
                  <Input name="reviewedPendingCount" type="number" placeholder="Pendentes" defaultValue={0} />
                  <Input name="approvedCount" type="number" placeholder="Aprovadas" defaultValue={0} />
                  <Input name="rejectedCount" type="number" placeholder="Rejeitadas" defaultValue={0} />
                  <Input name="archivedCount" type="number" placeholder="Arquivadas" defaultValue={0} />
                  <Input name="redactedCount" type="number" placeholder="Anonimizadas" defaultValue={0} />
                  <Input name="retainedCount" type="number" placeholder="Retidas" defaultValue={0} />
                  <Textarea name="notes" className="md:col-span-3" placeholder="Resumo agregado da rodada" />
                  <Button type="submit">Concluir rodada</Button>
                  <Button type="submit" variant="outline" formAction={archiveVolunteerReviewRoundAction.bind(null, dashboard.latestRound.id)}>Arquivar</Button>
                </form>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Seu perfil permite visualização, sem alterar rodadas.</p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
