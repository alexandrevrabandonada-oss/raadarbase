import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listTopicCategories, getPendingTopicReviews } from "@/lib/data/topics";
import type { TopicCategoryRow } from "@/lib/data/topics";
import { formatDateTime } from "@/lib/mock-data";
import { ReviewControls } from "./review-controls";
import { suggestTopicsForText } from "@/lib/topics/rules";
import { getMobilizationReport, listMobilizationReports } from "@/lib/data/reports";

export const dynamic = "force-dynamic";

type ReviewReportSnapshot = {
  period?: {
    start?: string | null;
    end?: string | null;
  };
  totals?: {
    themesDetected?: number;
    confirmedThemes?: number;
    pendingThemes?: number;
  };
  topTopics?: Array<{
    topic_id: string;
    topic?: { name?: string } | null;
    interaction_count?: number;
    post_count?: number;
    people_count?: number;
  }>;
};

export default async function RevisaoTemasPage() {
  await requireInternalPageSession("/temas/revisao");

  const [allTopics, reports] = await Promise.all([listTopicCategories(), listMobilizationReports()]);
  const generatedReports = reports.filter((report) => report.status === "generated");
type ReviewTopicSummary = {
  topic_id: string;
  topic?: { name?: string } | null;
  source_breakdown?: {
    operator_confirmed?: number;
  };
};
  const selectedReport =
    generatedReports.find((report) => report.title === "Primeiro relatório real do Instagram") ?? generatedReports[0] ?? null;
  const detailedReport = selectedReport ? await getMobilizationReport(selectedReport.id) : null;
  const snapshot = (detailedReport?.snapshot as ReviewReportSnapshot | null) ?? null;
  const periodStart = snapshot?.period?.start ?? detailedReport?.period_start ?? null;
  const periodEnd = snapshot?.period?.end ?? detailedReport?.period_end ?? null;
  const pendingInteractions = await getPendingTopicReviews(50, { start: periodStart, end: periodEnd });

  const topicRank = new Map<string, number>();
  (snapshot?.topTopics ?? detailedReport?.topics ?? []).forEach((topic, index) => {
    topicRank.set(topic.topic?.name ?? topic.topic_id, 100 - index);
  });

  const prioritizedPendingInteractions = pendingInteractions
    .map((interaction) => {
      const suggestions = suggestTopicsForText(interaction.text_content);
      const suggestedTopics = suggestions
        .map((s) => allTopics.find((t) => t.slug === s.slug))
        .filter((t): t is TopicCategoryRow => Boolean(t));
      const priorityScore = suggestedTopics.reduce((score, topic) => score + (topicRank.get(topic.name) ?? 0), 0);

      return { interaction, suggestedTopics, priorityScore };
    })
    .sort((left, right) => {
      if (right.priorityScore !== left.priorityScore) return right.priorityScore - left.priorityScore;
      return (Date.parse(right.interaction.occurred_at) || 0) - (Date.parse(left.interaction.occurred_at) || 0);
    })
    .slice(0, 10);

  const totalThemes = snapshot?.totals?.themesDetected ?? detailedReport?.topics?.length ?? 0;
  const confirmedThemes =
    snapshot?.totals?.confirmedThemes ??
    ((detailedReport?.topics ?? []).filter((topic: ReviewTopicSummary) => (topic.source_breakdown?.operator_confirmed ?? 0) > 0).length);
  const pendingThemes = snapshot?.totals?.pendingThemes ?? 0;

  return (
    <AppShell>
      <PageHeader
        title="Fila de Revisão de Temas"
        description={
          periodStart && periodEnd
            ? `Revise interações públicas do período ${periodStart} a ${periodEnd}, com sugestões automáticas sempre explícitas.`
            : "Revise interações públicas sem tema confirmado, com sugestões automáticas sempre explícitas."
        }
      />

      {selectedReport ? (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Relatório base</p>
                <h2 className="mt-1 text-xl font-black">{selectedReport.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Período: {periodStart ?? "-"} a {periodEnd ?? "-"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button nativeButton={false} variant="outline" render={<Link href={`/relatorios/${selectedReport.id}`} />}>
                  Abrir relatório
                </Button>
                <Button nativeButton={false} variant="outline" render={<Link href={`/acoes/novo?reportId=${selectedReport.id}`} />}>
                  Criar plano público
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs uppercase text-muted-foreground">Temas detectados</p>
                <p className="text-xl font-black">{totalThemes}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs uppercase text-muted-foreground">Confirmados</p>
                <p className="text-xl font-black">{confirmedThemes}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs uppercase text-muted-foreground">Pendentes</p>
                <p className="text-xl font-black">{pendingThemes}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs uppercase text-muted-foreground">Interações priorizadas</p>
                <p className="text-xl font-black">{prioritizedPendingInteractions.length}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(snapshot?.topTopics ?? detailedReport?.topics ?? []).map((topic) => (
                <Badge key={topic.topic_id} variant="secondary">
                  {topic.topic?.name ?? topic.topic_id}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-6">
        {prioritizedPendingInteractions.map(({ interaction, suggestedTopics }) => {
          const currentTopics = (interaction.tags as Array<{ topic?: TopicCategoryRow | null; topic_id?: string; source?: string }> | undefined) ?? [];

          return (
            <Card key={interaction.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    {interaction.type} • {formatDateTime(interaction.occurred_at)}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    ID: {interaction.id.substring(0, 8)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-muted p-3 text-sm italic">
                  &quot;{interaction.text_content || "(Sem texto)"}&quot;
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ações recomendadas
                  </p>
                  <ReviewControls 
                    interactionId={interaction.id}
                    suggestedTopics={suggestedTopics}
                    allTopics={allTopics}
                    currentTopics={currentTopics}
                  />
                </div>

                {interaction.tags && interaction.tags.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Temas atuais
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(interaction.tags as Array<{ topic?: TopicCategoryRow | null; topic_id?: string }>).map((tag) => (
                        <Badge key={tag.topic?.id ?? tag.topic_id} variant="secondary">
                          {tag.topic?.name ?? "Tema"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}

        {prioritizedPendingInteractions.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Nenhuma interação pendente de revisão.
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
