/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { getMobilizationReport } from "@/lib/data/reports";
import { formatDateTime } from "@/lib/mock-data";
import { AlertCircle, ArrowRight } from "lucide-react";
import { ReportControls } from "./report-controls";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DetalheRelatorioPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  await requireInternalPageSession(`/relatorios/${id}`);

  const report = await getMobilizationReport(id);
  if (!report) notFound();

  const snapshot = report.snapshot as any;

  return (
    <AppShell>
      <PageHeader
        title={report.title}
        description={`Período: ${report.period_start} a ${report.period_end}. Criado por ${report.created_by_email}.`}
      />

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={report.status === 'generated' ? 'default' : 'outline'}>
            Status: {report.status}
          </Badge>
          {report.generated_at && (
            <span className="text-xs text-muted-foreground italic">
              Gerado em {formatDateTime(report.generated_at)}
            </span>
          )}
        </div>
        
        <ReportControls reportId={report.id} status={report.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Métricas Rápidas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Total de Interações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{snapshot.totalInteractions || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Temas Mobilizados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{report.topics?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Geração</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{report.status === 'generated' ? "Completo" : "Pendente"}</p>
          </CardContent>
        </Card>

        {/* Temas Mais Mobilizados */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Engajamento por Pauta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.topics?.map((rt: any) => (
                <div key={rt.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-semibold">{rt.topic.name}</p>
                    <p className="text-xs text-muted-foreground">{rt.people_count} perfis diferentes interagiram</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black">{rt.interaction_count}</p>
                    <p className="text-xs text-muted-foreground">interações</p>
                  </div>
                </div>
              ))}
              {(!report.topics || report.topics.length === 0) && (
                <p className="py-8 text-center text-sm text-muted-foreground italic">
                  Nenhum dado de pauta gerado. Clique em &quot;Gerar Dados&quot; para processar.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recomendações Neutras */}
        <Card>
          <CardHeader>
            <CardTitle>Recomendações Operacionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border p-3 text-sm">
              <p className="font-bold">Responder Pautas Ativas</p>
              <p className="text-xs text-muted-foreground mt-1">Existem interações sem resposta nos temas mais mobilizados.</p>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <p className="font-bold">Aprofundar Escuta</p>
              <p className="text-xs text-muted-foreground mt-1">O volume de interações em alguns temas sugere necessidade de post explicativo.</p>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <p className="font-bold">Reunião de Pauta</p>
              <p className="text-xs text-muted-foreground mt-1">Levar os dados de mobilização para a próxima plenária/reunião.</p>
            </div>
          </CardContent>
        </Card>

        {/* Comentários Representativos (Sanitizados) */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Sinais da Escuta (Comentários)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {snapshot.representativeComments?.map((comment: any, idx: number) => (
                <div key={idx} className="rounded-md bg-muted p-3 text-sm italic border-l-4 border-primary">
                  &quot;{comment.text}&quot;
                  <p className="mt-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                    {formatDateTime(comment.occurredAt)}
                  </p>
                </div>
              ))}
              {(!snapshot.representativeComments || snapshot.representativeComments.length === 0) && (
                <p className="py-8 text-center text-sm text-muted-foreground italic col-span-full">
                  Sem amostras de escuta disponíveis.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {(report as any).action_plans?.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-black mb-4">Planos de Ação Vinculados</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {(report as any).action_plans.map((plan: any) => (
              <Card key={plan.id}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold">{plan.title}</CardTitle>
                    <Badge variant="outline" className="mt-1">{plan.status}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/acoes/${plan.id}`} />}>
                    Ver Plano <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="rounded-md bg-muted p-2">
                      <div className="text-xl font-black">{plan.items.filter((i: any) => i.status === 'done').length} / {plan.items.length}</div>
                      <div className="text-[10px] uppercase text-muted-foreground font-bold">Itens Concluídos</div>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <div className="text-xl font-black text-green-600">{plan.items.filter((i: any) => i.action_item_results).length}</div>
                      <div className="text-[10px] uppercase text-muted-foreground font-bold">Resultados</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="mt-6 border-blue-500/20 bg-blue-50/50">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <strong>Aviso de Governança:</strong> Este documento é interno e destina-se ao planejamento
            operacional de pautas públicas. É proibido o uso destes dados para perfilamento político,
            segmentação eleitoral sensível ou microtargeting individual.
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
