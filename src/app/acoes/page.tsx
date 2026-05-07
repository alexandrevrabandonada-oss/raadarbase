import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listActionPlans } from "@/lib/data/action-plans";
import { ClipboardList, Plus, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AcoesPage() {
  await requireInternalPageSession("/acoes");

  const plans = await listActionPlans();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "done": return "secondary"; // Note: 'success' variant doesn't typically exist in default shadcn badge, using secondary
      case "archived": return "outline";
      case "draft": return "outline";
      default: return "outline";
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Plano de Ação por Pauta"
        description="Transforme relatórios de mobilização em ações concretas: posts, reuniões, plenárias e encaminhamentos."
      />

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-sm text-muted-foreground flex items-center bg-muted/50 p-3 rounded-lg border border-dashed">
          <AlertCircle className="h-4 w-4 mr-2 text-primary" />
          Planos organizam respostas públicas. Não use para segmentação individual ou perfilamento.
        </div>
        <Button nativeButton={false} render={<Link href="/acoes/novo" />}>
          <Plus className="mr-2 h-4 w-4" /> Novo Plano
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título / Tema</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link href={`/acoes/${plan.id}`} className="font-semibold flex items-center hover:underline">
                        <ClipboardList className="mr-2 h-4 w-4 text-muted-foreground" />
                        {plan.title}
                      </Link>
                      <span className="text-xs text-muted-foreground ml-6">
                        {plan.topic?.name || "Sem tema vinculado"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(plan.status)}>
                      {plan.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(plan.priority)}>
                      {plan.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {plan.itemCount} item(s)
                  </TableCell>
                  <TableCell className="text-xs">
                    {plan.due_date || "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/acoes/${plan.id}`} />}>
                      Gerenciar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Nenhum plano de ação ativo.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
