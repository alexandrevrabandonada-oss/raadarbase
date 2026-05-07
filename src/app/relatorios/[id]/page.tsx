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
  const topTopics = snapshot.topTopics?.length ? snapshot.topTopics : report.topics ?? [];
  const topPosts = snapshot.topPosts ?? [];
  const pendingThemes = snapshot.pendingThemes ?? [];
  const publicRecommendations = snapshot.publicRecommendations ?? [];
  const confirmedThemes = snapshot.totals?.confirmedThemes ?? topTopics.filter((rt: any) => rt.source_breakdown?.operator_confirmed > 0).length;
  const totals = snapshot.totals ?? {
    postsAnalyzed: 0,
    interactionsAnalyzed: snapshot.totalInteractions ?? 0,
    uniquePeople: snapshot.uniquePeople ?? 0,
    themesDetected: topTopics.length,
    confirmedThemes,
    pendingThemes: pendingThemes.length,
  };
  const periodStart = snapshot.period?.start ?? report.period_start;
  const periodEnd = snapshot.period?.end ?? report.period_end;

  return (
    <AppShell>
      <PageHeader
        title={report.title}
        description={`Período: ${periodStart} a ${periodEnd}. Criado por ${report.created_by_email}.`}
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
            <CardTitle className="text-xs uppercase text-muted-foreground">Posts analisados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{totals.postsAnalyzed ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Interações analisadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{totals.interactionsAnalyzed ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Pessoas públicas únicas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{totals.uniquePeople ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Temas detectados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{totals.themesDetected ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Temas confirmados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{totals.confirmedThemes ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Temas pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{totals.pendingThemes ?? 0}</p>
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
              {topTopics.map((rt: any) => (
                <div key={rt.id ?? rt.topic_id ?? rt.topic?.name} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-semibold">{rt.topic.name}</p>
                    <p className="text-xs text-muted-foreground">{rt.people_count} pessoas públicas únicas; {rt.post_count ?? 0} posts relacionados</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black">{rt.interaction_count}</p>
                    <p className="text-xs text-muted-foreground">interações</p>
                  </div>
                </div>
              ))}
              {topTopics.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground italic">
                  Nenhum dado de pauta gerado.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recomendações públicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {publicRecommendations.map((item: string) => (
              <div key={item} className="rounded-md border p-3">
                {item}
              </div>
            ))}
            {publicRecommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sem recomendações registradas.</p>
            ) : null}
          </CardContent>
        </Card>

        {/* Recomendações Neutras */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Posts com maior volume de comentários</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {topPosts.map((post: any) => (
              <div key={post.post_id} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{post.shortcode ?? post.post_id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{post.comment_count} comentários analisados</p>
                  </div>
                  <Badge variant="outline">{post.topic_names.length} temas</Badge>
                </div>
                {post.caption_excerpt ? <p className="mt-3 text-sm text-muted-foreground">{post.caption_excerpt}</p> : null}
              </div>
            ))}
            {topPosts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground italic md:col-span-2 xl:col-span-3">
                Nenhum post com volume suficiente para destaque.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Comentários Representativos (Sanitizados) */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Comentários representativos sanitizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {snapshot.representativeComments?.map((comment: any, idx: number) => (
                <div key={idx} className="rounded-md bg-muted p-3 text-sm italic border-l-4 border-primary">
                  &quot;{comment.text}&quot;
                  <p className="mt-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                    {formatDateTime(comment.occurredAt)}
                  </p>
                  {comment.postShortcode ? <p className="mt-1 text-[10px] text-muted-foreground">Post: {comment.postShortcode}</p> : null}
                  {comment.topicNames?.length ? <p className="mt-1 text-[10px] text-muted-foreground">Temas: {comment.topicNames.join(", ")}</p> : null}
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

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Temas pendentes de revisão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingThemes.map((item: any) => (
              <div key={item.interactionId} className="rounded-md border p-4">
                <p className="text-sm italic">&quot;{item.excerpt}&quot;</p>
                <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {formatDateTime(item.occurredAt)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Sugestão por regra: {item.suggestedTopicNames.length ? item.suggestedTopicNames.join(", ") : "Sem sugestão automática"}
                </p>
              </div>
            ))}
            {pendingThemes.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground italic">Nenhuma interação pendente de revisão.</p>
            ) : null}
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
