import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listTopicCategories, getPendingTopicReviews } from "@/lib/data/topics";
import { formatDateTime } from "@/lib/mock-data";
import { ReviewControls } from "./review-controls";
import { suggestTopicsForText } from "@/lib/topics/rules";

export const dynamic = "force-dynamic";

export default async function RevisaoTemasPage() {
  await requireInternalPageSession("/temas/revisao");

  const [allTopics, pendingInteractions] = await Promise.all([
    listTopicCategories(),
    getPendingTopicReviews(50),
  ]);

  return (
    <AppShell>
      <PageHeader
        title="Fila de Revisão de Temas"
        description="Confirme ou ajuste os temas sugeridos automaticamente para interações públicas."
      />

      <div className="space-y-6">
        {pendingInteractions.map((interaction) => {
          const suggestions = suggestTopicsForText(interaction.text_content);
          const suggestedTopics = suggestions
            .map(s => allTopics.find(t => t.slug === s.slug))
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            .filter((t): t is any => !!t);

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
                  />
                </div>

                {interaction.tags && interaction.tags.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Temas atuais
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(interaction.tags as any[]).map((tag) => (
                        <Badge key={tag.topic.id} variant="secondary">
                          {tag.topic.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}

        {pendingInteractions.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Nenhuma interação pendente de revisão.
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
