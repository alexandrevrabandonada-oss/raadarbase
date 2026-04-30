/* eslint-disable @typescript-eslint/no-explicit-any */
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { getActionPlan } from "@/lib/data/action-plans";
import { KanbanBoard } from "./kanban-board";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Tag, FileText, AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDateTime } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function PlanoDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireInternalPageSession("/acoes/[id]");
  const { id } = await params;

  const plan = await getActionPlan(id);
  if (!plan) notFound();

  return (
    <AppShell>
      <PageHeader
        title={plan.title}
        description={plan.description || "Sem descrição disponível."}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center text-muted-foreground">
                <Tag className="h-4 w-4 mr-2" />
                {plan.topic?.name || "Sem tema"}
              </div>
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                Prazo: {plan.due_date || "Não definido"}
              </div>
              {plan.source_report_id && (
                <div className="flex items-center text-muted-foreground">
                  <FileText className="h-4 w-4 mr-2" />
                  Origem: Relatório de Mobilização
                </div>
              )}
              <div className="flex items-center ml-auto gap-2">
                <Badge variant={plan.priority === 'high' ? 'destructive' : 'default'}>
                  Prioridade {plan.priority}
                </Badge>
                <Badge variant="outline">
                  {plan.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-center h-full space-y-2">
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Criado em</div>
            <div className="text-sm">{formatDateTime(plan.created_at)}</div>
            <div className="text-xs text-muted-foreground italic truncate">{plan.created_by_email}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-2xl font-black">{plan.items.length}</div>
            <div className="text-xs text-muted-foreground uppercase font-bold">Total de Itens</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-black text-green-700">{plan.items.filter(i => i.status === 'done').length}</div>
            <div className="text-xs text-muted-foreground uppercase font-bold">Concluídos</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-black text-blue-700">
              {/* Note: In a real app we'd fetch this count from getExecutionSummaryForPlan */}
              {plan.items.filter(i => (i as any).action_item_results).length}
            </div>
            <div className="text-xs text-muted-foreground uppercase font-bold">Com Resultado</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6 text-right">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/api/action-plans/${plan.id}/execution-export`} />}
            >
              <FileText className="h-4 w-4 mr-2" /> Exportar Execução
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex items-center p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
        <AlertTriangle className="h-4 w-4 mr-2" />
        Lembrete: Ações devem priorizar transparência, escuta presencial e resposta pública.
      </div>

      <KanbanBoard planId={plan.id} initialItems={plan.items} />
    </AppShell>
  );
}
