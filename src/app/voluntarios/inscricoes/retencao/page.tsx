import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getVolunteerApplicationRetentionSummary } from "@/lib/data/volunteer-application-retention";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import {
  bulkRedactVolunteerApplicationsAction,
  bulkScheduleVolunteerApplicationRedactionAction,
} from "../../actions";

export const dynamic = "force-dynamic";

function ApplicationTable({ title, items, empty }: { title: string; items: Awaited<ReturnType<typeof getVolunteerApplicationRetentionSummary>>["pendingOld"]; empty: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Retenção</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.displayName}</TableCell>
                  <TableCell><Badge variant="outline">{item.status}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{item.retentionStatus}</Badge></TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell><Link className="font-semibold underline" href={`/voluntarios/inscricoes/${item.id}`}>Ver detalhe</Link></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default async function VolunteerApplicationRetentionPage() {
  const session = await requireInternalPageSession("/voluntarios/inscricoes/retencao");
  const summary = await getVolunteerApplicationRetentionSummary();
  const isAdmin = session.internalUser.role === "admin";

  return (
    <AppShell>
      <PageHeader
        title="Retenção de inscrições"
        description="Anonimização controlada de inscrições públicas antigas, rejeitadas ou arquivadas, sem apagar histórico operacional."
        action={<Button nativeButton={false} variant="outline" render={<Link href="/voluntarios/inscricoes" />}>Voltar para fila</Button>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle>Elegíveis</CardTitle></CardHeader><CardContent className="text-3xl font-black">{summary.eligibleForRedactionCount}</CardContent></Card>
        <Card><CardHeader><CardTitle>Agendadas</CardTitle></CardHeader><CardContent className="text-3xl font-black">{summary.scheduledRedactionCount}</CardContent></Card>
        <Card><CardHeader><CardTitle>Anonimizadas</CardTitle></CardHeader><CardContent className="text-3xl font-black">{summary.redactedCount}</CardContent></Card>
        <Card><CardHeader><CardTitle>Retidas</CardTitle></CardHeader><CardContent className="text-3xl font-black">{summary.retainedCount}</CardContent></Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Ações em massa</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <form action={bulkScheduleVolunteerApplicationRedactionAction} className="space-y-3">
            <input type="hidden" name="retentionStatus" value="active" />
            <select name="status" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" defaultValue="rejected">
              <option value="rejected">Rejeitadas elegíveis</option>
              <option value="archived">Arquivadas elegíveis</option>
            </select>
            <Input name="reason" placeholder="Justificativa operacional obrigatória" required />
            <Button type="submit" variant="outline">Agendar anonimização elegível</Button>
          </form>
          {isAdmin ? (
            <form action={bulkRedactVolunteerApplicationsAction} className="space-y-3">
              <select name="status" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" defaultValue="rejected">
                <option value="rejected">Rejeitadas elegíveis</option>
                <option value="archived">Arquivadas elegíveis</option>
              </select>
              <Input name="reason" placeholder="Justificativa operacional obrigatória" required />
              <Button type="submit">Anonimizar agora</Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">A anonimização imediata em massa exige perfil admin.</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6">
        <ApplicationTable title="Pendentes antigas" items={summary.pendingOld} empty="Nenhuma pendente acima de 90 dias." />
        <ApplicationTable title="Rejeitadas elegíveis" items={summary.rejectedEligible} empty="Nenhuma rejeitada acima de 30 dias elegível." />
        <ApplicationTable title="Arquivadas elegíveis" items={summary.archivedEligible} empty="Nenhuma arquivada acima de 30 dias elegível." />
        <ApplicationTable title="Retidas por justificativa" items={summary.retained} empty="Nenhuma inscrição retida por justificativa." />
        <ApplicationTable title="Anonimizadas" items={summary.redacted} empty="Nenhuma inscrição anonimizada." />
        <ApplicationTable title="Anonimização agendada" items={summary.scheduled} empty="Nenhuma anonimização agendada." />
      </div>
    </AppShell>
  );
}
